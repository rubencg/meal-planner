# Rediseño del feature de Comida → Cargas (handoff de implementación)

> **Para la IA que implementa esto:** este documento es autocontenido. Léelo completo antes de escribir código. Contiene el contexto, las decisiones tomadas (con su porqué), el modelo de datos nuevo, el diseño de API y los cambios exactos por archivo, con criterios de aceptación. No improvises sobre las decisiones ya tomadas; si algo no está cubierto, sigue los defaults indicados en la sección "Decisiones abiertas / defaults".

---

## 1. Contexto del proyecto

**Tiki** es una SPA en español de planeación de comidas y seguimiento de composición corporal, para uso personal de 2 personas (*personas*): `ruben` y `sarahi`.

- **Monorepo** con dos proyectos Node independientes: `backend/` y `frontend/`.
- **Backend**: Express 4 + TypeScript + Prisma 5 + PostgreSQL. El frontend (Vite, puerto 5173) proxea `/api/*` al backend (puerto 3000). CORS solo permite `http://localhost:5173`.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind. **Sin router** (navegación con `useState<Page>` en `App.tsx`, persistida en `localStorage`). **Sin estado global**: cada página hace su propio fetch en mount. Todas las llamadas pasan por `src/api.ts`. Tema oscuro con acento esmeralda; tokens de color en `src/theme.ts` (objeto `C`).
- Idioma de dominio: *persona*, *comida*, *desayuno*, *almuerzo/comida*, *cena*, *snack/colación*, *planner* (semana), *compras*.

### Comandos
```bash
# backend/
npm run dev          # dev server (ts-node-dev), puerto 3000
npm run db:push      # aplica cambios de schema sin historial de migración
npm run db:migrate   # migración con historial
npm run seed         # corre prisma/seed.ts
npm run db:studio    # navegador visual de DB

# frontend/
npm run dev          # Vite, puerto 5173
npm run build        # type-check + build
```
No hay linter ni tests configurados. Valida con `npm run build` (frontend) y `npx tsc --noEmit` (backend) antes de terminar.

### Qué NO tocar
El feature de **InBody** (composición corporal) y las páginas/datos de **Proteínas** y **Carbohidratos** funcionan bien y **no se modifican** (salvo lo mínimo indicado). El cambio es exclusivamente la parte de **planeación de comidas** (`MealPlan`) y su integración con el **Planner** y **Dashboard**.

---

## 2. El problema a resolver

Hoy el modelo de comida es **rígido**: cada comida (slot) tiene **siempre** tres campos fijos — `protein` (g), `carbs` (porciones) y `fruit` (tazas) — más notas y selección de carbos. Esto obliga al usuario a llenar proteína/fruta/carbos aunque esa comida no los lleve. El usuario quiere **flexibilidad para poner solo lo necesario**.

Además, los planes reales de las nutriólogas tienen dos realidades que la app no modela:

1. **Planes por "cargas"**: una persona sigue versiones distintas del mismo plan según la intensidad del entrenamiento del día. Ejemplo del usuario: *"correr +10 km → carga alta; entrenamiento ligero de 2–5 km → carga baja"*. Cada carga trae todos los slots con valores propios (ej. proteína 90 g vs 160 g por comida).
2. **Slots muy variables** (colaciones, pre/durante/post entreno): a veces es proteína en polvo, a veces fruta, gelatina, almendras, rice cake con cacahuate, suero, etc. No aplica la rejilla de macros.

### Estructura observada en los planes impresos (referencia)
Secciones por día: **Antes de entrenar / Durante (suero) / Terminando de entrenar**, **Desayuno**, **Colación 12:30**, **Comida**, **Colación 6:30**, **Cena**. Las comidas grandes listan: Proteínas (gramos), Carbohidratos (porciones + lista de alimentos), Grasas (texto fijo), Verduras (texto fijo). Las colaciones/entreno son texto libre con cantidades en "medidas" y "tazas".

---

## 3. Decisiones tomadas (con su porqué)

Estas decisiones ya están acordadas con el usuario. **No las re-litigues.**

