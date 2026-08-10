# FastAPI Internal Contract

This document describes the current FastAPI endpoints available in `backend-py/` for internal Docker-network use.

## Base Rules

- Internal requests must send `X-Service-Key`.
- The value must match `FASTAPI_SECRET_KEY` from `.env`.
- The FastAPI service is reachable inside Docker as `http://fastapi:8001`.
- The public health check is exposed on the host at `http://localhost:8001/health`.

## Current Endpoints

### `GET /health`
Public health check for container verification.

Response:
```json
{ "status": "ok" }
```

### `GET /internal/ping`
Internal liveness check.

Headers:
- `X-Service-Key: <value>`

Response:
```json
{ "status": "ok" }
```

### `GET /internal/db-health`
Internal database reachability check.

Headers:
- `X-Service-Key: <value>`

Success response:
```json
{
  "status": "ok",
  "database": "faculty_mcdss",
  "host": "host.docker.internal",
  "reachable": true,
  "error": null
}
```

Failure response:
- HTTP `503 Service Unavailable`
- Structured detail payload with the same fields and `reachable: false`

### `POST /internal/assignments/preview`
ILP-style assignment preview using PuLP.

Headers:
- `X-Service-Key: <value>`

Request body:
```json
{
  "positions": [
    { "position_id": 1, "capacity": 1 }
  ],
  "applicants": [
    {
      "applicant_id": 101,
      "preferences": [
        { "position_id": 1, "score": 95 }
      ]
    }
  ]
}
```

Response:
```json
{
  "status": "ok",
  "objective_score": 95.0,
  "assignments": [
    {
      "applicant_id": 101,
      "position_id": 1,
      "score": 95.0
    }
  ]
}
```

### `POST /internal/rankings/preview`
Simple ranking preview for one position.

Headers:
- `X-Service-Key: <value>`

Request body:
```json
{
  "position_id": 7,
  "applicants": [
    { "applicant_id": 302, "score": 95.0 },
    { "applicant_id": 301, "score": 88.5 }
  ]
}
```

Response:
```json
{
  "status": "ok",
  "position_id": 7,
  "rankings": [
    { "rank": 1, "applicant_id": 302, "score": 95.0 },
    { "rank": 2, "applicant_id": 301, "score": 88.5 }
  ]
}
```

### `POST /parse-resume`
Multipart resume parser for Laravel-to-FastAPI integration.

Headers:
- `X-Service-Key: <value>`

Request:
- multipart form field named `file`
- accepted file types: PDF and DOCX

Response:
```json
{
  "name": "Jane Marie Doe",
  "email": "jane.doe@example.com",
  "phone": "+1 (555) 123-4567",
  "address": "12 Rizal Street, Quezon City, Philippines",
  "linkedin": "https://linkedin.com/in/jane-doe",
  "portfolio": "https://github.com/janedoe",
  "education": [
    {
      "raw_text": "B.S. Computer Science, University of Example, 2022",
      "degree": "B.S",
      "field_of_study": "Computer Science",
      "institution": "University of Example",
      "graduation_year": "2022"
    }
  ],
  "experience": [
    {
      "raw_text": "Software Engineer at Example Labs, Jan 2021 - Present",
      "position": "Software Engineer",
      "organization": "Example Labs",
      "start_date": "Jan 2021",
      "end_date": "Present",
      "responsibilities": ["Built the applicant scoring pipeline"],
      "courses_taught": ["Data Structures", "Algorithms"]
    }
  ],
  "certifications": [
    {
      "raw_text": "AWS Certified Solutions Architect, issued by Amazon, 2022, valid until 2025",
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon",
      "date_obtained": "2022",
      "expiration_date": "2025"
    }
  ],
  "skills": ["Python", "SQL", "Curriculum Design"],
  "research_interests": ["Machine Learning", "Educational Data Mining"],
  "publications": [
    { "raw_text": "Doe, J. (2024). Resume Parsing with Rules. Journal of Examples." }
  ],
  "research_projects": [
    { "raw_text": "Adaptive Learning Platform (2023)" }
  ],
  "professional_development": [
    { "raw_text": "Outcome-Based Education Workshop, 2021" }
  ],
  "awards": [
    { "raw_text": "Outstanding Faculty Award, 2022" }
  ]
}
```

Notes:
- The endpoint returns the parsed object directly so Laravel can store it in `applicant_profiles.parsed_resume_data`.
- Work, teaching, and academic experience are unified under `experience`; certifications and licenses are combined under `certifications`.
- If a field is not found, the parser returns `null` for scalar fields and an empty list for sections. The parser is heuristic and never fabricates values — every structured field falls back to the entry's `raw_text` while unknown sub-fields stay `null`/empty.

## Integration Notes

- `db-health` will return `503` until the local PostgreSQL credentials in `.env` match the running database.
- The current preview endpoints are standalone and do not require Phase 2 or Phase 3 data.
- Person 1 can use this as the initial internal contract for Laravel-to-FastAPI integration.
