import io
import os
import re
from dataclasses import dataclass
from functools import lru_cache

import psycopg2
from dotenv import load_dotenv
from docx import Document
from fastapi import Depends, File, FastAPI, Header, HTTPException, UploadFile, status
from psycopg2 import OperationalError
import pulp
import spacy
from pydantic import BaseModel, Field
from pypdf import PdfReader


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


@lru_cache(maxsize=1)
def get_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except Exception:
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
        return nlp


SECTION_ALIASES: dict[str, tuple[str, ...]] = {
    "education": (
        "education",
        "educational background",
        "academic background",
        "academic qualifications",
        "qualifications",
    ),
    "work_experience": (
        "work experience",
        "professional experience",
        "experience",
        "employment history",
        "work history",
        "career history",
    ),
    "certifications": (
        "certifications",
        "certificates",
        "licenses",
        "licensure",
        "professional certifications",
        "training",
    ),
    "publications": (
        "publications",
        "selected publications",
        "research publications",
        "papers",
        "journal publications",
    ),
}

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_PATTERN = re.compile(
    r"(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}(?!\w)"
)
DATE_PATTERN = re.compile(
    r"(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b|\b\d{4}\b)(?:\s*(?:-|–|—|to)\s*(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b|\b\d{4}\b|present|current))?",
    re.IGNORECASE,
)


class ResumeEntry(BaseModel):
    raw_text: str


class ParsedResumeData(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    education: list[ResumeEntry] = Field(default_factory=list)
    work_experience: list[ResumeEntry] = Field(default_factory=list)
    certifications: list[ResumeEntry] = Field(default_factory=list)
    publications: list[ResumeEntry] = Field(default_factory=list)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_heading(value: str) -> str:
    return normalize_text(value).rstrip(":;-–—").lower()


def is_section_heading(value: str) -> str | None:
    heading = normalize_heading(value)
    for canonical_name, aliases in SECTION_ALIASES.items():
        if heading in aliases:
            return canonical_name
    return None


def extract_email(text: str) -> str | None:
    match = EMAIL_PATTERN.search(text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    match = PHONE_PATTERN.search(text)
    if not match:
        return None

    return normalize_text(match.group(0))


def looks_like_contact_line(value: str) -> bool:
    lowered = value.lower()
    return bool(
        EMAIL_PATTERN.search(value)
        or PHONE_PATTERN.search(value)
        or "linkedin.com" in lowered
        or "github.com" in lowered
        or lowered.startswith("http://")
        or lowered.startswith("https://")
    )


def extract_name(text: str) -> str | None:
    preview_lines = [line.strip() for line in text.splitlines()[:20] if line.strip()]
    preview_text = "\n".join(preview_lines)[:2000]
    document = get_nlp()(preview_text)

    for entity in document.ents:
        if entity.label_ == "PERSON":
            candidate = normalize_text(entity.text)
            if 2 <= len(candidate.split()) <= 5:
                return candidate

    for line in preview_lines:
        cleaned = normalize_text(line).strip("-•*|")
        if not cleaned or looks_like_contact_line(cleaned):
            continue
        if is_section_heading(cleaned):
            continue
        if 2 <= len(cleaned.split()) <= 6 and sum(character.isalpha() for character in cleaned) >= 4:
            return cleaned

    return None


def extract_resume_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {name: [] for name in SECTION_ALIASES}
    current_section: str | None = None
    current_lines: list[str] = []

    def flush_current_section() -> None:
        nonlocal current_lines
        if current_section and current_lines:
            section_text = "\n".join(current_lines).strip()
            if section_text:
                sections[current_section].append(section_text)
        current_lines = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            if current_lines and current_lines[-1] != "":
                current_lines.append("")
            continue

        section_name = is_section_heading(line)
        if section_name:
            flush_current_section()
            current_section = section_name
            continue

        if current_section is None:
            continue

        current_lines.append(line)

    flush_current_section()
    return sections


def split_section_entries(section_text: str) -> list[str]:
    working_text = section_text.replace("\r\n", "\n")
    working_text = re.sub(r"^[\s\u2022•*\-\d\.)]+", "", working_text, flags=re.MULTILINE)
    chunks = re.split(r"\n\s*(?=(?:[-*•]|\d+[.)])\s+)", working_text)

    if len(chunks) == 1:
        chunks = re.split(r"\n\s*\n+", working_text)

    entries = [normalize_text(chunk.strip(" -•*\t\n\r")) for chunk in chunks]
    return [entry for entry in entries if entry]


def parse_section_entries(section_texts: list[str]) -> list[ResumeEntry]:
    entries: list[ResumeEntry] = []
    for section_text in section_texts:
        for entry_text in split_section_entries(section_text):
            entries.append(ResumeEntry(raw_text=entry_text))
    return entries


def extract_resume_data(text: str) -> ParsedResumeData:
    sections = extract_resume_sections(text)
    return ParsedResumeData(
        name=extract_name(text),
        email=extract_email(text),
        phone=extract_phone(text),
        education=parse_section_entries(sections["education"]),
        work_experience=parse_section_entries(sections["work_experience"]),
        certifications=parse_section_entries(sections["certifications"]),
        publications=parse_section_entries(sections["publications"]),
    )


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text:
            pages.append(page_text)
    return "\n".join(pages).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text).strip()


def resolve_resume_file_type(upload: UploadFile) -> str | None:
    filename = (upload.filename or "").lower()
    content_type = (upload.content_type or "").lower()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        return "pdf"

    if filename.endswith(".docx") or content_type in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-word.document.macroenabled.12",
        "application/msword",
    }:
        return "docx"

    return None


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


@app.post("/parse-resume", dependencies=[Depends(verify_service_key)])
async def parse_resume(file: UploadFile = File(...)) -> ParsedResumeData:
    file_type = resolve_resume_file_type(file)
    if file_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a PDF or DOCX resume",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    try:
        if file_type == "pdf":
            resume_text = extract_text_from_pdf(file_bytes)
        else:
            resume_text = extract_text_from_docx(file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to extract resume text: {str(exc).splitlines()[0]}",
        ) from exc

    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text found in resume",
        )

    return extract_resume_data(resume_text)


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