| # | Decisión | Detalle | Porqué |
|---|----------|---------|--------|
| D1 | **Soportar cargas desde ya** | No es solo flexibilidad de campos; se modela carb cycling completo. | El usuario tiene planes por cargas reales. |
| D2 | **Carga = plan completo con nombre** | Cada persona tiene **lista libre** de cargas (las crea/edita/borra con el nombre que quiera, ej. *Descanso*, *Carga baja*, *Carga alta*). Cada carga contiene **todos** los slots con sus propios valores. **No** se modela como "diferencias sobre un base". | Claridad de edición; cantidad de cargas variable por persona. |
| D3 | **Una carga marcada como predeterminada** | Por persona, exactamente una carga `isDefault = true`. | Los días sin carga elegida usan la predeterminada (menos clics). |
| D4 | **Dos tipos de slot** | **Estructurada** (rejilla de macros) y **Libre** (texto). | El usuario lo pidió explícito: las colaciones se manejan distinto. |
| D5 | **Slots estructurados = Proteína + Carbohidrato, ambos opcionales** | Proteína en **gramos**; Carbohidrato en **porciones** + lista de alimentos (igual que hoy `carbSelections`). **Se elimina Fruta.** **No** se agregan Grasas ni Verduras (irían en notas si acaso). Cada campo es opcional: solo se muestra/captura lo que tenga valor. | "Poner solo lo necesario"; grasa/verdura casi nunca cambian y fruta vive en colaciones. |
| D6 | **Slots libres = un campo de texto multilínea** | Un solo textarea por slot/carga (ej. *"½ tza fruta + ½ medida proteína (whey, gelatina, almendras)"*). No es lista de chips. | Igual que el plan impreso; mínimo esfuerzo de captura. |
| D7 | **Fusionar entrenamiento en un solo slot libre** | Un slot **Entrenamiento** que incluye antes/durante/terminando en su texto. Reemplaza `preEntreno` y `postEntreno`. | El usuario lo pidió: "un solo slot 'Entrenamiento' libre". |
| D8 | **Carga por día en el Planner** | En el planner semanal, cada día elige qué carga sigue. Las metas de proteína/carbo de ese día salen de esa carga. Día sin elección → carga predeterminada. | Es el verdadero carb cycling; mantiene compras/gramos crudos. |
| D9 | **Slots libres en el Planner: solo lectura** | En el planner se muestran como referencia (el texto de la carga del día). No se editan ni asignan ahí. | No hay nada que pesar/comprar en colaciones. |
| D10 | **Empezar de cero con los datos de comida** | Se reemplaza el modelo `MealPlan`. Se conservan Proteínas, CarbFoods e InBody. No se migran los planes viejos (son 2 personas, recapturan rápido). | Migración automática sería imprecisa por el cambio de tipos de slot. |

---

## 4. Set de slots nuevo

Reemplaza los 7 slots actuales (`desayuno, snack1, almuerzo, snack2, cena, preEntreno, postEntreno`).

| key (`MealSlot`) | label | tipo | icono sugerido | acento sugerido |
|---|---|---|---|---|
| `entrenamiento` | "Entrenamiento" | **libre** | 🏋️ | `#fbbf24` |
| `desayuno` | "Desayuno" | **estructurada** | 🍳 | `#22c97a` |
| `snack1` | "Colación 12:30" | **libre** | 🍎 | `#a78bfa` |
| `almuerzo` | "Comida" | **estructurada** | 🥗 | `#60a5fa` |
| `snack2` | "Colación 6:30" | **libre** | 🥜 | `#fb923c` |
| `cena` | "Cena" | **estructurada** | 🍽️ | `#f87171` |

- **Orden** (default, ver Decisiones abiertas): `entrenamiento, desayuno, snack1, almuerzo, snack2, cena`. El orden vive en `MEAL_SLOTS` (constants) y es fácil de cambiar.
- **Tipos**: `STRUCTURED_SLOTS = ['desayuno', 'almuerzo', 'cena']`; `FREE_SLOTS = ['entrenamiento', 'snack1', 'snack2']`. Define un helper `slotType(slot): 'structured' | 'free'`.
- Se conservan los keys `desayuno/snack1/almuerzo/snack2/cena` para minimizar churn; se eliminan `preEntreno`/`postEntreno` y se agrega `entrenamiento`.

