# Tiki Meal Planner — Backend

REST API for the Tiki meal planning app. Built with Express + TypeScript + Prisma, backed by PostgreSQL.

## Tech stack

- **Express 4** — HTTP server
- **Prisma 5** — ORM and schema migrations
- **PostgreSQL** — database
- **TypeScript** — compiled with `tsc`, dev server via `ts-node-dev`

## Prerequisites

- Node.js 20+
- A running PostgreSQL instance

## Getting started

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Push schema to the database (creates tables)
npm run db:push

# Start the dev server (http://localhost:3000)
npm run dev
```

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/tiki_meal_planner` |
| `PORT` | Port the server listens on | `3000` |

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled output (`node dist/index.js`) |
| `npm run seed` | Seed the database with initial data |
| `npm run db:push` | Push Prisma schema to the database (no migration history) |
| `npm run db:migrate` | Run Prisma migrations (keeps migration history) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

## API endpoints

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET/POST | `/api/persons` | List / create personas |
| GET/PATCH/DELETE | `/api/persons/:id` | Get / update / delete a persona |
| GET/POST | `/api/inbody` | List / create InBody records |
| PATCH/DELETE | `/api/inbody/:id` | Update / delete an InBody record |
| GET/POST | `/api/proteins` | List / create protein sources |
| PATCH/DELETE | `/api/proteins/:id` | Update / delete a protein source |
| GET/PUT | `/api/meal-plans/:personId` | Get / upsert a person's meal plan |
| GET/PUT | `/api/planner` | Get / upsert weekly planner entries |
| GET/POST | `/api/shopping` | Get / toggle shopping list items |

## Database schema

| Model | Description |
|---|---|
| `Person` | A user persona |
| `InBodyRecord` | Body composition snapshot (weight, muscle, fat, BMI, BMR, …) |
| `Protein` | Protein source with raw-to-cooked loss percentage |
| `MealPlan` | Per-slot macro targets (protein, carbs, fruit) stored as JSON |
| `PlannerEntry` | Weekly assignment of a protein to a meal slot on a given day |
| `ShoppingHave` | Tracks which proteins are already "on hand" for a given week |

## Docker

The Dockerfile builds the app and runs `prisma db push` on startup before starting the server.

```bash
docker build -t tiki-backend .
docker run -p 3000:3000 --env-file .env tiki-backend
```

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma   # Prisma schema (models + datasource)
│   └── seed.ts         # Database seed script
└── src/
    ├── index.ts        # Express app setup, middleware, route mounting
    ├── lib/
    │   └── prisma.ts   # Shared Prisma client instance
    └── routes/
        ├── persons.ts
        ├── inbody.ts
        ├── proteins.ts
        ├── mealPlans.ts
        ├── planner.ts
        └── shopping.ts
```
