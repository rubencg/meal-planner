import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import {
  MEAL_SLOTS, SLOT_LABELS, SLOT_ICONS, SLOT_ACCENT,
  DAYS, DAY_FULL, DAY_LABELS, getWeekStart, formatWeekLabel, rawWeight, todayKey,
  formatPortionUnits,
} from '../constants';
import type { Protein, MealPlan, PlannerEntry, MealSlot, WeekDay, SlotData, CarbFood, CarbSelection } from '../types';
import type { PageProps } from '../App';

/* ─────────────────────────── EntryPicker modal ─────────────────────────── */

function EntryPicker({
  slot, day, current, planSlot, carbFoods, onSelect, onClear, onClose,
}: {
  slot:       MealSlot;
  day:        WeekDay;
  current:    PlannerEntry | undefined;
  planSlot:   Partial<SlotData>;
  carbFoods:  CarbFood[];
  onSelect:   (proteinId: string | null, cookedGrams: number, carbs: CarbSelection[]) => void;
  onClear:    () => void;
  onClose:    () => void;
}) {
  const [proteins,  setProteins]  = useState<Protein[]>([]);
  const [selected,  setSelected]  = useState<string | null>(current?.proteinId ?? null);
  const [cookedG,   setCookedG]   = useState(current?.cookedGrams ?? planSlot.protein ?? 0);

  // Seed carb editor: entry's carbs if any, else meal plan defaults, else empty
  const defaultCarbs: CarbSelection[] = (() => {
    if (current?.carbs && current.carbs.length > 0) {
      return current.carbs.map(pc => ({ carbFoodId: pc.carbFoodId, portions: pc.portions }));
    }
    if (planSlot.carbSelections && planSlot.carbSelections.length > 0) {
      return planSlot.carbSelections.map(cs => ({ ...cs }));
    }
    return carbFoods.length > 0 ? [{ carbFoodId: carbFoods[0].id, portions: 0.5 }] : [];
  })();

  const [carbSels, setCarbSels] = useState<CarbSelection[]>(defaultCarbs);

  useEffect(() => { api.getProteins().then(setProteins).catch(() => {}); }, []);

  const selProtein = proteins.find(p => p.id === selected);
  const rawNeeded  = selProtein ? rawWeight(cookedG, selProtein.lossPercent) : cookedG;
  const planTarget = planSlot.protein ?? 0;
  const carbTarget = planSlot.carbs   ?? 0;
  const totalCarbPortions = carbSels.reduce((s, r) => s + r.portions, 0);
  const carbMismatch = carbTarget > 0 && Math.abs(totalCarbPortions - carbTarget) > 0.01;

  const updateCarbRow = (idx: number, patch: Partial<CarbSelection>) => {
    setCarbSels(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const removeCarbRow = (idx: number) => {
    setCarbSels(prev => prev.filter((_, i) => i !== idx));
  };
  const addCarbRow = () => {
    const firstFood = carbFoods[0];
    if (!firstFood) return;
    setCarbSels(prev => [...prev, { carbFoodId: firstFood.id, portions: 0.5 }]);
  };

  const handleAssign = () => {
    onSelect(selected, cookedG, carbSels);
  };

  const hasProtein = !!current?.proteinId;
  const hasCarbs   = !!(current?.carbs && current.carbs.length > 0);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[480px] max-h-[90dvh] flex flex-col rounded-t-2xl md:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border2}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="text-[15px] font-bold mb-1" style={{ color: C.text }}>
            {SLOT_ICONS[slot]} {SLOT_LABELS[slot]}
          </div>
          <div className="text-[12px]" style={{ color: C.muted }}>
            {DAY_FULL[day]} · Meta:{' '}
            <span style={{ color: C.accent }}>{planTarget}g proteína</span>
            {carbTarget > 0 && (
              <> · <span style={{ color: '#60a5fa' }}>{carbTarget} porc. carbos</span></>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-2 flex flex-col gap-4">
          {/* ── Proteína section ── */}
          <div>
            <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Proteína</div>
            <div className="flex flex-col gap-1.5">
              {proteins.length === 0 && (
                <div className="text-center py-3 text-[13px]" style={{ color: C.muted }}>
                  Sin proteínas registradas.
                </div>
              )}
              {proteins.map(p => {
                const isSel = selected === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p.id); if (!cookedG) setCookedG(planTarget || 0); }}
                    className="px-3.5 py-2.5 rounded-[10px] text-left cursor-pointer transition-all duration-150 min-h-[48px]"
                    style={{
                      border:     `1px solid ${isSel ? C.accent : C.border}`,
                      background: isSel ? C.accentGlow : C.surface2,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-[13px] font-semibold" style={{ color: isSel ? C.accent : C.text }}>
                        {p.name}
                      </div>
                      <div className="text-[11px]" style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                        -{p.lossPercent}%
                      </div>
                    </div>
                    {p.notes && (
                      <div className="text-[11px] mt-0.5" style={{ color: C.dim }}>{p.notes}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Gram input */}
            {selected && (
              <div
                className="mt-2 rounded-[10px] p-3.5"
                style={{ background: C.surface2, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[13px] flex-1" style={{ color: C.muted }}>Gramos cocidos:</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={cookedG}
                    onChange={e => setCookedG(parseFloat(e.target.value) || 0)}
                    className="rounded-lg px-2.5 py-2 text-[15px] font-bold text-center min-h-[44px]"
                    style={{
                      width:      80,
                      background: C.surface,
                      border:     `1px solid ${C.border2}`,
                      color:      C.text,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  />
                  <span className="text-[13px]" style={{ color: C.muted }}>g</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: C.muted }}>Crudo a comprar:</span>
                  <span className="font-bold" style={{ color: C.yellow, fontFamily: "'DM Mono', monospace" }}>
                    {rawNeeded}g
                  </span>
                </div>
                {planTarget > 0 && (
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: C.surface3 }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width:      `${Math.min((cookedG / planTarget) * 100, 100)}%`,
                        background: cookedG >= planTarget ? C.accent : C.yellow,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Carbohidratos section ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider" style={{ color: '#60a5fa' }}>Carbohidratos</div>
              {carbTarget > 0 && (
                <div className="text-[11px]" style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                  Total: {totalCarbPortions.toFixed(1)} / meta {carbTarget} porc.
                </div>
              )}
            </div>

            {carbFoods.length === 0 ? (
              <div className="text-[12px]" style={{ color: C.dim }}>
                Sin carbohidratos registrados. Agrega en la pestaña Carbohidratos.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {carbSels.map((sel, idx) => {
                  const food = carbFoods.find(f => f.id === sel.carbFoodId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={sel.carbFoodId}
                        onChange={e => updateCarbRow(idx, { carbFoodId: e.target.value })}
                        className="flex-1 rounded-[7px] px-2 py-2 text-[12px] min-h-[40px]"
                        style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text }}
                      >
                        {carbFoods.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={sel.portions}
                        onChange={e => updateCarbRow(idx, { portions: parseFloat(e.target.value) || 0.5 })}
                        className="rounded-[7px] px-2 py-2 text-[12px] text-center min-h-[40px]"
                        style={{ width: 60, background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, fontFamily: "'DM Mono', monospace" }}
                      />
                      <span className="text-[10px] shrink-0" style={{ color: C.dim }}>porc.</span>
                      {food && sel.portions > 0 && (
                        <span className="text-[10px] shrink-0" style={{ color: '#60a5fa', minWidth: 44 }}>
                          {formatPortionUnits(sel.portions, food)}
                        </span>
                      )}
                      <button
                        onClick={() => removeCarbRow(idx)}
                        className="px-2 py-1 rounded-[6px] text-[12px] cursor-pointer min-h-[40px] shrink-0"
                        style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={addCarbRow}
                  className="text-[12px] px-3 py-1.5 rounded-[7px] cursor-pointer self-start min-h-[36px]"
                  style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                >
                  + Agregar
                </button>

                {carbMismatch && (
                  <div
                    className="text-[11px] px-2.5 py-1.5 rounded-[7px]"
                    style={{ background: '#60a5fa12', color: '#60a5fa', border: '1px solid #60a5fa30' }}
                  >
                    Seleccionado ({totalCarbPortions.toFixed(1)} porc.) ≠ meta ({carbTarget} porc.)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-6 pb-6 pt-3 shrink-0">
          {(hasProtein || hasCarbs) && (
            <button
              onClick={onClear}
              className="px-3.5 py-2.5 rounded-[9px] text-[13px] cursor-pointer min-h-[44px]"
              style={{ border: `1px solid ${C.red}44`, background: 'none', color: C.red }}
            >
              Quitar
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[9px] text-[13px] cursor-pointer min-h-[44px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            className="py-2.5 rounded-[9px] text-[13px] font-bold cursor-pointer min-h-[44px]"
            style={{
              flex:       2,
              border:     'none',
              background: C.accent,
              color:      '#000',
            }}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline carb chips for planner cells ─── */
function PlannerCarbChips({ entry, carbFoods }: { entry: PlannerEntry; carbFoods: CarbFood[] }) {
  const carbs = entry.carbs ?? [];
  if (carbs.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
      {carbs.map((pc, i) => {
        const food = carbFoods.find(f => f.id === pc.carbFoodId) ?? pc.carbFood;
        if (!food) return null;
        return (
          <div
            key={i}
            style={{
              fontSize: 10, padding: '2px 6px',
              borderLeft: '3px solid #60a5fa',
              borderRadius: '0 5px 5px 0',
              background: '#60a5fa0d',
              color: '#60a5fa',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {formatPortionUnits(pc.portions, food)} {food.name}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────── TodosCell (desktop table) ───────────────────── */

function TodosCell({
  day, slot, allEntries, persons, slotPlan, accent, isToday, carbFoodsMap,
}: {
  day: WeekDay; slot: MealSlot; allEntries: PlannerEntry[];
  persons: { id: string; name: string }[]; slotPlan: Partial<SlotData>; accent: string; isToday: boolean;
  carbFoodsMap: Record<string, CarbFood[]>;
}) {
  const cellEntries = allEntries.filter(e => e.day === day && e.slot === slot);
  const proteinEntries = cellEntries.filter(e => e.proteinId);

  type Group = { protein: Protein; totalCooked: number; persons: { personId: string; cookedGrams: number }[] };
  const grouped: Record<string, Group> = {};
  proteinEntries.forEach(e => {
    const prot = e.protein;
    if (!prot) return;
    if (!grouped[e.proteinId!]) grouped[e.proteinId!] = { protein: prot, totalCooked: 0, persons: [] };
    grouped[e.proteinId!].totalCooked += e.cookedGrams ?? 0;
    grouped[e.proteinId!].persons.push({ personId: e.personId, cookedGrams: e.cookedGrams ?? 0 });
  });
  const groups = Object.values(grouped);

  // Aggregate carbs across all persons for this cell
  type CarbGroup = { food: CarbFood; totalPortions: number; pList: { personId: string; portions: number }[] };
  const carbGrouped: Record<string, CarbGroup> = {};
  cellEntries.forEach(e => {
    const allFoods = Object.values(carbFoodsMap).flat();
    (e.carbs ?? []).forEach(pc => {
      const food = allFoods.find(f => f.id === pc.carbFoodId) ?? pc.carbFood;
      if (!food) return;
      if (!carbGrouped[pc.carbFoodId]) carbGrouped[pc.carbFoodId] = { food, totalPortions: 0, pList: [] };
      carbGrouped[pc.carbFoodId].totalPortions += pc.portions;
      carbGrouped[pc.carbFoodId].pList.push({ personId: e.personId, portions: pc.portions });
    });
  });
  const carbGroups = Object.values(carbGrouped);

  const isEmpty = groups.length === 0 && carbGroups.length === 0;

  return (
    <td
      style={{
        padding:       '4px',
        verticalAlign: 'top',
        borderTop:     `1px solid ${C.border}`,
        background:    isToday ? C.accentGlow : 'transparent',
      }}
    >
      <div style={{ marginBottom: 3, padding: '4px 6px', borderRadius: '6px 6px 0 0', background: C.surface3 + '80', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g P</span>}
        {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}porc C</span>}
        {(slotPlan.fruit   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#fb923c', fontFamily: "'DM Mono', monospace" }}>{slotPlan.fruit}tz🍊</span>}
      </div>
      {isEmpty ? (
        <div style={{ minHeight: 36, border: `1px dashed ${C.border}`, borderRadius: '0 7px 7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: C.dim }}>—</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map(({ protein, totalCooked, persons: pList }) => {
            const rawG = rawWeight(totalCooked, protein.lossPercent);
            return (
              <div
                key={protein.id}
                style={{ borderLeft: `3px solid ${accent}`, borderRadius: '0 7px 7px 0', padding: '5px 7px', background: C.surface2, border: `1px solid ${accent}30`, borderLeftWidth: 3 }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{protein.name}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 3, fontSize: 10, fontFamily: "'DM Mono', monospace", flexWrap: 'wrap' }}>
                  <span style={{ color: C.accent }}>{totalCooked}g 🍳</span>
                  <span style={{ color: C.yellow }}>{rawG}g crudo</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {pList.map(pl => {
                    const pName = persons.find(p => p.id === pl.personId)?.name ?? pl.personId;
                    return (
                      <span key={pl.personId} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18', color: pl.personId === 'ruben' ? '#60a5fa' : '#a78bfa' }}>
                        {pName} {pl.cookedGrams}g
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {carbGroups.map(({ food, totalPortions, pList }) => (
            <div
              key={food.id}
              style={{ borderLeft: '3px solid #60a5fa', borderRadius: '0 7px 7px 0', padding: '5px 7px', background: '#60a5fa08', border: '1px solid #60a5fa25', borderLeftWidth: 3 }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', lineHeight: 1.2 }}>
                {formatPortionUnits(totalPortions, food)} {food.name}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                {pList.map(pl => {
                  const pName = persons.find(p => p.id === pl.personId)?.name ?? pl.personId;
                  return (
                    <span key={pl.personId} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18', color: pl.personId === 'ruben' ? '#60a5fa' : '#a78bfa' }}>
                      {pName} {pl.portions}porc
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </td>
  );
}

/* ───────────────────────── Mobile day card ───────────────────────── */

function MobileDayCard({
  day, entries, plan, persons, viewMode, isToday, planDailyProtein,
  onCellPress, carbFoodsMap,
}: {
  day:              WeekDay;
  entries:          PlannerEntry[];
  plan:             MealPlan;
  persons:          { id: string; name: string }[];
  viewMode:         'person' | 'todos';
  isToday:          boolean;
  planDailyProtein: number;
  onCellPress:      (day: WeekDay, slot: MealSlot) => void;
  carbFoodsMap:     Record<string, CarbFood[]>;
}) {
  const dayProtein = entries
    .filter(e => e.day === day && e.proteinId)
    .reduce((s, e) => s + (e.cookedGrams ?? 0), 0);
  const pct = planDailyProtein > 0 ? Math.min((dayProtein / planDailyProtein) * 100, 100) : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: isToday ? C.accentGlow : C.surface2, border: `1px solid ${isToday ? C.accent : C.border}` }}
    >
      {/* Day header */}
      <div className="px-4 py-2.5 flex justify-between items-center" style={{ borderBottom: `1px solid ${isToday ? C.accent + '44' : C.border}` }}>
        <div className="font-semibold text-[15px]" style={{ color: isToday ? C.accent : C.text }}>
          {DAY_FULL[day]}
        </div>
        {dayProtein > 0 && (
          <div className="text-[11px]" style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}>
            {dayProtein}g prot.
          </div>
        )}
      </div>

      {/* Progress bar */}
      {dayProtein > 0 && (
        <div className="px-4 pt-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface3 }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: pct >= 100 ? C.accent : C.yellow }} />
          </div>
        </div>
      )}

      {/* Slot rows */}
      <div className="p-3 flex flex-col gap-2">
        {MEAL_SLOTS.map(slot => {
          const accent   = SLOT_ACCENT[slot];
          const slotPlan = (plan.slots?.[slot] ?? {}) as Partial<SlotData>;
          const allFoods = Object.values(carbFoodsMap).flat();

          if (viewMode === 'todos') {
            const cellEntries    = entries.filter(e => e.day === day && e.slot === slot);
            const proteinEntries = cellEntries.filter(e => e.proteinId);

            type Group = { protein: Protein; totalCooked: number; pList: { personId: string; cookedGrams: number }[] };
            const grouped: Record<string, Group> = {};
            proteinEntries.forEach(e => {
              const prot = e.protein;
              if (!prot) return;
              if (!grouped[e.proteinId!]) grouped[e.proteinId!] = { protein: prot, totalCooked: 0, pList: [] };
              grouped[e.proteinId!].totalCooked += e.cookedGrams ?? 0;
              grouped[e.proteinId!].pList.push({ personId: e.personId, cookedGrams: e.cookedGrams ?? 0 });
            });
            const groups = Object.values(grouped);

            type CarbGroup = { food: CarbFood; totalPortions: number; pList: { personId: string; portions: number }[] };
            const carbGrouped: Record<string, CarbGroup> = {};
            cellEntries.forEach(e => {
              (e.carbs ?? []).forEach(pc => {
                const food = allFoods.find(f => f.id === pc.carbFoodId) ?? pc.carbFood;
                if (!food) return;
                if (!carbGrouped[pc.carbFoodId]) carbGrouped[pc.carbFoodId] = { food, totalPortions: 0, pList: [] };
                carbGrouped[pc.carbFoodId].totalPortions += pc.portions;
                carbGrouped[pc.carbFoodId].pList.push({ personId: e.personId, portions: pc.portions });
              });
            });
            const carbGroups = Object.values(carbGrouped);

            return (
              <div key={slot} className="rounded-lg overflow-hidden" style={{ background: C.surface3 + '60' }}>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="text-[12px]">{SLOT_ICONS[slot]}</span>
                  <span className="text-[11px] font-medium" style={{ color: C.muted }}>{SLOT_LABELS[slot]}</span>
                  {(slotPlan.protein ?? 0) > 0 && (
                    <span className="ml-auto text-[9px]" style={{ color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>
                      {slotPlan.protein}g P
                    </span>
                  )}
                </div>
                <div className="px-2.5 py-1.5">
                  {groups.length === 0 && carbGroups.length === 0 ? (
                    <span className="text-[11px]" style={{ color: C.dim }}>—</span>
                  ) : (
                    <>
                      {groups.map(({ protein, totalCooked, pList }) => {
                        const rawG = rawWeight(totalCooked, protein.lossPercent);
                        return (
                          <div key={protein.id} className="mb-1 last:mb-0">
                            <div className="text-[12px] font-semibold" style={{ color: C.text }}>{protein.name}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                              {totalCooked}g 🍳 · {rawG}g crudo
                            </div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {pList.map(pl => {
                                const pName = persons.find(p => p.id === pl.personId)?.name ?? pl.personId;
                                return (
                                  <span key={pl.personId} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18', color: pl.personId === 'ruben' ? '#60a5fa' : '#a78bfa' }}>
                                    {pName} {pl.cookedGrams}g
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {carbGroups.map(({ food, totalPortions, pList }) => (
                        <div key={food.id} className="mb-1 last:mb-0">
                          <div className="text-[11px] font-semibold" style={{ color: '#60a5fa' }}>
                            {formatPortionUnits(totalPortions, food)} {food.name}
                          </div>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {pList.map(pl => {
                              const pName = persons.find(p => p.id === pl.personId)?.name ?? pl.personId;
                              return (
                                <span key={pl.personId} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18', color: pl.personId === 'ruben' ? '#60a5fa' : '#a78bfa' }}>
                                  {pName} {pl.portions}porc
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          }

          // Person view — editable
          const entry   = entries.find(e => e.day === day && e.slot === slot);
          const protein = entry?.protein ?? null;
          const rawG    = protein ? rawWeight(entry!.cookedGrams ?? 0, protein.lossPercent) : 0;
          const hasCarbs = (entry?.carbs?.length ?? 0) > 0;

          return (
            <button
              key={slot}
              onClick={() => onCellPress(day, slot)}
              className="w-full text-left rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
              style={{ border: `1px solid ${(protein || hasCarbs) ? accent + '44' : C.border}`, background: 'transparent' }}
            >
              {/* Slot header */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: C.surface3 + '60', borderBottom: `1px solid ${C.border}` }}>
                <span className="text-[12px]">{SLOT_ICONS[slot]}</span>
                <span className="text-[11px] font-medium" style={{ color: C.muted }}>{SLOT_LABELS[slot]}</span>
                <div className="ml-auto flex gap-1.5">
                  {(slotPlan.protein ?? 0) > 0 && (
                    <span className="text-[9px]" style={{ color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>
                      {slotPlan.protein}g P
                    </span>
                  )}
                  {(slotPlan.carbs ?? 0) > 0 && (
                    <span className="text-[9px]" style={{ color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>
                      {slotPlan.carbs}porc C
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-2.5 py-2">
                {protein ? (
                  <div>
                    <div className="text-[12px] font-semibold leading-tight" style={{ color: C.text, borderLeft: `3px solid ${accent}`, paddingLeft: 6 }}>
                      {protein.name}
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <span style={{ color: C.accent }}>{entry!.cookedGrams}g 🍳</span>
                      <span style={{ color: C.yellow }}>{rawG}g crudo</span>
                    </div>
                    {(slotPlan.protein ?? 0) > 0 && (
                      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: C.surface3 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:      `${Math.min(((entry!.cookedGrams ?? 0) / (slotPlan.protein ?? 1)) * 100, 100)}%`,
                            background: (entry!.cookedGrams ?? 0) >= (slotPlan.protein ?? 0) ? C.accent : C.yellow,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : !hasCarbs ? (
                  <div className="text-[12px] text-center py-1.5" style={{ color: C.dim }}>
                    + proteína / carbo
                  </div>
                ) : null}

                {/* Carb chips */}
                {entry && hasCarbs && (
                  <div className="mt-1">
                    {(entry.carbs ?? []).map((pc, i) => {
                      const food = allFoods.find(f => f.id === pc.carbFoodId) ?? pc.carbFood;
                      if (!food) return null;
                      return (
                        <div
                          key={i}
                          className="text-[10px] mt-1"
                          style={{ color: '#60a5fa', borderLeft: '2px solid #60a5fa', paddingLeft: 5, fontFamily: "'DM Mono', monospace" }}
                        >
                          {formatPortionUnits(pc.portions, food)} {food.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Main Page ─────────────────────────────── */

export default function PlannerPage({ person, setPerson }: PageProps) {
  const [weekStart,    setWeekStart]    = useState(() => localStorage.getItem('tiki_week') || getWeekStart());
  const [entries,      setEntries]      = useState<PlannerEntry[]>([]);
  const [plans,        setPlans]        = useState<Record<string, MealPlan>>({});
  const [persons,      setPersons]      = useState([{ id: 'ruben', name: 'Ruben' }, { id: 'sarahi', name: 'Sarahi' }]);
  const [viewMode,     setViewMode]     = useState<'person' | 'todos'>('person');
  const [picker,       setPicker]       = useState<{ day: WeekDay; slot: MealSlot } | null>(null);
  const [carbFoodsMap, setCarbFoodsMap] = useState<Record<string, CarbFood[]>>({});

  const todayDay = todayKey();
  const [activeDay, setActiveDay] = useState<WeekDay>(todayDay ?? 'lunes');

  useEffect(() => { localStorage.setItem('tiki_week', weekStart); }, [weekStart]);

  const reload = () => api.getWeek(weekStart).then(setEntries).catch(() => {});

  useEffect(() => {
    api.getPersons().then(setPersons).catch(() => {});
    reload();
  }, [weekStart]);

  useEffect(() => {
    persons.forEach(p => {
      api.getMealPlan(p.id)
        .then(plan => setPlans(prev => ({ ...prev, [p.id]: plan })))
        .catch(() => {});
      api.getCarbFoods(p.id)
        .then(foods => setCarbFoodsMap(prev => ({ ...prev, [p.id]: foods })))
        .catch(() => {});
    });
  }, [persons]);

  const plan      = plans[person]       ?? { personId: person, slots: {} };
  const carbFoods = carbFoodsMap[person] ?? [];

  const getEntry = (day: WeekDay, slot: MealSlot) =>
    entries.find(e => e.personId === person && e.day === day && e.slot === slot);

  const handleAssign = async (proteinId: string | null, cookedGrams: number, carbs: CarbSelection[]) => {
    if (!picker) return;
    await api.setSlot({
      weekStart,
      personId:   person,
      day:        picker.day,
      slot:       picker.slot,
      ...(proteinId ? { proteinId, cookedGrams } : {}),
      carbs:      carbs.filter(c => c.portions > 0),
    });
    reload();
    setPicker(null);
  };

  const handleClear = async () => {
    if (!picker) return;
    await api.clearSlot(weekStart, person, picker.day, picker.slot);
    reload();
    setPicker(null);
  };

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const isCurrentWeek = weekStart === getWeekStart();
  const today         = todayKey();

  const dayProtein = (day: WeekDay) => {
    const es = viewMode === 'todos'
      ? entries.filter(e => e.day === day && e.proteinId)
      : entries.filter(e => e.personId === person && e.day === day && e.proteinId);
    return es.reduce((s, e) => s + (e.cookedGrams ?? 0), 0);
  };

  const allPlanProtein = persons.reduce((s, p) => {
    const pl = plans[p.id];
    return s + Object.values(pl?.slots ?? {}).reduce((ss, sl) => ss + (sl?.protein ?? 0), 0);
  }, 0);
  const planDailyProtein = viewMode === 'todos'
    ? allPlanProtein
    : Object.values(plan.slots ?? {}).reduce((s, sl) => s + (sl?.protein ?? 0), 0);

  const activeDayEntries = viewMode === 'todos'
    ? entries.filter(e => e.day === activeDay)
    : entries.filter(e => e.personId === person && e.day === activeDay);

  return (
    <div className="px-4 py-5 md:px-6 md:py-[22px] flex flex-col" style={{ height: '100%' }}>

      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-3.5 flex-wrap gap-2">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Planificador Semanal
          </h1>
          <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
            {viewMode === 'todos'
              ? 'Toda la familia'
              : (persons.find(p => p.id === person)?.name ?? person)}{' '}
            · {formatWeekLabel(weekStart)}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => shiftWeek(-1)} className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]" style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}>
            ← Ant.
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart())}
            className="px-3 py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${isCurrentWeek ? C.accent : C.border2}`, background: isCurrentWeek ? C.accentGlow : 'none', color: isCurrentWeek ? C.accent : C.muted }}
          >
            Hoy
          </button>
          <button onClick={() => shiftWeek(1)} className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]" style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}>
            Sig. →
          </button>
        </div>
      </div>

      {/* ── Person / view toggle ── */}
      <div className="flex gap-1.5 mb-3.5 p-1 rounded-[10px] w-fit" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        {persons.map(p => (
          <button
            key={p.id}
            onClick={() => { setViewMode('person'); setPerson(p.id); }}
            className="px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer transition-all duration-150 min-h-[36px]"
            style={{
              border:     'none',
              background: viewMode === 'person' && person === p.id ? C.accent : 'transparent',
              color:      viewMode === 'person' && person === p.id ? '#000' : C.muted,
              fontWeight: viewMode === 'person' && person === p.id ? 600 : 400,
            }}
          >
            {p.id === 'ruben' ? '🧔' : '👩'} {p.name}
          </button>
        ))}
        <div className="w-px my-1" style={{ background: C.border }} />
        <button
          onClick={() => setViewMode('todos')}
          className="px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer transition-all duration-150 min-h-[36px]"
          style={{ border: 'none', background: viewMode === 'todos' ? C.accent : 'transparent', color: viewMode === 'todos' ? '#000' : C.muted, fontWeight: viewMode === 'todos' ? 600 : 400 }}
        >
          👨‍👩‍👧 Todos
        </button>
      </div>

      {viewMode === 'todos' && (
        <div className="px-3 py-2 rounded-[9px] text-[12px] mb-3" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}>
          Vista de solo lectura · Las proteínas iguales se suman, las diferentes se muestran por separado.
        </div>
      )}

      {/* ── DESKTOP TABLE (md+) ── */}
      <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 120, padding: '8px 10px', textAlign: 'left', color: C.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', position: 'sticky', left: 0, background: C.bg, zIndex: 2, borderBottom: `1px solid ${C.border}` }} />
              {DAYS.map(day => {
                const isToday = day === today && isCurrentWeek;
                const dp  = dayProtein(day);
                const pct = planDailyProtein > 0 ? Math.min((dp / planDailyProtein) * 100, 100) : 0;
                return (
                  <th key={day} style={{ padding: '6px 6px 8px', textAlign: 'center', minWidth: 148, background: isToday ? C.accentGlow : C.bg, borderBottom: `2px solid ${isToday ? C.accent : C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isToday ? C.accent : C.text }}>{DAY_FULL[day]}</div>
                    {dp > 0 && <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{dp}g prot.</div>}
                    {dp > 0 && (
                      <div style={{ height: 3, background: C.surface3, borderRadius: 99, margin: '4px 8px 0', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? C.accent : C.yellow, borderRadius: 99, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_SLOTS.map((slot, si) => {
              const slotPlan = (plan.slots?.[slot] ?? {}) as Partial<SlotData>;
              const accent   = SLOT_ACCENT[slot];
              return (
                <tr key={slot}>
                  <td style={{ padding: '5px 10px 5px 8px', verticalAlign: 'middle', position: 'sticky', left: 0, background: C.bg, zIndex: 1, borderRight: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{SLOT_ICONS[slot]}</span>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, lineHeight: 1.2 }}>{SLOT_LABELS[slot]}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                          {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g</span>}
                          {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}porc</span>}
                          {(slotPlan.fruit   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#fb923c', fontFamily: "'DM Mono', monospace" }}>{slotPlan.fruit}tz</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {DAYS.map(day => {
                    const isToday = day === today && isCurrentWeek;

                    if (viewMode === 'todos') {
                      return (
                        <TodosCell
                          key={day} day={day} slot={slot} allEntries={entries}
                          persons={persons} slotPlan={slotPlan} accent={accent} isToday={isToday}
                          carbFoodsMap={carbFoodsMap}
                        />
                      );
                    }

                    const entry   = getEntry(day, slot);
                    const protein = entry?.protein ?? null;
                    const rawG    = protein ? rawWeight(entry!.cookedGrams ?? 0, protein.lossPercent) : 0;
                    const hasCarbs = (entry?.carbs?.length ?? 0) > 0;

                    return (
                      <td
                        key={day}
                        style={{
                          padding:    '4px',
                          verticalAlign: 'top',
                          borderTop:  `1px solid ${C.border}`,
                          background: isToday ? C.accentGlow : si % 2 === 0 ? 'transparent' : C.surface3 + '20',
                        }}
                      >
                        <div style={{ marginBottom: 3, padding: '4px 6px', borderRadius: '6px 6px 0 0', background: C.surface3 + '80', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g P</span>}
                          {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}porc C</span>}
                          {(slotPlan.fruit   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#fb923c', fontFamily: "'DM Mono', monospace" }}>{slotPlan.fruit}tz🍊</span>}
                          {slotPlan.notes && (
                            <span style={{ fontSize: 9, color: C.dim, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {slotPlan.notes}
                            </span>
                          )}
                        </div>
                        {protein ? (
                          <div
                            onClick={() => setPicker({ day, slot })}
                            style={{ borderLeft: `3px solid ${accent}`, borderRadius: '0 7px 7px 0', padding: '6px 7px', cursor: 'pointer', background: C.surface2, border: `1px solid ${accent}30`, borderLeftWidth: 3 }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{protein.name}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                              <span style={{ color: C.accent }}>{entry!.cookedGrams}g 🍳</span>
                              <span style={{ color: C.yellow }}>{rawG}g crudo</span>
                            </div>
                            {(slotPlan.protein ?? 0) > 0 && (
                              <div style={{ marginTop: 4, height: 3, background: C.surface3, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(((entry!.cookedGrams ?? 0) / (slotPlan.protein ?? 1)) * 100, 100)}%`, background: (entry!.cookedGrams ?? 0) >= (slotPlan.protein ?? 0) ? C.accent : C.yellow, borderRadius: 99 }} />
                              </div>
                            )}
                            {entry && <PlannerCarbChips entry={entry} carbFoods={carbFoods} />}
                          </div>
                        ) : hasCarbs ? (
                          <div
                            onClick={() => setPicker({ day, slot })}
                            style={{ borderLeft: '3px solid #60a5fa', borderRadius: '0 7px 7px 0', padding: '6px 7px', cursor: 'pointer', background: '#60a5fa08', border: '1px solid #60a5fa25', borderLeftWidth: 3 }}
                          >
                            {entry && <PlannerCarbChips entry={entry} carbFoods={carbFoods} />}
                          </div>
                        ) : (
                          <button
                            onClick={() => setPicker({ day, slot })}
                            style={{ width: '100%', minHeight: 40, border: `1px dashed ${C.border}`, borderRadius: '0 7px 7px 0', background: 'none', color: C.dim, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          >
                            + proteína / carbo
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE DAY VIEW (< md) ── */}
      <div className="md:hidden flex flex-col gap-3 flex-1 overflow-y-auto -mx-4 px-4">
        {/* Day selector tabs */}
        <div className="flex gap-1 p-1 rounded-xl sticky top-0 z-10" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
          {DAYS.map(day => {
            const isActive = activeDay === day;
            const isToday  = day === today && isCurrentWeek;
            const dp = dayProtein(day);
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg text-center transition-all duration-150 min-h-[44px] cursor-pointer"
                style={{ border: 'none', background: isActive ? C.accent : 'transparent', color: isActive ? '#000' : (isToday ? C.accent : C.muted) }}
              >
                <span className="text-[11px] font-semibold leading-none">{DAY_LABELS[day]}</span>
                {dp > 0 && (
                  <span className="text-[9px] mt-0.5 leading-none" style={{ opacity: isActive ? 0.7 : 1 }}>
                    {dp}g
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active day card */}
        <MobileDayCard
          day={activeDay}
          entries={activeDayEntries}
          plan={plan}
          persons={persons}
          viewMode={viewMode}
          isToday={activeDay === today && isCurrentWeek}
          planDailyProtein={planDailyProtein}
          onCellPress={(d, s) => viewMode === 'person' && setPicker({ day: d, slot: s })}
          carbFoodsMap={carbFoodsMap}
        />
      </div>

      {/* Entry picker modal */}
      {picker && viewMode === 'person' && (
        <EntryPicker
          slot={picker.slot}
          day={picker.day}
          current={getEntry(picker.day, picker.slot)}
          planSlot={(plan.slots?.[picker.slot] as Partial<SlotData> | undefined) ?? {}}
          carbFoods={carbFoods}
          onSelect={handleAssign}
          onClear={handleClear}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
