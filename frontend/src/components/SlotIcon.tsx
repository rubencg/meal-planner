import { Dumbbell, EggFried, Apple, Salad, Nut, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { MealSlot } from '../types';

const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
  entrenamiento: Dumbbell,
  desayuno:      EggFried,
  snack1:        Apple,
  almuerzo:      Salad,
  snack2:        Nut,
  cena:          UtensilsCrossed,
};

// Color comes from the theme's --slot-* variables (darker shades in light mode)
export function SlotIcon({ slot, size = 16 }: { slot: MealSlot; size?: number }) {
  const Icon = SLOT_ICONS[slot];
  return <Icon size={size} strokeWidth={2} className="shrink-0 inline-block align-[-2px]" style={{ color: `var(--slot-${slot})` }} />;
}
