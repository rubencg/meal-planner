import type { MealSlot, WeekDay, CarbFood } from './types';

export const MEAL_SLOTS: MealSlot[] = ['desayuno', 'snack1', 'almuerzo', 'snack2', 'cena', 'preEntreno', 'postEntreno'];

export const SLOT_LABELS: Record<MealSlot, string> = {
  desayuno:    'Desayuno',
  snack1:      'Snack Mañana',
  almuerzo:    'Almuerzo',
  snack2:      'Snack Tarde',
  cena:        'Cena',
  preEntreno:  'Pre-Entreno',
  postEntreno: 'Post-Entreno',
};

export const SLOT_ICONS: Record<MealSlot, string> = {
  desayuno:    '🍳',
  snack1:      '🍎',
  almuerzo:    '🥗',
  snack2:      '🥜',
  cena:        '🍽️',
  preEntreno:  '⚡',
  postEntreno: '🥤',
};

export const SLOT_ACCENT: Record<MealSlot, string> = {
  desayuno:    '#22c97a',
  snack1:      '#a78bfa',
  almuerzo:    '#60a5fa',
  snack2:      '#fb923c',
  cena:        '#f87171',
  preEntreno:  '#fbbf24',
  postEntreno: '#34d399',
};

export const DAYS: WeekDay[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export const DAY_LABELS: Record<WeekDay, string> = {
  lunes:     'Lun',
  martes:    'Mar',
  miercoles: 'Mié',
  jueves:    'Jue',
  viernes:   'Vie',
};

export const DAY_FULL: Record<WeekDay, string> = {
  lunes:     'Lunes',
  martes:    'Martes',
  miercoles: 'Miércoles',
  jueves:    'Jueves',
  viernes:   'Viernes',
};

export function getWeekStart(date?: string): string {
  const d = date ? new Date(date + 'T12:00:00') : new Date();
  const day  = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function formatWeekLabel(weekStart: string): string {
  const d   = new Date(weekStart + 'T12:00:00');
  const end = new Date(d);
  end.setDate(end.getDate() + 4);
  const fmt = (x: Date) => x.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  return `${fmt(d)} – ${fmt(end)}`;
}

export function cookedWeight(rawGrams: number, lossPercent: number): number {
  return Math.round(rawGrams * (1 - lossPercent / 100));
}

export function rawWeight(cookedGrams: number, lossPercent: number): number {
  if (!lossPercent) return cookedGrams;
  return Math.round(cookedGrams / (1 - lossPercent / 100));
}

export function todayKey(): WeekDay | null {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return null;
  return (['', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as (WeekDay | '')[]) [day] as WeekDay;
}

/** Returns "1 pza", "½ tza", "2 reb", etc. */
export function formatPortionUnits(portions: number, food: Pick<CarbFood, 'unitLabel' | 'unitsPerPortion'>): string {
  const units = portions * food.unitsPerPortion;
  const whole = Math.floor(units);
  const frac  = units - whole;
  let qty: string;
  if (frac === 0)        qty = String(whole);
  else if (frac === 0.5) qty = whole === 0 ? '½' : `${whole}½`;
  else                   qty = units.toFixed(2).replace(/\.?0+$/, '');
  return `${qty} ${food.unitLabel}`;
}