---

## 5. Modelo de datos nuevo (backend)

### 5.1 Prisma schema (`backend/prisma/schema.prisma`)

**Eliminar** el modelo `MealPlan` y su relación en `Person`. **Agregar** `Carga` y `PlannerDayCarga`.

```prisma
model Person {
  id             String         @id
  name           String
  inBody         InBodyRecord[]
  cargas         Carga[]            // antes: mealPlan MealPlan?
  plannerEntries PlannerEntry[]
  carbFoods      CarbFood[]
}

model Carga {
  id        String   @id @default(cuid())
  personId  String
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  name      String
  sortOrder Int      @default(0)
  isDefault Boolean  @default(false)
  slots     Json                       // ver shape en 5.2
  createdAt DateTime @default(now())

  dayAssignments PlannerDayCarga[]

  @@index([personId])
}

model PlannerDayCarga {
  id        String @id @default(cuid())
  weekStart String          // mismo formato que PlannerEntry.weekStart (lunes, "YYYY-MM-DD")
  personId  String
  day       String          // 'lunes' | 'martes' | ... (WeekDay)
  cargaId   String
  carga     Carga  @relation(fields: [cargaId], references: [id], onDelete: Cascade)

  @@unique([weekStart, personId, day])
  @@index([weekStart])
}
```

`PlannerEntry`, `CarbFood`, `PlannerCarb`, `Protein`, `InBodyRecord`, `ShoppingHave` **no cambian**.

> Nota sobre `onDelete: Cascade` en `PlannerDayCarga.carga`: si se borra una carga que algún día tenía asignada, ese día perderá la asignación y caerá a la carga predeterminada. Es el comportamiento deseado.

Aplica con `npm run db:push` (uso personal, no se requiere historial). Si prefieres historial, `npm run db:migrate`.

### 5.2 Shape del JSON `Carga.slots`

`slots` es un objeto plano keyed por slot. Cada slot guarda solo los campos de su tipo (todos opcionales → "solo lo necesario"):

```jsonc
{
  // estructurada (desayuno / almuerzo / cena):
  "desayuno": {
    "protein": 160,                 // gramos (opcional)
    "carbs": 2,                     // porciones (opcional)
    "carbSelections": [             // opcional; igual que hoy
      { "carbFoodId": "cf-ruben-1", "portions": 1 },
      { "carbFoodId": "cf-ruben-8", "portions": 1 }
    ],
    "notes": ""                     // opcional
  },
  // libre (entrenamiento / snack1 / snack2):
  "snack1": {
    "text": "½ tza de fruta y ½ medida de proteína"
  },
  "entrenamiento": {
    "text": "Antes: 1 medida proteína + ½ tza fruta. Durante: suero. Terminando: 1 medida proteína."
  }
}
```

Reglas:
- Un slot ausente = sin contenido (mostrar vacío).
- En estructurados, un campo numérico ausente o `0` se trata como "no aplica" (no se muestra en lecturas; ya hay precedente con `(s.protein ?? 0) > 0`).
- No guardar `fruit` ni `protein/carbs` en slots libres, ni `text` en estructurados.

---

## 6. API (backend)

### 6.1 Quitar
- `backend/src/routes/mealPlans.ts` y su registro en `index.ts` (`app.use('/api/meal-plans', ...)`).
- En `frontend/src/api.ts`: `getMealPlan`, `saveMealPlan`.

### 6.2 Nuevas rutas de Cargas — `backend/src/routes/cargas.ts`
Registrar en `index.ts`: `app.use('/api/cargas', cargasRouter)`.

