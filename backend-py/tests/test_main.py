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


class FakeWorkloadCursor:
    def __init__(self, course_rows, faculty_rows, expertise_rows):
        self.course_rows = course_rows
        self.faculty_rows = faculty_rows
        self.expertise_rows = expertise_rows
        self.execution_count = 0

    def execute(self, query, params=None):
        self.execution_count += 1

    def fetchall(self):
        if self.execution_count == 1:
            return self.course_rows
        if self.execution_count == 2:
            return self.faculty_rows
        return self.expertise_rows

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeWorkloadConnection:
    def __init__(self, course_rows, faculty_rows, expertise_rows):
        self.cursor_instance = FakeWorkloadCursor(course_rows, faculty_rows, expertise_rows)
        self.closed = False
        self.executed_statements = []

    def cursor(self):
        return self.cursor_instance

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def close(self):
        self.closed = True


class FakeWriteCursor:
    def __init__(self):
        self.executed_statements = []

    def execute(self, query, params=None):
        self.executed_statements.append((query, params))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeWriteConnection:
    def __init__(self):
        self.cursor_instance = FakeWriteCursor()
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def close(self):
        self.closed = True


class FakeAssignmentCursor:
    def __init__(self, rows):
        self.rows = rows
        self.executed_query = None
        self.executed_params = None

    def execute(self, query, params):
        self.executed_query = query
        self.executed_params = params

    def fetchall(self):
        return self.rows

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class FakeAssignmentConnection:
    def __init__(self, rows):
        self.cursor_instance = FakeAssignmentCursor(rows)
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


