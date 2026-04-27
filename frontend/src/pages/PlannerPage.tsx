import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import {
  MEAL_SLOTS, SLOT_LABELS, SLOT_ICONS, SLOT_ACCENT,
  DAYS, DAY_FULL, DAY_LABELS, getWeekStart, formatWeekLabel, rawWeight, todayKey,
} from '../constants';
import type { Protein, MealPlan, PlannerEntry, MealSlot, WeekDay, SlotData } from '../types';
import type { PageProps } from '../App';

/* ─────────────────────────── ProteinPicker modal ─────────────────────────── */

function ProteinPicker({
  slot, day, current, planTarget, onSelect, onClear, onClose,
}: {
  slot: MealSlot; day: WeekDay; current: PlannerEntry | undefined;
  planTarget: number;
  onSelect: (proteinId: string, cookedGrams: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [selected, setSelected] = useState<string | null>(current?.proteinId ?? null);
  const [cookedG,  setCookedG]  = useState(current?.cookedGrams ?? planTarget ?? 0);

  useEffect(() => { api.getProteins().then(setProteins).catch(() => {}); }, []);

  const selProtein = proteins.find(p => p.id === selected);
  const rawNeeded  = selProtein ? rawWeight(cookedG, selProtein.lossPercent) : cookedG;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[440px] max-h-[85dvh] flex flex-col rounded-t-2xl md:rounded-2xl"
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
            <span className="font-semibold" style={{ color: C.accent }}>{planTarget}g proteína cocida</span>
          </div>
        </div>

        {/* Protein list */}
        <div className="overflow-y-auto flex-1 px-6 py-2 flex flex-col gap-1.5">
          {proteins.length === 0 && (
            <div className="text-center py-4 text-[13px]" style={{ color: C.muted }}>
              Sin proteínas registradas.
            </div>
          )}
          {proteins.map(p => {
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); if (!cookedG) setCookedG(planTarget || 0); }}
                className="px-3.5 py-2.5 rounded-[10px] text-left cursor-pointer transition-all duration-150 min-h-[52px]"
                style={{
                  border:     `1px solid ${isSel ? C.accent : C.border}`,
                  background: isSel ? C.accentGlow : C.surface2,
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-[13px] font-semibold" style={{ color: isSel ? C.accent : C.text }}>
                    {p.name}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}
                  >
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
            className="mx-6 my-3 rounded-[10px] p-3.5 shrink-0"
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
              <span
                className="font-bold"
                style={{ color: C.yellow, fontFamily: "'DM Mono', monospace" }}
              >
                {rawNeeded}g
              </span>
            </div>
            {planTarget > 0 && (
              <div
                className="mt-1.5 h-1 rounded-full overflow-hidden"
                style={{ background: C.surface3 }}
              >
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

        {/* Action buttons */}
        <div className="flex gap-2 px-6 pb-6 shrink-0">
          {current?.proteinId && (
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
            onClick={() => selected && onSelect(selected, cookedG)}
            disabled={!selected}
            className="py-2.5 rounded-[9px] text-[13px] font-bold cursor-pointer min-h-[44px]"
            style={{
              flex:       2,
              border:     'none',
              background: selected ? C.accent : '#333',
              color:      selected ? '#000' : C.dim,
            }}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── TodosCell (desktop table) ───────────────────── */

function TodosCell({
  day, slot, allEntries, persons, slotPlan, accent, isToday,
}: {
  day: WeekDay; slot: MealSlot; allEntries: PlannerEntry[];
  persons: { id: string; name: string }[]; slotPlan: Partial<SlotData>; accent: string; isToday: boolean;
}) {
  const cellEntries = allEntries.filter(e => e.day === day && e.slot === slot && e.proteinId);
  type Group = { protein: Protein; totalCooked: number; persons: { personId: string; cookedGrams: number }[] };
  const grouped: Record<string, Group> = {};
  cellEntries.forEach(e => {
    const prot = e.protein;
    if (!prot) return;
    if (!grouped[e.proteinId!]) grouped[e.proteinId!] = { protein: prot, totalCooked: 0, persons: [] };
    grouped[e.proteinId!].totalCooked += e.cookedGrams ?? 0;
    grouped[e.proteinId!].persons.push({ personId: e.personId, cookedGrams: e.cookedGrams ?? 0 });
  });
  const groups = Object.values(grouped);

  return (
    <td
      style={{
        padding:    '4px',
        verticalAlign: 'top',
        borderTop:  `1px solid ${C.border}`,
        background: isToday ? C.accentGlow : 'transparent',
      }}
    >
      <div
        style={{
          marginBottom: 3, padding: '4px 6px', borderRadius: '6px 6px 0 0',
          background: C.surface3 + '80', display: 'flex', gap: 5, flexWrap: 'wrap',
        }}
      >
        {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g P</span>}
        {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}g C</span>}
        {(slotPlan.fruit   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#fb923c', fontFamily: "'DM Mono', monospace" }}>{slotPlan.fruit}tz🍊</span>}
      </div>
      {groups.length === 0 ? (
        <div
          style={{
            minHeight: 36, border: `1px dashed ${C.border}`,
            borderRadius: '0 7px 7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: C.dim }}>—</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map(({ protein, totalCooked, persons: pList }) => {
            const rawG = rawWeight(totalCooked, protein.lossPercent);
            return (
              <div
                key={protein.id}
                style={{
                  borderLeft: `3px solid ${accent}`, borderRadius: '0 7px 7px 0',
                  padding: '5px 7px', background: C.surface2,
                  border: `1px solid ${accent}30`, borderLeftWidth: 3,
                }}
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
                      <span
                        key={pl.personId}
                        style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 99,
                          background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18',
                          color:      pl.personId === 'ruben' ? '#60a5fa'   : '#a78bfa',
                        }}
                      >
                        {pName} {pl.cookedGrams}g
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </td>
  );
}

/* ───────────────────────── Mobile day card ───────────────────────── */

function MobileDayCard({
  day, entries, plan, persons, viewMode, isToday, planDailyProtein,
  onCellPress,
}: {
  day: WeekDay;
  entries: PlannerEntry[];
  plan: MealPlan;
  persons: { id: string; name: string }[];
  viewMode: 'person' | 'todos';
  isToday: boolean;
  planDailyProtein: number;
  onCellPress: (day: WeekDay, slot: MealSlot) => void;
}) {
  const dayProtein = entries
    .filter(e => e.day === day && e.proteinId)
    .reduce((s, e) => s + (e.cookedGrams ?? 0), 0);
  const pct = planDailyProtein > 0 ? Math.min((dayProtein / planDailyProtein) * 100, 100) : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isToday ? C.accentGlow : C.surface2,
        border:     `1px solid ${isToday ? C.accent : C.border}`,
      }}
    >
      {/* Day header */}
      <div
        className="px-4 py-2.5 flex justify-between items-center"
        style={{ borderBottom: `1px solid ${isToday ? C.accent + '44' : C.border}` }}
      >
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
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: pct >= 100 ? C.accent : C.yellow }}
            />
          </div>
        </div>
      )}

      {/* Slot rows */}
      <div className="p-3 flex flex-col gap-2">
        {MEAL_SLOTS.map(slot => {
          const accent = SLOT_ACCENT[slot];
          const slotPlan = (plan.slots?.[slot] ?? {}) as Partial<SlotData>;

          if (viewMode === 'todos') {
            // Todos view — read-only aggregated
            const cellEntries = entries.filter(e => e.day === day && e.slot === slot && e.proteinId);
            type Group = { protein: Protein; totalCooked: number; pList: { personId: string; cookedGrams: number }[] };
            const grouped: Record<string, Group> = {};
            cellEntries.forEach(e => {
              const prot = e.protein;
              if (!prot) return;
              if (!grouped[e.proteinId!]) grouped[e.proteinId!] = { protein: prot, totalCooked: 0, pList: [] };
              grouped[e.proteinId!].totalCooked += e.cookedGrams ?? 0;
              grouped[e.proteinId!].pList.push({ personId: e.personId, cookedGrams: e.cookedGrams ?? 0 });
            });
            const groups = Object.values(grouped);

            return (
              <div
                key={slot}
                className="rounded-lg overflow-hidden"
                style={{ background: C.surface3 + '60' }}
              >
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <span className="text-[12px]">{SLOT_ICONS[slot]}</span>
                  <span className="text-[11px] font-medium" style={{ color: C.muted }}>{SLOT_LABELS[slot]}</span>
                  {(slotPlan.protein ?? 0) > 0 && (
                    <span
                      className="ml-auto text-[9px]"
                      style={{ color: '#22c97a', fontFamily: "'DM Mono', monospace" }}
                    >
                      {slotPlan.protein}g P
                    </span>
                  )}
                </div>
                <div className="px-2.5 py-1.5">
                  {groups.length === 0 ? (
                    <span className="text-[11px]" style={{ color: C.dim }}>—</span>
                  ) : (
                    groups.map(({ protein, totalCooked, pList }) => {
                      const rawG = rawWeight(totalCooked, protein.lossPercent);
                      return (
                        <div key={protein.id} className="mb-1 last:mb-0">
                          <div className="text-[12px] font-semibold" style={{ color: C.text }}>{protein.name}</div>
                          <div
                            className="text-[10px] mt-0.5"
                            style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}
                          >
                            {totalCooked}g 🍳 · {rawG}g crudo
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {pList.map(pl => {
                              const pName = persons.find(p => p.id === pl.personId)?.name ?? pl.personId;
                              return (
                                <span
                                  key={pl.personId}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: pl.personId === 'ruben' ? '#60a5fa18' : '#a78bfa18',
                                    color:      pl.personId === 'ruben' ? '#60a5fa'   : '#a78bfa',
                                  }}
                                >
                                  {pName} {pl.cookedGrams}g
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          }

          // Person view — editable
          const entry   = entries.find(e => e.day === day && e.slot === slot);
          const protein = entry?.protein ?? null;
          const rawG    = protein ? rawWeight(entry!.cookedGrams ?? 0, protein.lossPercent) : 0;

          return (
            <button
              key={slot}
              onClick={() => onCellPress(day, slot)}
              className="w-full text-left rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
              style={{ border: `1px solid ${protein ? accent + '44' : C.border}`, background: 'transparent' }}
            >
              {/* Slot header */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5"
                style={{ background: C.surface3 + '60', borderBottom: `1px solid ${C.border}` }}
              >
                <span className="text-[12px]">{SLOT_ICONS[slot]}</span>
                <span className="text-[11px] font-medium" style={{ color: C.muted }}>{SLOT_LABELS[slot]}</span>
                <div className="ml-auto flex gap-1.5">
                  {(slotPlan.protein ?? 0) > 0 && (
                    <span
                      className="text-[9px]"
                      style={{ color: '#22c97a', fontFamily: "'DM Mono', monospace" }}
                    >
                      {slotPlan.protein}g P
                    </span>
                  )}
                  {(slotPlan.carbs ?? 0) > 0 && (
                    <span
                      className="text-[9px]"
                      style={{ color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}
                    >
                      {slotPlan.carbs}g C
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-2.5 py-2">
                {protein ? (
                  <div>
                    <div
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: C.text, borderLeft: `3px solid ${accent}`, paddingLeft: 6 }}
                    >
                      {protein.name}
                    </div>
                    <div
                      className="flex gap-2 mt-1 text-[10px]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      <span style={{ color: C.accent }}>{entry!.cookedGrams}g 🍳</span>
                      <span style={{ color: C.yellow }}>{rawG}g crudo</span>
                    </div>
                    {(slotPlan.protein ?? 0) > 0 && (
                      <div
                        className="mt-1.5 h-1 rounded-full overflow-hidden"
                        style={{ background: C.surface3 }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(((entry!.cookedGrams ?? 0) / (slotPlan.protein ?? 1)) * 100, 100)}%`,
                            background: (entry!.cookedGrams ?? 0) >= (slotPlan.protein ?? 0) ? C.accent : C.yellow,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[12px] text-center py-1.5" style={{ color: C.dim }}>
                    + proteína
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
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem('tiki_week') || getWeekStart());
  const [entries,   setEntries]   = useState<PlannerEntry[]>([]);
  const [plans,     setPlans]     = useState<Record<string, MealPlan>>({});
  const [persons,   setPersons]   = useState([{ id: 'ruben', name: 'Ruben' }, { id: 'sarahi', name: 'Sarahi' }]);
  const [viewMode,  setViewMode]  = useState<'person' | 'todos'>('person');
  const [picker,    setPicker]    = useState<{ day: WeekDay; slot: MealSlot } | null>(null);
  // Mobile: which day is selected (default to today or Monday)
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
    });
  }, [persons]);

  const plan = plans[person] ?? { personId: person, slots: {} };

  const getEntry = (day: WeekDay, slot: MealSlot) =>
    entries.find(e => e.personId === person && e.day === day && e.slot === slot);

  const handleAssign = async (proteinId: string, cookedGrams: number) => {
    if (!picker) return;
    await api.setSlot({ weekStart, personId: person, day: picker.day, slot: picker.slot, proteinId, cookedGrams });
    reload(); setPicker(null);
  };
  const handleClear = async () => {
    if (!picker) return;
    await api.clearSlot(weekStart, person, picker.day, picker.slot);
    reload(); setPicker(null);
  };

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const isCurrentWeek = weekStart === getWeekStart();
  const today = todayKey();

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

  // Entries for the active mobile day (person-filtered)
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
        {/* Week nav — always visible */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => shiftWeek(-1)}
            className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            ← Ant.
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart())}
            className="px-3 py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer min-h-[40px]"
            style={{
              border:     `1px solid ${isCurrentWeek ? C.accent : C.border2}`,
              background: isCurrentWeek ? C.accentGlow : 'none',
              color:      isCurrentWeek ? C.accent : C.muted,
            }}
          >
            Hoy
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Sig. →
          </button>
        </div>
      </div>

      {/* ── Person / view toggle ── */}
      <div
        className="flex gap-1.5 mb-3.5 p-1 rounded-[10px] w-fit"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}
      >
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
          style={{
            border:     'none',
            background: viewMode === 'todos' ? C.accent : 'transparent',
            color:      viewMode === 'todos' ? '#000' : C.muted,
            fontWeight: viewMode === 'todos' ? 600 : 400,
          }}
        >
          👨‍👩‍👧 Todos
        </button>
      </div>

      {viewMode === 'todos' && (
        <div
          className="px-3 py-2 rounded-[9px] text-[12px] mb-3"
          style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
        >
          Vista de solo lectura · Las proteínas iguales se suman, las diferentes se muestran por separado.
        </div>
      )}

      {/* ── DESKTOP TABLE (md+) ── */}
      <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 700 }}>
          <thead>
            <tr>
              <th
                style={{
                  width: 120, padding: '8px 10px', textAlign: 'left',
                  color: C.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                  position: 'sticky', left: 0, background: C.bg, zIndex: 2,
                  borderBottom: `1px solid ${C.border}`,
                }}
              />
              {DAYS.map(day => {
                const isToday = day === today && isCurrentWeek;
                const dp  = dayProtein(day);
                const pct = planDailyProtein > 0 ? Math.min((dp / planDailyProtein) * 100, 100) : 0;
                return (
                  <th
                    key={day}
                    style={{
                      padding: '6px 6px 8px', textAlign: 'center', minWidth: 148,
                      background: isToday ? C.accentGlow : C.bg,
                      borderBottom: `2px solid ${isToday ? C.accent : C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: isToday ? C.accent : C.text }}>
                      {DAY_FULL[day]}
                    </div>
                    {dp > 0 && (
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
                        {dp}g prot.
                      </div>
                    )}
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
                  <td
                    style={{
                      padding: '5px 10px 5px 8px', verticalAlign: 'middle',
                      position: 'sticky', left: 0, background: C.bg, zIndex: 1,
                      borderRight: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{SLOT_ICONS[slot]}</span>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, lineHeight: 1.2 }}>{SLOT_LABELS[slot]}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                          {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g</span>}
                          {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}g</span>}
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
                        />
                      );
                    }

                    const entry   = getEntry(day, slot);
                    const protein = entry?.protein ?? null;
                    const rawG    = protein ? rawWeight(entry!.cookedGrams ?? 0, protein.lossPercent) : 0;

                    return (
                      <td
                        key={day}
                        style={{
                          padding: '4px', verticalAlign: 'top',
                          borderTop: `1px solid ${C.border}`,
                          background: isToday ? C.accentGlow : si % 2 === 0 ? 'transparent' : C.surface3 + '20',
                        }}
                      >
                        <div style={{ marginBottom: 3, padding: '4px 6px', borderRadius: '6px 6px 0 0', background: C.surface3 + '80', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {(slotPlan.protein ?? 0) > 0 && <span style={{ fontSize: 9, color: '#22c97a', fontFamily: "'DM Mono', monospace" }}>{slotPlan.protein}g P</span>}
                          {(slotPlan.carbs   ?? 0) > 0 && <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>{slotPlan.carbs}g C</span>}
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
                            style={{
                              borderLeft: `3px solid ${accent}`, borderRadius: '0 7px 7px 0',
                              padding: '6px 7px', cursor: 'pointer', background: C.surface2,
                              border: `1px solid ${accent}30`, borderLeftWidth: 3,
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{protein.name}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                              <span style={{ color: C.accent }}>{entry!.cookedGrams}g 🍳</span>
                              <span style={{ color: C.yellow }}>{rawG}g crudo</span>
                            </div>
                            {(slotPlan.protein ?? 0) > 0 && (
                              <div style={{ marginTop: 4, height: 3, background: C.surface3, borderRadius: 99, overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(((entry!.cookedGrams ?? 0) / (slotPlan.protein ?? 1)) * 100, 100)}%`,
                                    background: (entry!.cookedGrams ?? 0) >= (slotPlan.protein ?? 0) ? C.accent : C.yellow,
                                    borderRadius: 99,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setPicker({ day, slot })}
                            style={{
                              width: '100%', minHeight: 40, border: `1px dashed ${C.border}`,
                              borderRadius: '0 7px 7px 0', background: 'none', color: C.dim,
                              cursor: 'pointer', fontSize: 12, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                            }}
                          >
                            + proteína
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
        <div
          className="flex gap-1 p-1 rounded-xl sticky top-0 z-10"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          {DAYS.map(day => {
            const isActive = activeDay === day;
            const isToday  = day === today && isCurrentWeek;
            const dp = dayProtein(day);
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg text-center transition-all duration-150 min-h-[44px] cursor-pointer"
                style={{
                  border:     'none',
                  background: isActive ? C.accent : 'transparent',
                  color:      isActive ? '#000' : (isToday ? C.accent : C.muted),
                }}
              >
                <span className="text-[11px] font-semibold leading-none">{DAY_LABELS[day]}</span>
                {dp > 0 && (
                  <span
                    className="text-[9px] mt-0.5 leading-none"
                    style={{ opacity: isActive ? 0.7 : 1 }}
                  >
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
          entries={viewMode === 'todos' ? entries : entries.filter(e => e.personId === person)}
          plan={plan}
          persons={persons}
          viewMode={viewMode}
          isToday={activeDay === today && isCurrentWeek}
          planDailyProtein={planDailyProtein}
          onCellPress={(d, s) => viewMode === 'person' && setPicker({ day: d, slot: s })}
        />
      </div>

      {/* Protein picker modal */}
      {picker && viewMode === 'person' && (
        <ProteinPicker
          slot={picker.slot}
          day={picker.day}
          current={getEntry(picker.day, picker.slot)}
          planTarget={(plan.slots?.[picker.slot] as Partial<SlotData> | undefined)?.protein ?? 0}
          onSelect={handleAssign}
          onClear={handleClear}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
