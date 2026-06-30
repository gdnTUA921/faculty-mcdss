from dataclasses import dataclass
from functools import lru_cache
import os

import psycopg2
from dotenv import load_dotenv
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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/internal/ping", dependencies=[Depends(verify_service_key)])
def internal_ping() -> dict[str, str]:
    return {"status": "ok"}
