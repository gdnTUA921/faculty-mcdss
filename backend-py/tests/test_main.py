from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app


client = TestClient(app)


class FakeCursor:
    def __init__(self):
        self.executed = False

    def execute(self, query):
        self.executed = True
        assert query == "SELECT 1"

    def fetchone(self):
        return (1,)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def close(self):
        self.closed = True


def test_health_endpoint_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_internal_ping_rejects_missing_service_key():
    response = client.get("/internal/ping")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid service key"}


def test_internal_ping_accepts_service_key():
    response = client.get("/internal/ping", headers={"X-Service-Key": "changeme"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_db_health_returns_ok_when_database_is_reachable(monkeypatch):
    fake_connection = FakeConnection()
    monkeypatch.setattr("main.create_readonly_connection", lambda: fake_connection)

    response = client.get("/internal/db-health", headers={"X-Service-Key": "changeme"})

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "faculty_mcdss",
        "host": "host.docker.internal",
        "reachable": True,
        "error": None,
    }
    assert fake_connection.closed is True
    assert fake_connection.cursor_instance.executed is True


def test_assignment_preview_returns_best_matches():
    payload = {
        "positions": [
            {"position_id": 1, "capacity": 1},
            {"position_id": 2, "capacity": 1},
        ],
        "applicants": [
            {
                "applicant_id": 101,
                "preferences": [
                    {"position_id": 1, "score": 95},
                    {"position_id": 2, "score": 80},
                ],
            },
            {
                "applicant_id": 102,
                "preferences": [
                    {"position_id": 1, "score": 70},
                    {"position_id": 2, "score": 99},
                ],
            },
        ],
    }

    response = client.post(
        "/internal/assignments/preview",
        headers={"X-Service-Key": "changeme"},
        json=payload,
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "objective_score": 194.0,
        "assignments": [
            {"applicant_id": 101, "position_id": 1, "score": 95.0},
            {"applicant_id": 102, "position_id": 2, "score": 99.0},
        ],
    }