| Método | Ruta | Body / Query | Comportamiento |
|---|---|---|---|
| GET | `/api/cargas?personId=:id` | — | Devuelve `Carga[]` de la persona, ordenadas por `sortOrder asc, createdAt asc`. |
| POST | `/api/cargas` | `{ personId, name }` | Crea carga con `slots: {}`. Si es la **primera** carga de la persona → `isDefault = true`. `sortOrder` = (max actual + 1). |
| PUT | `/api/cargas/:id` | `{ name?, slots?, sortOrder? }` | Actualiza campos provistos. |
| PUT | `/api/cargas/:id/default` | — | Marca esta carga como predeterminada y pone `isDefault = false` en las demás de la misma persona (en una transacción). |
| DELETE | `/api/cargas/:id` | — | Borra la carga. **Bloquear (400)** si es la última carga de la persona. Si era la predeterminada, marcar otra como predeterminada (la de menor `sortOrder`). |

Invariante a mantener en backend: **cada persona con ≥1 carga tiene exactamente una `isDefault`**.

### 6.3 Carga por día — extender `backend/src/routes/planner.ts`
Agregar endpoints para `PlannerDayCarga` (mismo router `/api/planner`):

| Método | Ruta | Body / Query | Comportamiento |
|---|---|---|---|
| GET | `/api/planner/day-cargas?weekStart=:ws` | — | Devuelve `PlannerDayCarga[]` de esa semana (todas las personas, para que el planner arme su mapa). |
| POST | `/api/planner/day-carga` | `{ weekStart, personId, day, cargaId }` | Upsert por `@@unique([weekStart, personId, day])`. |
| DELETE | `/api/planner/day-carga?weekStart=&personId=&day=` | — | Quita la asignación → el día vuelve a la predeterminada. |

> Cuidado de routing en Express: define las rutas literales (`/day-cargas`, `/day-carga`) **antes** que cualquier ruta con parámetro tipo `/:algo` para evitar colisiones. El `planner.ts` actual usa `/` para entries, así que no hay conflicto, pero mantén las nuevas rutas con paths explícitos.

### 6.4 Nuevas funciones en `frontend/src/api.ts`
```ts
// Cargas
export const getCargas    = (personId: string) => req<Carga[]>(`/cargas?personId=${personId}`);
export const createCarga  = (data: { personId: string; name: string }) =>
  req<Carga>('/cargas', { method: 'POST', body: JSON.stringify(data) });
export const updateCarga  = (id: string, data: Partial<Pick<Carga, 'name' | 'slots' | 'sortOrder'>>) =>
  req<Carga>(`/cargas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const setDefaultCarga = (id: string) =>
  req<Carga>(`/cargas/${id}/default`, { method: 'PUT' });
export const deleteCarga  = (id: string) => req<void>(`/cargas/${id}`, { method: 'DELETE' });

// Carga por día
export const getDayCargas = (weekStart: string) =>
  req<PlannerDayCarga[]>(`/planner/day-cargas?weekStart=${weekStart}`);
export const setDayCarga  = (data: { weekStart: string; personId: string; day: WeekDay; cargaId: string }) =>
  req<PlannerDayCarga>('/planner/day-carga', { method: 'POST', body: JSON.stringify(data) });
export const clearDayCarga = (weekStart: string, personId: string, day: WeekDay) =>
  req<void>(`/planner/day-carga?weekStart=${weekStart}&personId=${personId}&day=${day}`, { method: 'DELETE' });
```

---

## 7. Tipos TypeScript (`frontend/src/types.ts`)

```ts
export type MealSlot = 'entrenamiento' | 'desayuno' | 'snack1' | 'almuerzo' | 'snack2' | 'cena';
export type WeekDay  = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
export type SlotType = 'structured' | 'free';

// CarbFood, CarbSelection, PlannerCarb, Protein, InBodyRecord, Person, PlannerEntry: SIN CAMBIOS
// (excepto que PlannerEntry sigue igual).

// Slot estructurado
export interface StructuredSlotData {
  protein?:        number;          // gramos
  carbs?:          number;          // porciones
  carbSelections?: CarbSelection[];
  notes?:          string;
}
// Slot libre
export interface FreeSlotData {
  text?: string;
}
export type SlotData = StructuredSlotData & FreeSlotData; // unión laxa para el JSON

