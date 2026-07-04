import io
from pathlib import Path
import sys

from fastapi.testclient import TestClient
from docx import Document

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


def test_ranking_preview_orders_applicants_by_score():
    payload = {
        "position_id": 7,
        "applicants": [
            {"applicant_id": 301, "score": 88.5},
            {"applicant_id": 302, "score": 95.0},
            {"applicant_id": 303, "score": 95.0},
        ],
    }

    response = client.post(
        "/internal/rankings/preview",
        headers={"X-Service-Key": "changeme"},
        json=payload,
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "position_id": 7,
        "rankings": [
            {"rank": 1, "applicant_id": 302, "score": 95.0},
            {"rank": 2, "applicant_id": 303, "score": 95.0},
            {"rank": 3, "applicant_id": 301, "score": 88.5},
        ],
    }


def build_docx_bytes(lines):
    document = Document()
    for line in lines:
        document.add_paragraph(line)

    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def test_parse_resume_rejects_missing_service_key():
    response = client.post(
        "/parse-resume",
        files={"file": ("resume.pdf", b"%PDF-1.4", "application/pdf")},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid service key"}


def test_parse_resume_extracts_structured_data_from_docx():
    resume_bytes = build_docx_bytes(
        [
            "Jane Marie Doe",
            "jane.doe@example.com",
            "+1 (555) 123-4567",
            "",
            "Education",
            "- B.S. Computer Science, University of Example, 2022",
            "",
            "Work Experience",
            "- Software Engineer at Example Labs, Jan 2021 - Present",
            "",
            "Certifications",
            "- AWS Certified Solutions Architect",
            "",
            "Publications",
            "- Doe, J. (2024). Resume Parsing with Rules. Journal of Examples.",
        ]
    )

    response = client.post(
        "/parse-resume",
        headers={"X-Service-Key": "changeme"},
        files={
            "file": (
                "resume.docx",
                resume_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "name": "Jane Marie Doe",
        "email": "jane.doe@example.com",
        "phone": "+1 (555) 123-4567",
        "education": [
            {
                "raw_text": "B.S. Computer Science, University of Example, 2022",
            }
        ],
        "work_experience": [
            {
                "raw_text": "Software Engineer at Example Labs, Jan 2021 - Present",
            }
        ],
        "certifications": [
            {
                "raw_text": "AWS Certified Solutions Architect",
            }
        ],
        "publications": [
            {
                "raw_text": "Doe, J. (2024). Resume Parsing with Rules. Journal of Examples.",
            }
        ],
    }


def test_parse_resume_accepts_pdf_upload(monkeypatch):
    monkeypatch.setattr(
        "main.extract_text_from_pdf",
        lambda file_bytes: (
            "John Q. Public\n"
            "john.public@example.com\n"
            "(555) 222-3333\n\n"
            "Education\n"
            "- Master of Science in Data Science, University of Sample, 2023"
        ),
    )

    response = client.post(
        "/parse-resume",
        headers={"X-Service-Key": "changeme"},
        files={"file": ("resume.pdf", b"%PDF-1.4\nfake", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "john.public@example.com"
    assert response.json()["education"] == [
        {"raw_text": "Master of Science in Data Science, University of Sample, 2023"}
    ]
