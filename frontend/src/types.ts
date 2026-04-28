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

export interface SlotData {
  protein:          number;
  carbs:            number;        // PORTIONS (not grams)
  fruit:            number;
  notes:            string;
  carbSelections?:  CarbSelection[];
}

export interface MealPlan {
  id?:      string;
  personId: string;
  slots:    Partial<Record<MealSlot, SlotData>>;
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
