import io
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal
from uuid import UUID, uuid4

import psycopg2
from dotenv import load_dotenv
from docx import Document
from fastapi import Depends, File, FastAPI, Header, HTTPException, UploadFile, status
from psycopg2.extras import Json
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


def create_write_connection():
    settings = get_settings()
    return psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        dbname=settings.db_database,
        user=settings.db_username,
        password=settings.db_password,
    )


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
        "educational attainment",
        "academic background",
        "academic qualifications",
        "qualifications",
    ),
    # Work, teaching, and academic experience are intentionally folded into one
    # unified "experience" section per the recruitment requirements.
    "experience": (
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "employment record",
        "work history",
        "career history",
        "teaching experience",
        "academic experience",
        "academic appointments",
        "professional background",
    ),
    # Certifications and licenses share a single section.
    "certifications": (
        "certifications",
        "certificates",
        "licenses",
        "licences",
        "licensure",
        "certifications and licenses",
        "certifications & licenses",
        "licenses and certifications",
        "licenses & certifications",
        "professional certifications",
        "professional licenses",
    ),
    "skills": (
        "skills",
        "technical skills",
        "core competencies",
        "competencies",
        "areas of expertise",
        "key skills",
        "skill set",
    ),
    "research_interests": (
        "research interests",
        "areas of research",
        "research focus",
        "research areas",
    ),
    "publications": (
        "publications",
        "selected publications",
        "research publications",
        "papers",
        "journal publications",
    ),
    "research_projects": (
        "research projects",
        "projects",
        "research grants",
        "grants",
        "funded research",
    ),
    "professional_development": (
        "professional development",
        "trainings",
        "training",
        "seminars",
        "workshops",
        "seminars and workshops",
        "seminars & workshops",
        "trainings and seminars",
        "workshops attended",
        "continuing education",
    ),
    "awards": (
        "awards",
        "honors",
        "honours",
        "awards and honors",
        "awards & honors",
        "honors and awards",
        "honours and awards",
        "awards and recognition",
        "achievements",
        "recognitions",
        "distinctions",
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

YEAR_PATTERN = re.compile(r"\b(?:19|20)\d{2}\b")
DATE_RANGE_PATTERN = re.compile(
    r"(?:present|current|(?:19|20)\d{2})\s*(?:-|–|—|to)\s*(?:present|current|(?:19|20)\d{2})",
    re.IGNORECASE,
)
SINGLE_DATE_PATTERN = re.compile(
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b(?:19|20)\d{2}\b",
    re.IGNORECASE,
)
BULLET_PREFIX = re.compile(r"^(?:[\-\*••]|\d+[.)])\s+")

LINKEDIN_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/[^\s,)\]]+", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[^\s,)\]]+", re.IGNORECASE)
URL_PATTERN = re.compile(r"(?:https?://|www\.)[^\s,)\]]+", re.IGNORECASE)

ADDRESS_LABEL_PATTERN = re.compile(
    r"^\s*(?:address|location|permanent address|home address|residence)\s*[:\-]\s*(.+)$",
    re.IGNORECASE,
)
ADDRESS_HINT_PATTERN = re.compile(
    r"\b(?:street|st\.|ave\.?|avenue|road|rd\.|blvd\.?|boulevard|barangay|brgy\.?|"
    r"subdivision|subd\.?|city|province|zip|postal|philippines)\b",
    re.IGNORECASE,
)

DEGREE_PATTERN = re.compile(
    r"\b(?:"
    r"ph\.?\s?d|doctor(?:ate)?|d\.?phil|ed\.?d|dba|d\.?sc"
    r"|master|m\.?s\.?c?|m\.?a|mba|m\.?eng|m\.?phil|msc|m\.?b\.?a"
    r"|bachelor|b\.?s\.?c?|b\.?a|b\.?eng|bsc|ab"
    r"|associate|diploma"
    r")\b"
    r"(?:\s+of\s+(?:science|arts|engineering|business(?:\s+administration)?|education|"
    r"laws?|philosophy|technology|[A-Za-z]+))?",
    re.IGNORECASE,
)
FIELD_IN_PATTERN = re.compile(
    r"\bin\s+([A-Za-z][A-Za-z&/\-. ]{2,60}?)(?:,|;|\.|\||\(|\bat\b|$)",
    re.IGNORECASE,
)
INSTITUTION_PATTERN = re.compile(
    r"\b(?:University|College|Institute|Polytechnic|Academy|Seminary|Conservatory|School)\b",
    re.IGNORECASE,
)