export interface Carga {
  id:        string;
  personId:  string;
  name:      string;
  sortOrder: number;
  isDefault: boolean;
  slots:     Partial<Record<MealSlot, SlotData>>;
}

export interface PlannerDayCarga {
  id:        string;
  weekStart: string;
  personId:  string;
  day:       WeekDay;
  cargaId:   string;
}
```
Eliminar `MealPlan` y el `fruit` del antiguo `SlotData`.

---

## 8. Constantes (`frontend/src/constants.ts`)

```ts
export const MEAL_SLOTS: MealSlot[] = ['entrenamiento', 'desayuno', 'snack1', 'almuerzo', 'snack2', 'cena'];

export const STRUCTURED_SLOTS: MealSlot[] = ['desayuno', 'almuerzo', 'cena'];
export const FREE_SLOTS:       MealSlot[] = ['entrenamiento', 'snack1', 'snack2'];
export const slotType = (s: MealSlot): SlotType => STRUCTURED_SLOTS.includes(s) ? 'structured' : 'free';

export const SLOT_LABELS: Record<MealSlot, string> = {
  entrenamiento: 'Entrenamiento',
  desayuno:      'Desayuno',
  snack1:        'Colación 12:30',
  almuerzo:      'Comida',
  snack2:        'Colación 6:30',
  cena:          'Cena',
};

export const SLOT_ICONS: Record<MealSlot, string> = {
  entrenamiento: '🏋️', desayuno: '🍳', snack1: '🍎', almuerzo: '🥗', snack2: '🥜', cena: '🍽️',
};

