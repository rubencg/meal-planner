import type { Person, InBodyRecord, Protein, MealPlan, PlannerEntry, WeekDay, MealSlot } from './types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Persons
export const getPersons  = ()                         => req<Person[]>('/persons');
export const createPerson = (data: { id: string; name: string }) => req<Person>('/persons', { method: 'POST', body: JSON.stringify(data) });

// InBody
export const getInBody    = (personId: string) => req<InBodyRecord[]>(`/inbody?personId=${personId}`);
export const createInBody = (data: Omit<InBodyRecord, 'id'>) => req<InBodyRecord>('/inbody', { method: 'POST', body: JSON.stringify(data) });
export const updateInBody = (id: string, data: Partial<InBodyRecord>) => req<InBodyRecord>(`/inbody/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteInBody = (id: string) => req<void>(`/inbody/${id}`, { method: 'DELETE' });

// Proteins
export const getProteins   = ()                       => req<Protein[]>('/proteins');
export const createProtein = (data: Omit<Protein, 'id'>) => req<Protein>('/proteins', { method: 'POST', body: JSON.stringify(data) });
export const updateProtein = (id: string, data: Omit<Protein, 'id'>) => req<Protein>(`/proteins/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProtein = (id: string) => req<void>(`/proteins/${id}`, { method: 'DELETE' });

// Meal Plans
export const getMealPlan  = (personId: string)       => req<MealPlan>(`/meal-plans/${personId}`);
export const saveMealPlan = (personId: string, slots: MealPlan['slots']) => req<MealPlan>(`/meal-plans/${personId}`, { method: 'PUT', body: JSON.stringify({ slots }) });

// Planner
export const getWeek     = (weekStart: string) => req<PlannerEntry[]>(`/planner?weekStart=${weekStart}`);
export const setSlot     = (data: { weekStart: string; personId: string; day: WeekDay; slot: MealSlot; proteinId?: string; cookedGrams?: number }) =>
  req<PlannerEntry>('/planner', { method: 'POST', body: JSON.stringify(data) });
export const clearSlot   = (weekStart: string, personId: string, day: string, slot: string) =>
  req<void>(`/planner?weekStart=${weekStart}&personId=${personId}&day=${day}&slot=${slot}`, { method: 'DELETE' });
export const clearWeek   = (weekStart: string, personId: string) =>
  req<void>(`/planner?weekStart=${weekStart}&personId=${personId}`, { method: 'DELETE' });

// Shopping have
export const getHave    = (weekStart: string)                                  => req<string[]>(`/shopping/have?weekStart=${weekStart}`);
export const toggleHave = (weekStart: string, proteinId: string, have: boolean) =>
  req<void>('/shopping/have', { method: 'POST', body: JSON.stringify({ weekStart, proteinId, have }) });
