export type MealSlot = 'entrenamiento' | 'desayuno' | 'snack1' | 'almuerzo' | 'snack2' | 'cena';
export type WeekDay  = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
export type SlotType = 'structured' | 'free';

export interface Person {
  id:   string;
  name: string;
}

export interface InBodyRecord {
  id:                  string;
  personId:            string;
  date:                string;
  weight?:             number;
  skeletalMuscleMass?:    number;
  skeletalMusclePercent?: number;
  bodyFatMass?:           number;
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

export interface CarbFood {
  id:              string;
  personId:        string;
  name:            string;
  unitLabel:       string;
  unitsPerPortion: number;
  notes?:          string | null;
  sortOrder:       number;
}

export interface CarbSelection {
  carbFoodId: string;
  portions:   number;
}

export interface PlannerCarb {
  id:             string;
  plannerEntryId: string;
  carbFoodId:     string;
  portions:       number;
  carbFood?:      CarbFood;
}

export interface StructuredSlotData {
  protein?:        number;          // gramos
  carbs?:          number;          // porciones
  carbSelections?: CarbSelection[];
  notes?:          string;
}

export interface FreeSlotData {
  text?: string;
}

export type SlotData = StructuredSlotData & FreeSlotData;

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

export interface PlannerEntry {
  id:           string;
  weekStart:    string;
  personId:     string;
  day:          WeekDay;
  slot:         MealSlot;
  proteinId?:   string | null;
  cookedGrams?: number | null;
  protein?:     Protein | null;
  carbs?:       PlannerCarb[];
}
