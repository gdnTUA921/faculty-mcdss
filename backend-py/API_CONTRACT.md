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

## Integration Notes

- `db-health` will return `503` until the local PostgreSQL credentials in `.env` match the running database.
- The current preview endpoints are standalone and do not require Phase 2 or Phase 3 data.
- Person 1 can use this as the initial internal contract for Laravel-to-FastAPI integration.
