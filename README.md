# Tiki Meal Planner

Spanish-language meal planning and nutrition tracking app. Supports multiple users (*personas*) and covers the full nutrition workflow: body composition tracking, protein source management, per-slot macro targets, a weekly planner, and an auto-generated shopping list.

## Repository structure

```
tiki-meal-planner/
├── frontend/       # React 18 + TypeScript + Vite SPA
├── backend/        # Express + TypeScript + Prisma REST API
└── docker-compose.yml
```

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## Running locally

### Prerequisites

- Node.js 20+
- PostgreSQL running and accessible

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL and PORT
npm run db:push        # create tables
npm run dev            # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so the backend must be running for data to load.

## Running with Docker

The `docker-compose.yml` defines the `frontend` and `backend` services. PostgreSQL is **not** included — it is expected to be running in a separate Docker network named `pg_network`.

### 1. Set up PostgreSQL on the `pg_network` network

If you don't already have one running:

```bash
docker network create pg_network

docker run -d \
  --name postgres \
  --network pg_network \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=tiki_meal_planner \
  postgres:16-alpine
```

### 2. Start the app

```bash
POSTGRES_PASSWORD=yourpassword docker compose up -d --build
```

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | *(required)* | PostgreSQL password |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_DB` | `tiki_meal_planner` | Database name |

The frontend is served on **port 80**. The backend is only reachable internally (no host port exposed).

### Stopping

```bash
docker compose down
```
