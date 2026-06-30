from dataclasses import dataclass
from functools import lru_cache
import os

import psycopg2
from psycopg2 import OperationalError
from dotenv import load_dotenv
import pulp
from pydantic import BaseModel
from fastapi import Depends, FastAPI, Header, HTTPException, status


load_dotenv()


@dataclass(frozen=True)
class Settings:
    db_host: str = os.getenv("DB_HOST", "host.docker.internal")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_database: str = os.getenv("DB_DATABASE", "faculty_mcdss")
    db_username: str = os.getenv("DB_USERNAME", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "mcdss_password")
    fastapi_secret_key: str = os.getenv("FASTAPI_SECRET_KEY", "changeme")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def verify_service_key(
    x_service_key: str = Header(default="", alias="X-Service-Key"),
) -> None:
    settings = get_settings()
    if x_service_key != settings.fastapi_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service key",
        )


def create_readonly_connection():
    settings = get_settings()
    connection = psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        dbname=settings.db_database,
        user=settings.db_username,
        password=settings.db_password,
    )
    connection.set_session(readonly=True, autocommit=True)
    return connection


app = FastAPI(title="MCDSS Compute Service")


class HealthResponse(BaseModel):
    status: str


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str
    host: str
    reachable: bool
    error: str | None = None


class PositionCapacity(BaseModel):
    position_id: int
    capacity: int


class ApplicantPreference(BaseModel):
    position_id: int
    score: float


class ApplicantInput(BaseModel):
    applicant_id: int
    preferences: list[ApplicantPreference]


class AssignmentPreviewRequest(BaseModel):
    positions: list[PositionCapacity]
    applicants: list[ApplicantInput]


class AssignmentItem(BaseModel):
    applicant_id: int
    position_id: int
    score: float


class AssignmentPreviewResponse(BaseModel):
    status: str
    objective_score: float
    assignments: list[AssignmentItem]


class RankingApplicantInput(BaseModel):
    applicant_id: int
    score: float


class RankingPreviewRequest(BaseModel):
    position_id: int
    applicants: list[RankingApplicantInput]


class RankingItem(BaseModel):
    rank: int
    applicant_id: int
    score: float


class RankingPreviewResponse(BaseModel):
    status: str
    position_id: int
    rankings: list[RankingItem]


@app.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/internal/db-health", dependencies=[Depends(verify_service_key)])
def db_health() -> DatabaseHealthResponse:
    settings = get_settings()
    connection = None
    try:
        connection = create_readonly_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unavailable",
                "database": settings.db_database,
                "host": settings.db_host,
                "reachable": False,
                "error": str(exc).splitlines()[0],
            },
        ) from exc
    finally:
        if connection is not None:
            connection.close()

    return DatabaseHealthResponse(
        status="ok",
        database=settings.db_database,
        host=settings.db_host,
        reachable=True,
    )


@app.get("/internal/ping", dependencies=[Depends(verify_service_key)])
def internal_ping() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/internal/assignments/preview", dependencies=[Depends(verify_service_key)])
def preview_assignments(payload: AssignmentPreviewRequest) -> AssignmentPreviewResponse:
    position_capacities = {item.position_id: item.capacity for item in payload.positions}
    candidate_scores: dict[tuple[int, int], float] = {}

    for applicant in payload.applicants:
        for preference in applicant.preferences:
            candidate_scores[(applicant.applicant_id, preference.position_id)] = preference.score

    problem = pulp.LpProblem("mcdss_assignment_preview", pulp.LpMaximize)
    decision_variables: dict[tuple[int, int], pulp.LpVariable] = {}

    for (applicant_id, position_id), score in candidate_scores.items():
        decision_variables[(applicant_id, position_id)] = pulp.LpVariable(
            f"assign_{applicant_id}_{position_id}",
            lowBound=0,
            upBound=1,
            cat="Binary",
        )

    problem += pulp.lpSum(
        score * decision_variables[(applicant_id, position_id)]
        for (applicant_id, position_id), score in candidate_scores.items()
    )

    for applicant in payload.applicants:
        problem += pulp.lpSum(
            decision_variables[(applicant.applicant_id, preference.position_id)]
            for preference in applicant.preferences
            if (applicant.applicant_id, preference.position_id) in decision_variables
        ) <= 1

    for position_id, capacity in position_capacities.items():
        problem += pulp.lpSum(
            decision_variables[(applicant.applicant_id, position_id)]
            for applicant in payload.applicants
            if (applicant.applicant_id, position_id) in decision_variables
        ) <= capacity

    solver = pulp.PULP_CBC_CMD(msg=False)
    problem.solve(solver)

    assignments: list[AssignmentItem] = []
    for (applicant_id, position_id), variable in decision_variables.items():
        if pulp.value(variable) == 1:
            assignments.append(
                AssignmentItem(
                    applicant_id=applicant_id,
                    position_id=position_id,
                    score=candidate_scores[(applicant_id, position_id)],
                )
            )

    objective_score = float(pulp.value(problem.objective) or 0)

    return AssignmentPreviewResponse(
        status="ok",
        objective_score=objective_score,
        assignments=assignments,
    )


@app.post("/internal/rankings/preview", dependencies=[Depends(verify_service_key)])
def preview_rankings(payload: RankingPreviewRequest) -> RankingPreviewResponse:
    ordered_applicants = sorted(
        payload.applicants,
        key=lambda applicant: (-applicant.score, applicant.applicant_id),
    )

    rankings = [
        RankingItem(rank=index, applicant_id=applicant.applicant_id, score=applicant.score)
        for index, applicant in enumerate(ordered_applicants, start=1)
    ]

    return RankingPreviewResponse(
        status="ok",
        position_id=payload.position_id,
        rankings=rankings,
    )