export const SLOT_ACCENT: Record<MealSlot, string> = {
  entrenamiento: '#fbbf24', desayuno: '#22c97a', snack1: '#a78bfa', almuerzo: '#60a5fa', snack2: '#fb923c', cena: '#f87171',
};
```
El resto de `constants.ts` (`DAYS`, `DAY_LABELS`, `cookedWeight`, `rawWeight`, `formatPortionUnits`, `getWeekStart`, etc.) **no cambia**.

---

## 9. Frontend — cambios por página

### 9.1 `pages/MealPlanPage.tsx` → editor de Cargas
Hoy edita un único plan por persona. Rehacer para editar **cargas**:

**Estado y carga de datos**
- `cargas: Carga[]` (de `api.getCargas(person)`), `activeCargaId: string` (default: la `isDefault` o la primera).
- `carbFoods` como hoy.
- Si la persona no tiene cargas: mostrar estado vacío con botón "Crear primera carga".

**UI de cargas (arriba)**
- Selector de cargas tipo pestañas/segmented o dropdown: una por carga, marcando visualmente la predeterminada (ej. ⭐).
- Acciones: **+ Nueva carga** (pide nombre), **Renombrar**, **Borrar** (con `ConfirmDeleteModal`, bloqueado si es la última), **Marcar como predeterminada**.
- Al cambiar de carga activa, se muestran/editan sus slots.

**Edición de slots de la carga activa** — render por tipo:
- **Estructurada** (`desayuno/almuerzo/cena`): reutiliza la UI actual de Proteína (g) + Carbos (porciones) + `CarbSelectionsEditor` + notas. **Quitar la columna/campo Fruta** (eliminar de `MACRO_COLS`, de los inputs y de los totales). Recordar que proteína y carbos ahora son opcionales: permitir vacío (no forzar 0 visible).
- **Libre** (`entrenamiento/snack1/snack2`): un `<textarea>` multilínea para `slots[slot].text`. Nada de macros.

**Guardado**
- Editar slots actualiza `slots` y persiste con `api.updateCarga(activeCargaId, { slots })`. Mantén el patrón de "✓ Guardado" temporal.
- Mantén `CarbSelectionsEditor` y `CarbChips` tal cual (siguen aplicando a slots estructurados).

**Totales diarios**: recalcular sumando solo `protein`/`carbs` de los slots **estructurados** de la carga activa (quitar fruta). Es informativo, opcional mostrarlo por carga.

> Sugerencia de naming: puedes renombrar el archivo/página a `CargasPage.tsx` y la entrada del menú a "Cargas", pero **no es obligatorio**. Si lo renombras, actualiza `App.tsx` (`PAGES.plannutri`), `Sidebar.tsx` y la key `Page`. Si no, deja `MealPlanPage`/`plannutri` y solo cambia el contenido + el título visible a algo como "Plan / Cargas".

### 9.2 `pages/PlannerPage.tsx` → carga por día + slots libres como referencia
Cambios:
- Reemplazar `plans: Record<string, MealPlan>` por `cargas: Record<string, Carga[]>` (cargas por persona) y un mapa de asignaciones `dayCargas: PlannerDayCarga[]` (de `api.getDayCargas(weekStart)`).
- Helper `cargaForDay(personId, day): Carga | undefined`:
  1. Busca `PlannerDayCarga` para `(weekStart, personId, day)`; si existe, usa esa carga.
  2. Si no, usa la carga `isDefault` de la persona.
- `slotPlan` de cada celda = `cargaForDay(person, day)?.slots?.[slot] ?? {}` (antes salía del `MealPlan` único). **Quitar todas las referencias a `slotPlan.fruit`** (líneas ~380, ~862, ~899 del archivo actual y donde aparezcan los chips `tz🍊`).
- **Selector de carga por día**: en el encabezado de cada día (desktop `<th>` y mobile tab/día), agregar un control para elegir la carga de ese día (dropdown con las cargas de la persona). Cambiarlo llama `api.setDayCarga(...)` y refresca. Mostrar visualmente qué carga aplica (nombre/etiqueta). En vista "Todos" (solo lectura) muéstralo sin editar.
- **Slots estructurados**: la asignación de proteína + gramos + carbos (modal `EntryPicker`) sigue **igual**; solo cambia de dónde viene la meta (`planSlot` ahora es el slot estructurado de la carga del día). Los gramos crudos y compras siguen funcionando porque dependen de `PlannerEntry`, que no cambia.
- **Slots libres**: en el planner se muestran como **solo lectura** con `slots[slot].text` de la carga del día. **No** abren `EntryPicker`, no se asignan proteínas. Si `text` está vacío, muestra "—".
  - Implica filtrar: el `EntryPicker` y la asignación solo aplican a `STRUCTURED_SLOTS`. Para `FREE_SLOTS`, renderiza una tarjeta/celda de texto.
- Mantener vista "Todos", navegación de semana, barras de progreso de proteína (siguen basadas en `PlannerEntry`).

### 9.3 `pages/Dashboard.tsx`
- Reemplaza `getMealPlan(person)` por: cargar `getCargas(person)` y usar la **carga predeterminada** para `totalProtein` / `totalCarbs` (sumando solo slots estructurados). Quitar cualquier referencia a `fruit`.
- Si no hay cargas, mostrar 0 / placeholder sin romper.

### 9.4 `pages/ShoppingPage.tsx`
- **Sin cambios funcionales.** Depende solo de `PlannerEntry` (proteínas + gramos) y `ShoppingHave`. Verifica que siga compilando tras los cambios de tipos. (El `TODO` de incluir carbos en compras queda fuera de alcance.)

### 9.5 `components/Sidebar.tsx`
- Solo si renombras la página/menú. Si dejas `plannutri`, ajusta el label visible a "Cargas"/"Plan" si quieres; opcional.

---

## 10. Seed (`backend/prisma/seed.ts`)

Reemplazar la sección `mealPlans` (que hace `prisma.mealPlan.upsert`) por creación de **cargas**. Conserva Persons, Proteins, InBody y CarbFoods tal cual. Ejemplo basado en los planes reales del usuario (ajustable):

```ts
// Cargas (reemplaza el bloque mealPlans)
// Limpieza idempotente opcional: await prisma.carga.deleteMany({ where: { personId } });

