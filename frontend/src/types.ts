export type MealSlot = 'desayuno' | 'snack1' | 'almuerzo' | 'snack2' | 'cena' | 'preEntreno' | 'postEntreno';
export type WeekDay  = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export interface Person {
  id:   string;
  name: string;
}

export interface InBodyRecord {
  id:                  string;
  personId:            string;
  date:                string;
  weight?:             number;
  skeletalMuscleMass?: number;
  bodyFatMass?:        number;
  bodyFatPercent?:     number;
  bmi?:                number;
  visceralFatLevel?:   number;
  bmr?:                number;
  recommendedCalories?: number;
  waistHipRatio?:      number;
}

export interface Protein {
  id:          string;
  name:        string;
  lossPercent: number;
  notes?:      string | null;
}

export interface SlotData {
  protein: number;
  carbs:   number;
  fruit:   number;
  notes:   string;
}

export interface MealPlan {
  id?:      string;
  personId: string;
  slots:    Partial<Record<MealSlot, SlotData>>;
}

export interface PlannerEntry {
  id:          string;
  weekStart:   string;
  personId:    string;
  day:         WeekDay;
  slot:        MealSlot;
  proteinId?:  string | null;
  cookedGrams?: number | null;
  protein?:    Protein | null;
}
