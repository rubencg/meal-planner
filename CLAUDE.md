# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`backend/`)

```bash
npm run dev          # Start dev server with hot reload (ts-node-dev), port 3000
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled output
npm run seed         # Seed database with initial data
npm run db:push      # Push Prisma schema changes (no migration history)
npm run db:migrate   # Run Prisma migrations (keeps history)
npm run db:studio    # Open Prisma Studio visual DB browser
```

### Frontend (`frontend/`)

```bash
npm run dev          # Start Vite dev server, port 5173
npm run build        # TypeScript check + production build
npm run preview      # Serve production build locally
```

No linting or test scripts are configured in either package.

### Docker

```bash
# PostgreSQL must be on a Docker network named pg_network (not included in compose)
POSTGRES_PASSWORD=yourpassword docker compose up -d --build
docker compose down
```

## Architecture

Monorepo with two independent Node.js projects. The frontend Vite dev server proxies `/api/*` to the backend at `http://localhost:3000`, so both must run simultaneously during development.

### Backend (`backend/`)

Express 4 REST API with TypeScript and Prisma 5 ORM backed by PostgreSQL.

**Route modules** (`src/routes/`): `persons`, `inbody`, `proteins`, `meal-plans`, `planner`, `shopping`, `carb-foods` — each maps to a corresponding Prisma model. CORS is configured for `http://localhost:5173` only.

**Database schema** (Prisma models):
- `Person` — user persona; parent of all other records (cascade delete)
- `InBodyRecord` — body composition snapshots (weight, muscle, fat %, BMI, visceral fat, BMR)
- `Protein` — food sources with cooking loss percentage for raw→cooked gram conversion
- `MealPlan` — per-slot macro targets (protein g, carbs g, fruit g); one record per person
- `PlannerEntry` — weekly assignment of a protein to a meal slot on a specific weekday; unique on `(weekStart, personId, day, slot)`
- `CarbFood` — carbohydrate food items per person with portion unit
- `PlannerCarb` — links `PlannerEntry` to `CarbFood` with a portion count
- `ShoppingHave` — marks proteins as "already on hand" for a given week

### Frontend (`frontend/`)

React 18 SPA — see `frontend/CLAUDE.md` for detailed frontend guidance.

Key points:
- No router library: `App.tsx` uses `useState<Page>` for navigation, persisted to `localStorage`
- All API calls go through `src/api.ts` — add new endpoints there
- No global state library; each page fetches its own data on mount
- Active `Person` id is stored in `localStorage` and passed as a prop through `App.tsx`
- Custom dark Tailwind theme with emerald accent (`#22c97a`); semantic color tokens in `tailwind.config.js`
- Meal slots (`MealSlot`) and weekdays (`WeekDay`) are Spanish-language string literals defined in `src/types.ts`

### Domain language

The app is Spanish-language. Core terms: *persona* (user), *comida* (meal), *almuerzo* (lunch), *cena* (dinner), *desayuno* (breakfast), *snack*, *planner* (weekly schedule), *compras* (shopping).

Fixed meal slots: `desayuno`, `snack1`, `almuerzo` (formerly `comida`), `snack2`, `cena`, `preEntreno`, `postEntreno`.