const cargasByPerson: Record<string, Array<{ id: string; name: string; isDefault: boolean; sortOrder: number; slots: any }>> = {
  ruben: [
    {
      id: 'carga-ruben-baja', name: 'Carga baja', isDefault: true, sortOrder: 0,
      slots: {
        entrenamiento: { text: 'Antes: 1 rice cake con 1 cdita de cacahuate. Durante: suero. Terminando: 1 medida de proteína y ½ tza de fresas.' },
        desayuno: { protein: 90, carbs: 1, notes: '' },
        snack1:   { text: '½ tza de fruta y ½ medida de proteína' },
        almuerzo: { protein: 90, carbs: 2, notes: '' },
        snack2:   { text: '½ tza de fruta y ½ medida de proteína' },
        cena:     { protein: 90, carbs: 2, notes: '' },
      },
    },
    {
      id: 'carga-ruben-alta', name: 'Carga alta', isDefault: false, sortOrder: 1,
      slots: {
        entrenamiento: { text: 'Antes: 3 rice cake con 1 cdita de cacahuate. Durante: suero. Terminando: 1 medida de proteína y ½ tza de fresas + 2 cdas de avena.' },
        desayuno: { protein: 120, carbs: 1, notes: '' },
        snack1:   { text: '½ tza de fruta' },
        almuerzo: { protein: 160, carbs: 2, notes: '' },
        snack2:   { text: '½ tza de fruta y ½ tza de yogurt griego o ½ medida de proteína' },
        cena:     { protein: 160, carbs: 2, notes: '' },
      },
    },
  ],
  sarahi: [
    {
      id: 'carga-sarahi-base', name: 'Carga base', isDefault: true, sortOrder: 0,
      slots: {
        entrenamiento: { text: 'Antes: ½ medida de proteína y ½ tza de fruta. Durante: suero. Terminando: ½ medida de proteína.' },
        desayuno: { protein: 160, carbs: 2, notes: '' },
        snack1:   { text: '½ tza de fruta y ½ medida de proteína' },
        almuerzo: { protein: 200, carbs: 2, notes: '' },
        snack2:   { text: '1 tza de fruta y ½ medida de proteína' },
        cena:     { protein: 200, carbs: 2, notes: '' },
      },
    },
  ],
};

