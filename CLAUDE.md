# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, port 5173)
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
```

No linting or test scripts are configured.

## Architecture

**Tiki** is a Spanish-language meal planning and nutrition tracking SPA built with React 18 + TypeScript + Vite. It supports multiple users (*personas*) and tracks body composition (InBody), protein sources, meal plans, weekly planners, and shopping lists.

### API Integration

All data is fetched from a backend running at `http://localhost:3000`. The Vite dev server proxies `/api` requests there. All API calls go through `src/api.ts`, which is a thin fetch wrapper — add new endpoints there.

### Routing

There is no router library. `App.tsx` uses a single `useState<Page>` to track the active page string and renders the corresponding page component. The active page is persisted to `localStorage`. The `Sidebar.tsx` component handles navigation and person switching.

### Key Domain Types (`src/types.ts`)

- **`MealSlot`** — 7 fixed meal slots: `desayuno`, `snack1`, `almuerzo`, `snack2`, `cena`, `preEntreno`, `postEntreno`
- **`WeekDay`** — Weekdays only: `lunes` through `viernes`
- **`MealPlan`** — Per-person nutritional targets mapped by slot
- **`PlannerEntry`** — Weekly assignments of a protein to a slot on a specific day (with cooked grams)
- **`InBodyRecord`** — Body composition snapshot (weight, muscle mass, body fat, BMI, visceral fat, BMR)
- **`Protein`** — Food source with raw/cooked conversion via cooking loss percentage

### State Management

No global state library. Each page component manages its own state via `useState`/`useEffect`, fetching from the API on mount. The selected `Person` id is passed as a prop from `App.tsx` and persisted to `localStorage`.

### Theming (`src/theme.ts`, `tailwind.config.js`)

Custom dark theme with emerald green accent (`#22c97a`). The Tailwind config extends with semantic color tokens (`bg`, `surface`, `accent`, `text`, `muted`, `dim`, etc.) and uses DM Sans / DM Mono fonts (loaded from Google Fonts in `index.html`). Each meal slot has its own accent color and emoji icon — see `src/constants.ts`.