def test_run_assignment_solves_from_database_scores(monkeypatch):


    def test_run_faculty_workload_solves_course_allocations(monkeypatch):
        fake_connection = FakeWorkloadConnection(
            [
                (
                    "11111111-1111-1111-1111-111111111111",
                    "dddddddd-dddd-dddd-dddd-dddddddddddd",
                    "CS101",
                    "Foundations of Computing",
                    3,
                    1,
                ),
                (
                    "22222222-2222-2222-2222-222222222222",
                    "dddddddd-dddd-dddd-dddd-dddddddddddd",
                    "CS102",
                    "Programming Basics",
                    3,
                    1,
                ),
            ],
            [
                ("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", 6),
                ("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", 3),
            ],
            [
                ("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "11111111-1111-1111-1111-111111111111", 0.9),
                ("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "22222222-2222-2222-2222-222222222222", 0.8),
                ("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "11111111-1111-1111-1111-111111111111", 0.2),
                ("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "22222222-2222-2222-2222-222222222222", 0.1),
            ],
        )
        monkeypatch.setattr("main.create_readonly_connection", lambda: fake_connection)
        fake_write_connection = FakeWriteConnection()
        monkeypatch.setattr("main.create_write_connection", lambda: fake_write_connection)

        response = client.post(
            "/run-faculty-workload",
            headers={"X-Service-Key": "changeme"},
            json={
                "hiring_round_id": "99999999-9999-9999-9999-999999999999",
                "semester": "1st Sem",
                "academic_year": 2026,
                "scope_department_ids": None,
            },
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["assigned_units"] == 6
        assert fake_connection.closed is True
        assert fake_write_connection.closed is True
        assert len(fake_write_connection.cursor_instance.executed_statements) >= 2
    fake_connection = FakeAssignmentConnection(
        [
            (
                "11111111-1111-1111-1111-111111111111",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                0.95,
                "applied",
                "external",
                "dddddddd-dddd-dddd-dddd-dddddddddddd",
                1,
            ),
            (
                "22222222-2222-2222-2222-222222222222",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "cccccccc-cccc-cccc-cccc-cccccccccccc",
                0.8,
                "for_review",
                "external",
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                1,
            ),
        ]
    )
    monkeypatch.setattr("main.create_readonly_connection", lambda: fake_connection)

    response = client.post(
        "/run-assignment",
        headers={"X-Service-Key": "changeme"},
        json={
            "hiring_round_id": "99999999-9999-9999-9999-999999999999",
            "scope_applicant_type": "external",
            "scope_position_ids": None,
            "scope_department_ids": None,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "objective_score": 0.95,
        "assigned_count": 1,
        "candidate_count": 2,
        "results": [
            {
                "application_id": "11111111-1111-1111-1111-111111111111",
                "applicant_profile_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "position_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "is_assigned": True,
                "objective_score": 0.95,
            },
            {
                "application_id": "22222222-2222-2222-2222-222222222222",
                "applicant_profile_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "position_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "is_assigned": False,
                "objective_score": 0.8,
            },
        ],
    }
    assert fake_connection.closed is True


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
    body = response.json()

    assert body["name"] == "Jane Marie Doe"
    assert body["email"] == "jane.doe@example.com"
    assert body["phone"] == "+1 (555) 123-4567"

    education = body["education"][0]
    assert education["raw_text"] == "B.S. Computer Science, University of Example, 2022"
    assert "B.S" in education["degree"]
    assert education["field_of_study"] == "Computer Science"
    assert education["institution"] == "University of Example"
    assert education["graduation_year"] == "2022"

    # Work Experience is exposed under the unified "experience" section.
    experience = body["experience"][0]
    assert experience["raw_text"] == "Software Engineer at Example Labs, Jan 2021 - Present"
    assert experience["position"] == "Software Engineer"
    assert experience["organization"] == "Example Labs"
    assert experience["start_date"] == "Jan 2021"
    assert experience["end_date"] == "Present"

    certification = body["certifications"][0]
    assert certification["raw_text"] == "AWS Certified Solutions Architect"
    assert certification["name"] == "AWS Certified Solutions Architect"

    assert body["publications"] == [
        {"raw_text": "Doe, J. (2024). Resume Parsing with Rules. Journal of Examples."}
    ]


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
    body = response.json()
    assert body["email"] == "john.public@example.com"

    education = body["education"][0]
    assert education["raw_text"] == "Master of Science in Data Science, University of Sample, 2023"
    assert education["degree"] == "Master of Science"
    assert education["field_of_study"] == "Data Science"
    assert education["institution"] == "University of Sample"
    assert education["graduation_year"] == "2023"


def test_parse_resume_extracts_expanded_sections(monkeypatch):
    monkeypatch.setattr(
        "main.extract_text_from_pdf",
        lambda file_bytes: (
            "Maria Santos\n"
            "maria.santos@example.com\n"
            "+63 917 555 1234\n"
            "linkedin.com/in/maria-santos | github.com/msantos\n"
            "Address: 12 Rizal Street, Quezon City, Philippines\n\n"
            "Teaching Experience\n"
            "Assistant Professor at State University, 2019 - Present\n"
            "- Delivered undergraduate lectures\n"
            "- Courses taught: Data Structures, Algorithms\n\n"
            "Certifications and Licenses\n"
            "- PRC Licensed Professional Teacher, issued by PRC, 2018, valid until 2027\n\n"
            "Skills\n"
            "Python, SQL, Curriculum Design\n\n"
            "Research Interests\n"
            "Machine Learning; Educational Data Mining\n\n"
            "Awards and Honors\n"
            "- Outstanding Faculty Award, 2022\n\n"
            "Professional Development\n"
            "- Outcome-Based Education Workshop, 2021"
        ),
    )

    response = client.post(
        "/parse-resume",
        headers={"X-Service-Key": "changeme"},
        files={"file": ("resume.pdf", b"%PDF-1.4\nfake", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["linkedin"] == "https://linkedin.com/in/maria-santos"
    assert body["portfolio"] == "https://github.com/msantos"
    assert body["address"] == "12 Rizal Street, Quezon City, Philippines"

    # Teaching Experience folds into the unified experience section.
    experience = body["experience"][0]
    assert experience["position"] == "Assistant Professor"
    assert experience["organization"] == "State University"
    assert experience["start_date"] == "2019"
    assert experience["end_date"] == "Present"
    assert "Delivered undergraduate lectures" in experience["responsibilities"]
    assert experience["courses_taught"] == ["Data Structures", "Algorithms"]

    certification = body["certifications"][0]
    assert certification["name"] == "PRC Licensed Professional Teacher"
    assert certification["expiration_date"] == "2027"

    assert body["skills"] == ["Python", "SQL", "Curriculum Design"]
    assert body["research_interests"] == ["Machine Learning", "Educational Data Mining"]
    assert body["awards"][0]["raw_text"] == "Outstanding Faculty Award, 2022"
    assert body["professional_development"][0]["raw_text"] == "Outcome-Based Education Workshop, 2021"
