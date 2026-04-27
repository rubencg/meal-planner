# Tiki Meal Planner — Frontend

Tiki is a Spanish-language meal planning and nutrition tracking single-page application. It supports multiple users (*personas*) and covers the full nutrition workflow: body composition tracking, protein source management, per-slot macro targets, a weekly planner, and an auto-generated shopping list.

## Features

- **Multi-persona support** — switch between users from the sidebar; active persona is persisted across sessions.
- **InBody tracker** — log body composition snapshots (weight, skeletal muscle mass, body fat %, BMI, visceral fat, BMR) and visualize trends with Chart.js.
- **Protein library** — manage protein sources with raw-to-cooked conversion via cooking loss percentage.
- **Meal plan** — define per-slot macro targets (protein, carbs, fruit) for each of 7 daily meal slots.
- **Weekly planner** — assign proteins to meal slots across Monday–Friday, entering cooked grams; raw weight is calculated automatically.
- **Shopping list** — automatically aggregates raw ingredient quantities for the current week.

### Meal slots

| Slot | Label |
|---|---|
| `desayuno` | Desayuno |
| `snack1` | Snack Mañana |
| `almuerzo` | Almuerzo |
| `snack2` | Snack Tarde |
| `cena` | Cena |
| `preEntreno` | Pre-Entreno |
| `postEntreno` | Post-Entreno |

## Tech stack

- **React 18** + **TypeScript** — component UI
- **Vite** — dev server and build tool
- **Tailwind CSS v3** — styling with a custom dark theme and emerald green accent
- **Chart.js** — InBody trend charts
- **DM Sans / DM Mono** — typography (loaded from Google Fonts)

No router library, no global state library. Page navigation is a single `useState` in `App.tsx`, persisted to `localStorage`.

## Prerequisites

- Node.js 20+
- The [Tiki backend](../backend) running on `http://localhost:3000`

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so the backend must be running for any data to load.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | TypeScript check + production build (outputs to `dist/`) |
| `npm run preview` | Serve the production build locally |

## Docker

A multi-stage Dockerfile is included. It builds the app with Node 20 and serves the static output with nginx.

```bash
docker build -t tiki-frontend .
docker run -p 80:80 tiki-frontend
```

## Project structure

```
src/
├── api.ts          # Fetch wrapper — all backend calls go here
├── App.tsx         # Root component, page routing via useState
├── constants.ts    # Meal slot/day labels, weight conversion helpers
├── types.ts        # Shared TypeScript types (Person, MealPlan, Protein, …)
├── theme.ts        # Tailwind color tokens
├── index.css       # Global styles
├── components/
│   └── Sidebar.tsx # Navigation + persona switcher
└── pages/
    ├── Dashboard.tsx    # Overview / home
    ├── InBodyPage.tsx   # Body composition log & charts
    ├── MealPlanPage.tsx # Per-slot macro targets
    ├── PlannerPage.tsx  # Weekly meal planner grid
    ├── ProteinsPage.tsx # Protein source management
    └── ShoppingPage.tsx # Auto-generated shopping list
```
