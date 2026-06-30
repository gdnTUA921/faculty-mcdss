# Running the MCDSS Project

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- PostgreSQL running locally on port 5432

---

## First-Time Setup

Run these steps once when setting up from a fresh clone.

### 1. Create the local database

Using psql or any PostgreSQL client (pgAdmin, TablePlus, etc.):
```bash
psql -U postgres -c "CREATE DATABASE faculty_mcdss;"
```

### 2. Copy and fill in the environment file
```bash
cp .env.example .env
```
Open `.env` and set `DB_PASSWORD` to match your local PostgreSQL password.
Generate a stable app key and paste it into `APP_KEY`:
```bash
docker compose run --rm laravel php artisan key:generate --show
```

### 3. Build and start all containers
```bash
docker compose up -d --build
```
This starts: **Laravel** (PHP-FPM + Nginx), **FastAPI**, **Next.js frontend**, and **Mailpit**.
On first run, the Laravel container automatically runs `composer install` — this takes a minute.

### 4. Run migrations and seed the database
```bash
docker compose exec laravel php artisan migrate --seed
```

### 5. Verify the FastAPI service
```bash
docker compose exec fastapi curl -s http://localhost:8001/health
docker compose exec fastapi curl -s -H "X-Service-Key: changeme" http://localhost:8001/internal/db-health
```

If the second command returns a `503`, update `DB_PASSWORD` in `.env` so it matches your local PostgreSQL password.

---

## Daily Development

One command starts everything:

```bash
docker compose up -d
```

---

## Service URLs

| Service          | URL                          | Notes                      |
|------------------|------------------------------|----------------------------|
| Next.js Frontend | http://localhost:3000        |                            |
| Laravel API      | http://localhost:8000/api    |                            |
| Laravel Health   | http://localhost:8000/up     | Returns OK if container is up |
| FastAPI          | http://localhost:8001        |                            |
| FastAPI Health   | http://localhost:8001/health |                            |
| FastAPI DB Check  | http://localhost:8001/internal/db-health | Requires `X-Service-Key` |
| Mailpit Web UI   | http://localhost:8025        | View captured emails (dev) |
| PostgreSQL       | localhost:5432               | Local install — user: postgres / DB: faculty_mcdss |

---

## Useful Commands

```bash
# View logs for a specific service
docker compose logs -f frontend
docker compose logs -f laravel
docker compose logs -f fastapi
docker compose logs -f mailhog

# Run Artisan commands
docker compose exec laravel php artisan migrate
docker compose exec laravel php artisan migrate:fresh --seed
docker compose exec laravel php artisan make:controller ExampleController

# Open a shell inside a container
docker compose exec laravel sh
docker compose exec fastapi bash

# Connect to the local PostgreSQL database (runs on your host machine, not in Docker)
psql -U postgres -d faculty_mcdss

# Stop all containers (PostgreSQL data is safe — it lives on your local machine)
docker compose down

# Rebuild a single container after Dockerfile changes
docker compose up -d --build laravel
docker compose up -d --build fastapi
docker compose up -d --build frontend
```

---

## Internal Service Communication (Docker network)

Services on `mcdss_network` resolve each other by service name. PostgreSQL is **not** containerized — it runs on your host machine and is reached via `host.docker.internal`.

| From     | To         | Address                        |
|----------|------------|--------------------------------|
| Laravel  | PostgreSQL | `host.docker.internal:5432`    |
| Laravel  | FastAPI    | `http://fastapi:8001`          |
| Laravel  | Mailpit    | `mailhog:1025`                 |
| FastAPI  | PostgreSQL | `host.docker.internal:5432`    |