for (const [personId, list] of Object.entries(cargasByPerson)) {
  for (const c of list) {
    await prisma.carga.upsert({
      where:  { id: c.id },
      update: { name: c.name, isDefault: c.isDefault, sortOrder: c.sortOrder, slots: c.slots, personId },
      create: { id: c.id, personId, name: c.name, isDefault: c.isDefault, sortOrder: c.sortOrder, slots: c.slots },
    });
  }
}
```
> Los `carbSelections` de ejemplo se omiten por simplicidad; el usuario los puede agregar en la UI. Los gramos/porciones son aproximados de los planes; ajustables.

---

## 11. Plan de implementación paso a paso

1. **Backend / schema**: editar `schema.prisma` (quitar `MealPlan`, agregar `Carga` + `PlannerDayCarga`, ajustar `Person`). Correr `npm run db:push` y `npx prisma generate`.
2. **Backend / rutas**: crear `routes/cargas.ts`; extender `routes/planner.ts` con day-carga; registrar `cargas` en `index.ts`; eliminar `routes/mealPlans.ts` y su registro. Mantener invariante de `isDefault`.
3. **Backend / seed**: actualizar `seed.ts` (sección cargas). Correr `npm run seed`.
4. **Backend / verificar**: `npx tsc --noEmit`; probar endpoints con curl o Studio.
5. **Frontend / tipos y constantes**: actualizar `types.ts` y `constants.ts` (slots, tipos, helpers). Quitar `MealPlan` y `fruit`.
6. **Frontend / api.ts**: quitar meal-plans; agregar cargas + day-carga.
7. **Frontend / MealPlanPage**: rehacer como editor de cargas (selector + slots por tipo, sin fruta, con textarea para libres).
8. **Frontend / PlannerPage**: carga por día + slots libres de solo lectura + quitar fruta.
9. **Frontend / Dashboard**: usar carga predeterminada; quitar fruta.
10. **Frontend / verificar**: `npm run build`; revisar que no queden referencias a `getMealPlan`, `saveMealPlan`, `fruit`, `preEntreno`, `postEntreno` (grep). Revisar `ShoppingPage` y `Sidebar` compilan.
11. **Prueba manual** (criterios de aceptación abajo).

### Grep de verificación (no debe quedar nada)
```
getMealPlan | saveMealPlan | preEntreno | postEntreno | \.fruit | MealPlan
```

---

## 12. Criterios de aceptación

- [ ] Puedo crear varias cargas por persona, renombrarlas, borrarlas (no la última) y marcar una como predeterminada.
- [ ] En una comida estructurada puedo capturar **solo** proteína, **solo** carbos, o ambos; lo no llenado no se muestra. No existe el campo Fruta.
- [ ] La selección de carbohidratos (alimentos + porciones) sigue funcionando en slots estructurados.
- [ ] Los slots de entrenamiento y colaciones son un solo textarea libre; su contenido se guarda por carga.
- [ ] En el planner, cada día puedo elegir qué carga sigo; un día sin elegir usa la predeterminada.
- [ ] Las metas de proteína/carbo por día en el planner reflejan la carga elegida ese día.
- [ ] La asignación de proteína + gramos cocidos por slot estructurado sigue igual; gramos crudos y la Lista de Compras siguen calculándose bien.
- [ ] Los slots libres aparecen en el planner como texto de referencia (solo lectura).
- [ ] El Dashboard muestra metas basadas en la carga predeterminada, sin errores ni fruta.
- [ ] `npm run build` (frontend) y `npx tsc --noEmit` (backend) pasan sin errores.
- [ ] InBody, Proteínas y Carbohidratos siguen funcionando sin cambios.

---

## 13. Decisiones abiertas / defaults

Si el usuario no especifica, usa estos defaults (ya razonables):
- **Orden de slots**: `entrenamiento, desayuno, snack1, almuerzo, snack2, cena`. (El usuario no fijó orden; este coincide con el plan impreso. Cambiar es trivial en `MEAL_SLOTS`.)
- **Cargas son por persona** (no globales): confirmado.
- **UI del selector de cargas**: pestañas si caben (≤4), dropdown si son más. A criterio del implementador; prioriza claridad móvil (la app es mobile-first, hay vistas `md:` separadas).
- **Borrar carga usada por días del planner**: cae a la predeterminada (por el cascade). No se requiere confirmación extra más allá del `ConfirmDeleteModal`.

---

## 14. Archivos afectados (resumen)

**Backend**
- `prisma/schema.prisma` — quitar `MealPlan`; agregar `Carga`, `PlannerDayCarga`; ajustar `Person`.
- `src/routes/cargas.ts` — **nuevo**.
- `src/routes/planner.ts` — agregar endpoints day-carga.
- `src/routes/mealPlans.ts` — **eliminar**.
- `src/index.ts` — registrar `cargas`, quitar `meal-plans`.
- `prisma/seed.ts` — reemplazar bloque de meal plans por cargas.

**Frontend**
- `src/types.ts` — tipos nuevos; quitar `MealPlan`/`fruit`.
- `src/constants.ts` — slots, tipos, helpers.
- `src/api.ts` — cargas + day-carga; quitar meal-plans.
- `src/pages/MealPlanPage.tsx` — editor de cargas.
- `src/pages/PlannerPage.tsx` — carga por día + slots libres de solo lectura.
- `src/pages/Dashboard.tsx` — usar carga predeterminada.
- `src/pages/ShoppingPage.tsx` — verificar compila (sin cambios funcionales).
- `src/App.tsx` / `src/components/Sidebar.tsx` — solo si se renombra la página.

**No tocar**: todo lo de InBody, `ProteinsPage`, `CarbsPage`, modelos `Protein`/`CarbFood`/`InBodyRecord`/`ShoppingHave`, `theme.ts`.