COURSES_LABEL_PATTERN = re.compile(r"courses?\s+taught\s*[:\-]?\s*(.+)", re.IGNORECASE)
CERT_ISSUER_PATTERN = re.compile(
    r"\b(?:issued\s+by|offered\s+by|by|from|through)\b\s+([A-Z][A-Za-z0-9&.,'\- ]{2,60})",
    re.IGNORECASE,
)
CERT_EXPIRY_PATTERN = re.compile(
    r"(?:exp(?:ires?|iry|iration)?|valid\s+(?:until|through|thru)|until)\s*[:\-]?\s*"
    r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|(?:19|20)\d{2})",
    re.IGNORECASE,
)


class ResumeEntry(BaseModel):
    raw_text: str


class EducationEntry(BaseModel):
    raw_text: str
    degree: str | None = None
    field_of_study: str | None = None
    institution: str | None = None
    graduation_year: str | None = None


class ExperienceEntry(BaseModel):
    raw_text: str
    position: str | None = None
    organization: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    courses_taught: list[str] = Field(default_factory=list)


class CertificationEntry(BaseModel):
    raw_text: str
    name: str | None = None
    issuer: str | None = None
    date_obtained: str | None = None
    expiration_date: str | None = None


class ParsedResumeData(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None
    education: list[EducationEntry] = Field(default_factory=list)
    # Unified Work + Teaching + Academic experience.
    experience: list[ExperienceEntry] = Field(default_factory=list)
    # Combined certifications and licenses.
    certifications: list[CertificationEntry] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    research_interests: list[str] = Field(default_factory=list)
    publications: list[ResumeEntry] = Field(default_factory=list)
    research_projects: list[ResumeEntry] = Field(default_factory=list)
    professional_development: list[ResumeEntry] = Field(default_factory=list)
    awards: list[ResumeEntry] = Field(default_factory=list)


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


def parse_term_list(section_texts: list[str]) -> list[str]:
    """Flatten a section into de-duplicated short terms (skills, research interests)."""
    terms: list[str] = []
    for entry in parse_section_entries(section_texts):
        for piece in re.split(r"[;,••|]|\s{2,}|\s/\s", entry.raw_text):
            term = normalize_text(piece)
            if term and len(term) <= 80:
                terms.append(term)

    seen: set[str] = set()
    unique: list[str] = []
    for term in terms:
        key = term.lower()
        if key not in seen:
            seen.add(key)
            unique.append(term)
    return unique


def extract_address(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines()[:20] if line.strip()]
    for line in lines:
        labelled = ADDRESS_LABEL_PATTERN.match(line)
        if labelled:
            return normalize_text(labelled.group(1))
    for line in lines:
        cleaned = normalize_text(line)
        if looks_like_contact_line(cleaned) or is_section_heading(cleaned):
            continue
        if ADDRESS_HINT_PATTERN.search(cleaned) and "," in cleaned:
            return cleaned
    return None


def _normalize_url(url: str) -> str:
    return url if url.lower().startswith("http") else "https://" + url


def extract_linkedin(text: str) -> str | None:
    match = LINKEDIN_PATTERN.search(text)
    return _normalize_url(match.group(0)) if match else None


def extract_portfolio(text: str) -> str | None:
    github = GITHUB_PATTERN.search(text)
    if github:
        return _normalize_url(github.group(0))
    for candidate in URL_PATTERN.finditer(text):
        url = candidate.group(0)
        if "linkedin.com" in url.lower():
            continue
        return _normalize_url(url)
    return None


def extract_last_year(text: str) -> str | None:
    years = YEAR_PATTERN.findall(text)
    return years[-1] if years else None


def _is_institution(text: str) -> bool:
    return bool(INSTITUTION_PATTERN.search(text))


def extract_institution(text: str) -> str | None:
    for segment in re.split(r"\s*[,|]\s*|\s+at\s+", text):
        segment = segment.strip()
        if _is_institution(segment):
            return normalize_text(segment)
    return None


def extract_degree(text: str) -> str | None:
    match = DEGREE_PATTERN.search(text)
    return normalize_text(match.group(0)) if match else None


def extract_field_of_study(text: str) -> str | None:
    explicit = FIELD_IN_PATTERN.search(text)
    if explicit:
        candidate = normalize_text(explicit.group(1))
        if candidate and not _is_institution(candidate):
            return candidate

    # Fallback: the first comma-segment with the degree token stripped off, e.g.
    # "B.S. Computer Science, ..." -> "Computer Science".
    first_segment = normalize_text(re.split(r"[,|]", text)[0])
    degree = extract_degree(first_segment)
    if degree:
        remainder = re.sub(re.escape(degree), "", first_segment, count=1, flags=re.IGNORECASE)
        remainder = normalize_text(remainder.strip(" ,.-"))
        if remainder and not _is_institution(remainder) and any(c.isalpha() for c in remainder):
            return remainder
    return None


def parse_education_entry(text: str) -> EducationEntry:
    return EducationEntry(
        raw_text=text,
        degree=extract_degree(text),
        field_of_study=extract_field_of_study(text),
        institution=extract_institution(text),
        graduation_year=extract_last_year(text),
    )


def parse_certification_entry(text: str) -> CertificationEntry:
    expiration = None
    expiry_match = CERT_EXPIRY_PATTERN.search(text)
    if expiry_match:
        expiration = normalize_text(expiry_match.group(1))

    issuer = None
    issuer_match = CERT_ISSUER_PATTERN.search(text)
    if issuer_match:
        issuer = normalize_text(issuer_match.group(1)).rstrip(".,")

    date_obtained = None
    for date_match in SINGLE_DATE_PATTERN.finditer(text):
        value = normalize_text(date_match.group(0))
        if expiration and value == expiration:
            continue
        date_obtained = value
        break

    name_segment = re.split(r"\s+[–—\-]\s+|,|\(", text, maxsplit=1)[0]
    name = normalize_text(name_segment) or None
    if name and SINGLE_DATE_PATTERN.fullmatch(name):
        name = None

    return CertificationEntry(
        raw_text=text,
        name=name,
        issuer=issuer,
        date_obtained=date_obtained,
        expiration_date=expiration,
    )


def split_dates(date_text: str) -> tuple[str | None, str | None]:
    parts = re.split(r"\s*(?:-|–|—|\bto\b)\s*", date_text, maxsplit=1, flags=re.IGNORECASE)
    start = normalize_text(parts[0]) if parts and parts[0].strip() else None
    end = normalize_text(parts[1]) if len(parts) > 1 and parts[1].strip() else None
    return start, end


def parse_experience_header(header: str) -> tuple[str | None, str | None, str | None, str | None]:
    start = end = None
    core = header
    date_match = DATE_PATTERN.search(header)
    if date_match:
        start, end = split_dates(date_match.group(0))
        core = header[: date_match.start()] + " " + header[date_match.end() :]

    core = normalize_text(core.strip(" ,-–—|()"))
    position = organization = None
    if core:
        pieces = re.split(r"\s+at\s+|\s+[–—]\s+|\s+-\s+|\s+\|\s+|,\s+", core, maxsplit=1)
        position = normalize_text(pieces[0]) or None
        if len(pieces) > 1:
            organization = normalize_text(pieces[1]).strip(" ,-–—|()") or None
    return position, organization, start, end


def extract_courses_taught(header: str, details: list[str]) -> list[str]:
    courses: list[str] = []
    for source in [header, *details]:
        match = COURSES_LABEL_PATTERN.search(source)
        if not match:
            continue
        for piece in re.split(r"[;,]", match.group(1)):
            course = normalize_text(piece)
            if course:
                courses.append(course)
    return courses


def _looks_like_experience_header(text: str) -> bool:
    """A new job/appointment line usually carries a date range or an employer."""
    if DATE_RANGE_PATTERN.search(text):
        return True
    if re.search(r"\bat\s+[A-Z]", text):
        return True
    return bool(
        re.search(
            r"\b(?:Inc|Corp|Corporation|Ltd|LLC|LLP|University|College|Institute|Company|Department|School)\b",
            text,
            re.IGNORECASE,
        )
    )


def _records_from_text(section_text, is_new_record=None):
    """Group a header line with the bullet/detail lines that follow it.

    Handles the two common resume layouts: a non-bulleted header followed by
    bulleted responsibilities, and an all-bulleted list where each job line is
    itself a header (detected via ``is_new_record``).
    """
    records: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    for raw_line in section_text.replace("\r\n", "\n").split("\n"):
        line = raw_line.strip()
        if not line:
            current = None
            continue
        is_bullet = bool(BULLET_PREFIX.match(line))
        content = normalize_text(BULLET_PREFIX.sub("", line))
        if not content:
            continue

        attach_as_detail = (
            is_bullet
            and current is not None
            and not (is_new_record is not None and is_new_record(content))
        )
        if attach_as_detail:
            current["details"].append(content)  # type: ignore[union-attr]
        else:
            current = {"header": content, "details": []}
            records.append(current)
    return records


def parse_experience_records(section_texts: list[str]) -> list[ExperienceEntry]:
    entries: list[ExperienceEntry] = []
    for section_text in section_texts:
        for record in _records_from_text(section_text, _looks_like_experience_header):
            header = str(record["header"])
            details = list(record["details"])  # type: ignore[arg-type]
            position, organization, start_date, end_date = parse_experience_header(header)
            courses = extract_courses_taught(header, details)
            responsibilities = [detail for detail in details if not COURSES_LABEL_PATTERN.search(detail)]
            raw_text = normalize_text(" ".join([header, *details])) if details else header
            entries.append(
                ExperienceEntry(
                    raw_text=raw_text,
                    position=position,
                    organization=organization,
                    start_date=start_date,
                    end_date=end_date,
                    responsibilities=responsibilities,
                    courses_taught=courses,
                )
            )
    return entries


def extract_resume_data(text: str) -> ParsedResumeData:
    sections = extract_resume_sections(text)
    return ParsedResumeData(
        name=extract_name(text),
        email=extract_email(text),
        phone=extract_phone(text),
        address=extract_address(text),
        linkedin=extract_linkedin(text),
        portfolio=extract_portfolio(text),
        education=[
            parse_education_entry(entry.raw_text)
            for entry in parse_section_entries(sections["education"])
        ],
        experience=parse_experience_records(sections["experience"]),
        certifications=[
            parse_certification_entry(entry.raw_text)
            for entry in parse_section_entries(sections["certifications"])
        ],
        skills=parse_term_list(sections["skills"]),
        research_interests=parse_term_list(sections["research_interests"]),
        publications=parse_section_entries(sections["publications"]),
        research_projects=parse_section_entries(sections["research_projects"]),
        professional_development=parse_section_entries(sections["professional_development"]),
        awards=parse_section_entries(sections["awards"]),
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


class AssignmentRunRequest(BaseModel):
    hiring_round_id: UUID
    scope_applicant_type: Literal['external', 'internal', 'both']
    scope_position_ids: list[UUID] | None = None
    scope_department_ids: list[UUID] | None = None


class AssignmentRunResult(BaseModel):
    application_id: UUID
    applicant_profile_id: UUID
    position_id: UUID
    is_assigned: bool
    objective_score: float


class AssignmentRunResponse(BaseModel):
    status: str
    objective_score: float
    assigned_count: int
    candidate_count: int
    results: list[AssignmentRunResult]


class WorkloadCourseInput(BaseModel):
    course_id: UUID
    department_id: UUID
    course_code: str
    course_name: str
    units: int
    sections_required: int


class WorkloadFacultyInput(BaseModel):
    applicant_profile_id: UUID
    max_units: int


class WorkloadExpertiseInput(BaseModel):
    applicant_profile_id: UUID
    course_id: UUID
    expertise_score: float


class FacultyWorkloadRequest(BaseModel):
    hiring_round_id: UUID
    semester: str
    academic_year: int
    scope_department_ids: list[UUID] | None = None


class FacultyWorkloadResult(BaseModel):
    applicant_profile_id: UUID
    course_id: UUID
    course_code: str
    course_name: str
    department_id: UUID
    units: int
    expertise_score: float
    is_assigned: bool


class FacultyWorkloadResponse(BaseModel):
    status: str
    objective_score: float
    assigned_units: int
    candidate_count: int
    results: list[FacultyWorkloadResult]


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


def fetch_assignment_candidates(payload: AssignmentRunRequest) -> list[dict[str, object]]:
    settings = get_settings()
    connection = None

    query = [
        """
        SELECT
            a.id AS application_id,
            a.applicant_profile_id,
            a.position_id,
            a.total_wsm_score,
            a.status,
            ap.applicant_type,
            p.department_id,
            p.slots_available
        FROM applications a
        INNER JOIN applicant_profiles ap ON ap.id = a.applicant_profile_id
        INNER JOIN positions p ON p.id = a.position_id
        WHERE a.hiring_round_id = %s
          AND a.status IN ('applied', 'for_review')
          AND a.total_wsm_score IS NOT NULL
        """,
    ]
    parameters: list[object] = [str(payload.hiring_round_id)]

    if payload.scope_applicant_type != 'both':
        query.append("AND ap.applicant_type = %s")
        parameters.append(payload.scope_applicant_type)

    if payload.scope_position_ids:
        query.append("AND a.position_id = ANY(%s::uuid[])")
        parameters.append([str(position_id) for position_id in payload.scope_position_ids])

    if payload.scope_department_ids:
        query.append("AND p.department_id = ANY(%s::uuid[])")
        parameters.append([str(department_id) for department_id in payload.scope_department_ids])

    query.append("ORDER BY a.total_wsm_score DESC, a.id ASC")

    try:
        connection = create_readonly_connection()
        with connection.cursor() as cursor:
            cursor.execute("\n".join(query), parameters)
            rows = cursor.fetchall()
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

    candidates: list[dict[str, object]] = []
    for row in rows:
        candidates.append(
            {
                "application_id": UUID(str(row[0])),
                "applicant_profile_id": UUID(str(row[1])),
                "position_id": UUID(str(row[2])),
                "total_wsm_score": float(row[3] or 0),
                "slots_available": int(row[7]),
            }
        )

    return candidates


def fetch_workload_inputs(payload: FacultyWorkloadRequest) -> tuple[list[dict[str, object]], list[dict[str, object]], dict[tuple[UUID, UUID], float]]:
    settings = get_settings()
    connection = None

    try:
        connection = create_readonly_connection()
        with connection.cursor() as cursor:
            course_query = """
                SELECT
                    c.id,
                    c.department_id,
                    c.course_code,
                    c.course_name,
                    c.units,
                    c.sections_required
                FROM courses c
                WHERE c.is_active = TRUE
                  AND c.academic_year = %s
                  AND c.semester = %s
            """
            course_params: list[object] = [payload.academic_year, payload.semester]
            if payload.scope_department_ids:
                course_query += " AND c.department_id = ANY(%s::uuid[])"
                course_params.append([str(department_id) for department_id in payload.scope_department_ids])
            course_query += " ORDER BY c.course_code ASC"
            cursor.execute(course_query, course_params)
            course_rows = cursor.fetchall()

            faculty_query = """
                SELECT
                    ap.id,
                    COALESCE(fll.max_units, 0)
                FROM applicant_profiles ap
                INNER JOIN users u ON u.id = ap.user_id
                LEFT JOIN faculty_load_limits fll ON fll.applicant_profile_id = ap.id
                WHERE ap.applicant_type = 'internal'
                  AND u.is_active = TRUE
                ORDER BY ap.id ASC
            """
            cursor.execute(faculty_query)
            faculty_rows = cursor.fetchall()

            expertise_query = """
                SELECT
                    fes.applicant_profile_id,
                    fes.course_id,
                    fes.expertise_score
                FROM faculty_expertise_scores fes
                INNER JOIN courses c ON c.id = fes.course_id
                WHERE c.academic_year = %s
                  AND c.semester = %s
            """
            expertise_params: list[object] = [payload.academic_year, payload.semester]
            if payload.scope_department_ids:
                expertise_query += " AND c.department_id = ANY(%s::uuid[])"
                expertise_params.append([str(department_id) for department_id in payload.scope_department_ids])
            cursor.execute(expertise_query, expertise_params)
            expertise_rows = cursor.fetchall()
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

    courses = [
        {
            "course_id": UUID(str(row[0])),
            "department_id": UUID(str(row[1])),
            "course_code": str(row[2]),
            "course_name": str(row[3]),
            "units": int(row[4]),
            "sections_required": int(row[5]),
        }
        for row in course_rows
    ]
    faculty = [
        {
            "applicant_profile_id": UUID(str(row[0])),
            "max_units": int(row[1]),
        }
        for row in faculty_rows
        if int(row[1]) > 0
    ]
    expertise: dict[tuple[UUID, UUID], float] = {
        (UUID(str(row[0])), UUID(str(row[1]))): float(row[2]) for row in expertise_rows
    }

    return courses, faculty, expertise


def solve_faculty_workload(
    courses: list[dict[str, object]],
    faculty: list[dict[str, object]],
    expertise: dict[tuple[UUID, UUID], float],
) -> tuple[list[FacultyWorkloadResult], float, int]:
    if not courses or not faculty:
        return [], 0.0, 0

    problem = pulp.LpProblem("mcdss_faculty_workload", pulp.LpMaximize)
    decision_variables: dict[tuple[UUID, UUID], pulp.LpVariable] = {}

    for faculty_member in faculty:
        faculty_id = faculty_member["applicant_profile_id"]
        assert isinstance(faculty_id, UUID)
        for course in courses:
            course_id = course["course_id"]
            assert isinstance(course_id, UUID)
            decision_variables[(faculty_id, course_id)] = pulp.LpVariable(
                f"load_{faculty_id.hex}_{course_id.hex}",
                lowBound=0,
                upBound=1,
                cat="Binary",
            )

    problem += pulp.lpSum(
        expertise.get((faculty_id, course_id), 0.0) * decision_variables[(faculty_id, course_id)]
        for faculty_id, course_id in decision_variables
    )

    for course in courses:
        course_id = course["course_id"]
        sections_required = int(course["sections_required"])
        assert isinstance(course_id, UUID)
        problem += pulp.lpSum(
            decision_variables[(faculty_member["applicant_profile_id"], course_id)]
            for faculty_member in faculty
            if (faculty_member["applicant_profile_id"], course_id) in decision_variables
        ) == sections_required

    for faculty_member in faculty:
        faculty_id = faculty_member["applicant_profile_id"]
        max_units = int(faculty_member["max_units"])
        problem += pulp.lpSum(
            int(next(course["units"] for course in courses if course["course_id"] == course_id))
            * decision_variables[(faculty_id, course_id)]
            for course_id in [course["course_id"] for course in courses]
            if (faculty_id, course_id) in decision_variables
        ) <= max_units

    solver = pulp.PULP_CBC_CMD(msg=False)
    problem.solve(solver)

    results: list[FacultyWorkloadResult] = []
    assigned_units = 0
    for course in courses:
        course_id = course["course_id"]
        department_id = course["department_id"]
        for faculty_member in faculty:
            faculty_id = faculty_member["applicant_profile_id"]
            assert isinstance(course_id, UUID)
            assert isinstance(department_id, UUID)
            assert isinstance(faculty_id, UUID)
            is_assigned = float(pulp.value(decision_variables[(faculty_id, course_id)]) or 0) >= 0.5
            if is_assigned:
                assigned_units += int(course["units"])
            results.append(
                FacultyWorkloadResult(
                    applicant_profile_id=faculty_id,
                    course_id=course_id,
                    course_code=str(course["course_code"]),
                    course_name=str(course["course_name"]),
                    department_id=department_id,
                    units=int(course["units"]),
                    expertise_score=float(expertise.get((faculty_id, course_id), 0.0)),
                    is_assigned=is_assigned,
                )
            )

    return results, float(pulp.value(problem.objective) or 0), assigned_units


def persist_faculty_workload_run(
    payload: FacultyWorkloadRequest,
    results: list[FacultyWorkloadResult],
    objective_score: float,
    assigned_units: int,
) -> UUID:
    run_id = uuid4()
    connection = None

    try:
        connection = create_write_connection()
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO assignment_runs (
                        id,
                        hiring_round_id,
                        scope_applicant_type,
                        scope_position_ids,
                        scope_department_ids,
                        ilp_parameters,
                        status,
                        result_summary,
                        run_at,
                        completed_at,
                        run_by
                    ) VALUES (
                        %s,
                        %s,
                        'internal',
                        %s,
                        %s,
                        %s,
                        'completed',
                        %s,
                        NOW(),
                        NOW(),
                        NULL
                    )
                    """,
                    [
                        str(run_id),
                        str(payload.hiring_round_id),
                        None,
                        Json([str(department_id) for department_id in payload.scope_department_ids]) if payload.scope_department_ids else None,
                        Json({
                            "objective": "maximize_total_expertise_score",
                            "solver": "cbc",
                            "semester": payload.semester,
                            "academic_year": payload.academic_year,
                        }),
                        Json({
                            "objective_score": objective_score,
                            "assigned_units": assigned_units,
                            "candidate_count": len(results),
                        }),
                    ],
                )

                for result in results:
                    if not result.is_assigned:
                        continue

                    cursor.execute(
                        """
                        INSERT INTO faculty_workload (
                            applicant_profile_id,
                            assignment_run_id,
                            department_id,
                            course_code,
                            course_name,
                            units,
                            semester,
                            academic_year,
                            assigned_at
                        ) VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            NOW()
                        )
                        """,
                        [
                            str(result.applicant_profile_id),
                            str(run_id),
                            str(result.department_id),
                            result.course_code,
                            result.course_name,
                            result.units,
                            payload.semester,
                            payload.academic_year,
                        ],
                    )
    finally:
        if connection is not None:
            connection.close()

    return run_id


def solve_assignment_problem(candidates: list[dict[str, object]]) -> tuple[list[AssignmentRunResult], float]:
    if not candidates:
        return [], 0.0

    problem = pulp.LpProblem("mcdss_assignment_run", pulp.LpMaximize)
    decision_variables: dict[UUID, pulp.LpVariable] = {}

    for candidate in candidates:
        application_id = candidate["application_id"]
        assert isinstance(application_id, UUID)
        decision_variables[application_id] = pulp.LpVariable(
            f"assign_{application_id.hex}",
            lowBound=0,
            upBound=1,
            cat="Binary",
        )

    problem += pulp.lpSum(
        float(candidate["total_wsm_score"]) * decision_variables[candidate["application_id"]]
        for candidate in candidates
    )

    by_applicant_profile: dict[UUID, list[UUID]] = {}
    by_position: dict[UUID, list[UUID]] = {}

    for candidate in candidates:
        applicant_profile_id = candidate["applicant_profile_id"]
        position_id = candidate["position_id"]
        application_id = candidate["application_id"]

        assert isinstance(applicant_profile_id, UUID)
        assert isinstance(position_id, UUID)
        assert isinstance(application_id, UUID)

        by_applicant_profile.setdefault(applicant_profile_id, []).append(application_id)
        by_position.setdefault(position_id, []).append(application_id)

    for application_ids in by_applicant_profile.values():
        problem += pulp.lpSum(decision_variables[application_id] for application_id in application_ids) <= 1

    for position_id, application_ids in by_position.items():
        slots_available = int(next(candidate["slots_available"] for candidate in candidates if candidate["position_id"] == position_id))
        problem += pulp.lpSum(decision_variables[application_id] for application_id in application_ids) <= slots_available

    solver = pulp.PULP_CBC_CMD(msg=False)
    problem.solve(solver)

    results: list[AssignmentRunResult] = []
    for candidate in candidates:
        application_id = candidate["application_id"]
        applicant_profile_id = candidate["applicant_profile_id"]
        position_id = candidate["position_id"]
        assert isinstance(application_id, UUID)
        assert isinstance(applicant_profile_id, UUID)
        assert isinstance(position_id, UUID)

        is_assigned = float(pulp.value(decision_variables[application_id]) or 0) >= 0.5
        results.append(
            AssignmentRunResult(
                application_id=application_id,
                applicant_profile_id=applicant_profile_id,
                position_id=position_id,
                is_assigned=is_assigned,
                objective_score=float(candidate["total_wsm_score"]),
            )
        )

    return results, float(pulp.value(problem.objective) or 0)


@app.post("/run-assignment", dependencies=[Depends(verify_service_key)])
def run_assignment(payload: AssignmentRunRequest) -> AssignmentRunResponse:
    candidates = fetch_assignment_candidates(payload)
    results, objective_score = solve_assignment_problem(candidates)

    return AssignmentRunResponse(
        status="ok",
        objective_score=objective_score,
        assigned_count=sum(1 for result in results if result.is_assigned),
        candidate_count=len(results),
        results=results,
    )


@app.post("/run-faculty-workload", dependencies=[Depends(verify_service_key)])
def run_faculty_workload(payload: FacultyWorkloadRequest) -> FacultyWorkloadResponse:
    courses, faculty, expertise = fetch_workload_inputs(payload)
    results, objective_score, assigned_units = solve_faculty_workload(courses, faculty, expertise)
    persist_faculty_workload_run(payload, results, objective_score, assigned_units)

    return FacultyWorkloadResponse(
        status="ok",
        objective_score=objective_score,
        assigned_units=assigned_units,
        candidate_count=len(results),
        results=results,
    )
