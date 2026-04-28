import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { MEAL_SLOTS, SLOT_LABELS, SLOT_ICONS, formatPortionUnits } from '../constants';
import type { MealPlan, SlotData, MealSlot, CarbFood, CarbSelection } from '../types';
import type { PageProps } from '../App';

const MACRO_COLS = [
  { key: 'protein' as const, label: 'Proteína', unit: 'g',    color: '#22c97a' },
  { key: 'carbs'   as const, label: 'Carbos',   unit: 'porc', color: '#60a5fa' },
  { key: 'fruit'   as const, label: 'Fruta',    unit: 'taz',  color: '#fb923c' },
];

/* ─── Carb selection editor (shared between desktop + mobile) ─── */
function CarbSelectionsEditor({
  selections, carbFoods, totalPortions, onChange,
}: {
  selections: CarbSelection[];
  carbFoods:  CarbFood[];
  totalPortions: number;
  onChange: (next: CarbSelection[]) => void;
}) {
  const sumPortions = selections.reduce((s, r) => s + r.portions, 0);
  const mismatch   = totalPortions > 0 && Math.abs(sumPortions - totalPortions) > 0.01;

  const updateRow = (idx: number, patch: Partial<CarbSelection>) => {
    const next = selections.map((r, i) => i === idx ? { ...r, ...patch } : r);
    onChange(next);
  };

  const removeRow = (idx: number) => {
    onChange(selections.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    const firstFood = carbFoods[0];
    if (!firstFood) return;
    onChange([...selections, { carbFoodId: firstFood.id, portions: 0.5 }]);
  };

  // Live equivalency text
  const equivParts = selections
    .map(sel => {
      const food = carbFoods.find(f => f.id === sel.carbFoodId);
      if (!food || !sel.portions) return null;
      return `${formatPortionUnits(sel.portions, food)} ${food.name}`;
    })
    .filter((x): x is string => x !== null);

  return (
    <div className="flex flex-col gap-2">
      {selections.length === 0 ? (
        <div className="text-[12px]" style={{ color: C.dim }}>Sin selección de carbohidratos.</div>
      ) : (
        selections.map((sel, idx) => {
          const food = carbFoods.find(f => f.id === sel.carbFoodId);
          return (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={sel.carbFoodId}
                onChange={e => updateRow(idx, { carbFoodId: e.target.value })}
                className="flex-1 rounded-[7px] px-2 py-2 text-[12px] min-h-[36px]"
                style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.text }}
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
                onChange={e => updateRow(idx, { portions: parseFloat(e.target.value) || 0.5 })}
                className="rounded-[7px] px-2 py-2 text-[12px] text-center min-h-[36px]"
                style={{ width: 64, background: C.surface, border: `1px solid ${C.border2}`, color: C.text, fontFamily: "'DM Mono', monospace" }}
              />
              <span className="text-[11px]" style={{ color: C.dim }}>porc.</span>
              {food && sel.portions > 0 && (
                <span className="text-[11px]" style={{ color: '#60a5fa', minWidth: 52 }}>
                  {formatPortionUnits(sel.portions, food)}
                </span>
              )}
              <button
                onClick={() => removeRow(idx)}
                className="px-2 py-1 rounded-[6px] text-[12px] cursor-pointer min-h-[36px]"
                style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
              >
                ✕
              </button>
            </div>
          );
        })
      )}

      <button
        onClick={addRow}
        disabled={carbFoods.length === 0}
        className="text-[12px] px-3 py-1.5 rounded-[7px] cursor-pointer self-start min-h-[36px]"
        style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
      >
        + Agregar carbo
      </button>

      {equivParts.length > 0 && (
        <div className="text-[12px] rounded-[7px] p-2" style={{ background: C.surface2, color: C.muted }}>
          Equivale a: <span style={{ color: '#60a5fa' }}>{equivParts.join(' + ')}</span>
        </div>
      )}

      {mismatch && (
        <div className="text-[11px] px-2 py-1.5 rounded-[7px]" style={{ background: '#60a5fa12', color: '#60a5fa', border: '1px solid #60a5fa30' }}>
          Las porciones seleccionadas ({sumPortions.toFixed(1)}) no coinciden con la meta ({totalPortions})
        </div>
      )}
    </div>
  );
}

/* ─── Carb chips (read-only display) ─── */
function CarbChips({ selections, carbFoods }: { selections: CarbSelection[]; carbFoods: CarbFood[] }) {
  const items = selections
    .map(sel => {
      const food = carbFoods.find(f => f.id === sel.carbFoodId);
      if (!food) return null;
      return { sel, food };
    })
    .filter((x): x is { sel: CarbSelection; food: CarbFood } => x !== null);

  if (items.length === 0) return <span style={{ color: C.dim, fontSize: 11 }}>Sin selección</span>;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map(({ sel, food }, i) => (
        <span
          key={i}
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: '#60a5fa14', color: '#60a5fa', border: '1px solid #60a5fa28' }}
        >
          {formatPortionUnits(sel.portions, food)} {food.name}
        </span>
      ))}
    </div>
  );
}

export default function MealPlanPage({ person }: PageProps) {
  const [plan,       setPlan]       = useState<MealPlan>({ personId: person, slots: {} });
  const [editing,    setEditing]    = useState<MealSlot | null>(null);
  const [draft,      setDraft]      = useState<Partial<SlotData>>({});
  const [carbFoods,  setCarbFoods]  = useState<CarbFood[]>([]);
  const [saved,      setSaved]      = useState(false);
  const [personName, setPersonName] = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    api.getMealPlan(person).then(setPlan).catch(() => {});
    api.getCarbFoods(person).then(setCarbFoods).catch(() => {});
  }, [person]);

  const totals = MEAL_SLOTS.reduce(
    (acc, slot) => {
      const s = plan.slots?.[slot] ?? {} as Partial<SlotData>;
      acc.protein += s.protein ?? 0;
      acc.carbs   += s.carbs   ?? 0;
      acc.fruit   += s.fruit   ?? 0;
      return acc;
    },
    { protein: 0, carbs: 0, fruit: 0 },
  );

  const startEdit = (slot: MealSlot) => {
    setDraft({ protein: 0, carbs: 0, fruit: 0, notes: '', carbSelections: [], ...(plan.slots?.[slot] ?? {}) });
    setEditing(slot);
  };

  const saveSlot = async () => {
    if (!editing) return;
    const updated: MealPlan = {
      ...plan,
      personId: person,
      slots: {
        ...(plan.slots ?? {}),
        [editing]: {
          protein:        parseFloat(String(draft.protein)) || 0,
          carbs:          parseFloat(String(draft.carbs))   || 0,
          fruit:          parseFloat(String(draft.fruit))   || 0,
          notes:          draft.notes ?? '',
          carbSelections: draft.carbSelections ?? [],
        },
      },
    };
    await api.saveMealPlan(person, updated.slots);
    setPlan(updated);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[920px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Plan Nutricional
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {personName} · Metas por comida del nutriólogo
          </div>
        </div>
        {saved && (
          <div
            className="px-4 py-2 rounded-[10px] text-[13px] font-semibold shrink-0"
            style={{ background: C.accentGlow, border: `1px solid ${C.accent}`, color: C.accent }}
          >
            ✓ Guardado
          </div>
        )}
      </div>

      {/* Daily totals */}
      <div
        className="rounded-[14px] p-4 md:p-[22px] mb-5"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}
      >
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: C.muted }}>
          Totales Diarios
        </div>
        <div className="grid grid-cols-3 gap-4">
          {MACRO_COLS.map(m => (
            <div key={m.key} className="text-center">
              <div className="text-[24px] font-bold" style={{ color: m.color, fontFamily: "'DM Mono', monospace" }}>
                {totals[m.key]}
                <span className="text-[12px] font-normal ml-0.5" style={{ color: C.muted }}>{m.unit}</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{m.label} / día</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DESKTOP TABLE (md+) ── */}
      <div
        className="hidden md:block rounded-[14px] overflow-hidden mb-3.5"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}
      >
        {/* Header row */}
        <div
          className="px-[18px] py-2.5 grid items-center"
          style={{
            borderBottom: `1px solid ${C.border}`,
            gridTemplateColumns: '170px repeat(3, 90px) 1fr 70px',
            gap: 10,
          }}
        >
          {['Comida', 'Proteína', 'Carbos', 'Fruta', 'Notas / Carbohidratos', ''].map((h, i) => (
            <div
              key={i}
              className="text-[10px] uppercase tracking-[0.07em] font-semibold"
              style={{ color: C.dim, textAlign: i > 0 && i < 4 ? 'center' : 'left' }}
            >
              {h}
            </div>
          ))}
        </div>

        {MEAL_SLOTS.map((slot, idx) => {
          const s      = plan.slots?.[slot] ?? {} as Partial<SlotData>;
          const isEdit = editing === slot;
          const rowBg  = idx % 2 === 0 ? 'transparent' : C.surface3 + '30';

          return (
            <div
              key={slot}
              style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : 'none', background: rowBg }}
            >
              {isEdit ? (
                /* ── Edit row ── */
                <div className="px-[18px] py-3 flex flex-col gap-3">
                  {/* Top: slot label + numeric inputs */}
                  <div
                    className="grid items-center"
                    style={{ gridTemplateColumns: '170px repeat(3, 90px) 1fr 70px', gap: 10 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                      <span className="text-[13px] font-semibold" style={{ color: C.accent }}>{SLOT_LABELS[slot]}</span>
                    </div>
                    {/* Protein input */}
                    <input
                      type="number" min={0} step={1}
                      value={draft.protein ?? ''}
                      onChange={e => setDraft(d => ({ ...d, protein: e.target.value as unknown as number }))}
                      className="w-full rounded-[7px] px-2 py-[7px] text-[13px] text-center"
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }}
                    />
                    {/* Carbs portions input */}
                    <input
                      type="number" min={0} step={0.5}
                      value={draft.carbs ?? ''}
                      onChange={e => setDraft(d => ({ ...d, carbs: e.target.value as unknown as number }))}
                      className="w-full rounded-[7px] px-2 py-[7px] text-[13px] text-center"
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }}
                    />
                    {/* Fruit input */}
                    <input
                      type="number" min={0} step={0.25}
                      value={draft.fruit ?? ''}
                      onChange={e => setDraft(d => ({ ...d, fruit: e.target.value as unknown as number }))}
                      className="w-full rounded-[7px] px-2 py-[7px] text-[13px] text-center"
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }}
                    />
                    {/* Notes */}
                    <input
                      value={draft.notes ?? ''}
                      onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Notas…"
                      className="w-full rounded-[7px] px-2 py-[7px] text-[12px]"
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, boxSizing: 'border-box' }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={saveSlot}
                        className="flex-1 py-[7px] rounded-[7px] text-[13px] font-bold cursor-pointer min-h-[36px]"
                        style={{ border: 'none', background: C.accent, color: '#000' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="flex-1 py-[7px] rounded-[7px] text-[13px] cursor-pointer min-h-[36px]"
                        style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Carb selections sub-editor */}
                  {carbFoods.length > 0 && (
                    <div
                      className="ml-[180px] rounded-[10px] p-3"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    >
                      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#60a5fa' }}>
                        Selección de carbohidratos
                      </div>
                      <CarbSelectionsEditor
                        selections={draft.carbSelections ?? []}
                        carbFoods={carbFoods}
                        totalPortions={parseFloat(String(draft.carbs)) || 0}
                        onChange={next => setDraft(d => ({ ...d, carbSelections: next }))}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* ── Read row ── */
                <div
                  className="px-[18px] py-3 grid items-start"
                  style={{ gridTemplateColumns: '170px repeat(3, 90px) 1fr 70px', gap: 10 }}
                >
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                    <span className="text-[13px] font-medium" style={{ color: C.text }}>{SLOT_LABELS[slot]}</span>
                  </div>
                  {MACRO_COLS.map(m => (
                    <div key={m.key} className="text-center pt-0.5">
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: (s[m.key] ?? 0) > 0 ? m.color : C.dim, fontFamily: "'DM Mono', monospace" }}
                      >
                        {s[m.key] ?? 0}
                      </span>
                      <span className="text-[10px]" style={{ color: C.dim }}>{m.unit}</span>
                    </div>
                  ))}
                  <div className="min-w-0">
                    {s.notes && (
                      <div className="text-[11px] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: C.muted }}>
                        {s.notes}
                      </div>
                    )}
                    <CarbChips
                      selections={s.carbSelections ?? []}
                      carbFoods={carbFoods}
                    />
                  </div>
                  <button
                    onClick={() => startEdit(slot)}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                    style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MOBILE CARDS (< md) ── */}
      <div className="md:hidden flex flex-col gap-2 mb-3.5">
        {MEAL_SLOTS.map(slot => {
          const s      = plan.slots?.[slot] ?? {} as Partial<SlotData>;
          const isEdit = editing === slot;

          return (
            <div
              key={slot}
              className="rounded-xl overflow-hidden"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            >
              {isEdit ? (
                /* Edit mode card */
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                    <span className="text-[14px] font-semibold" style={{ color: C.accent }}>{SLOT_LABELS[slot]}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['protein', 'carbs', 'fruit'] as const).map((k, ki) => (
                      <div key={k}>
                        <label
                          className="text-[10px] uppercase tracking-wider block mb-1"
                          style={{ color: MACRO_COLS[ki].color }}
                        >
                          {MACRO_COLS[ki].label}
                          <span className="ml-1 font-normal" style={{ color: C.dim }}>({MACRO_COLS[ki].unit})</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={k === 'fruit' ? 0.25 : k === 'carbs' ? 0.5 : 1}
                          value={draft[k] ?? ''}
                          onChange={e => setDraft(d => ({ ...d, [k]: e.target.value as unknown as number }))}
                          className="w-full rounded-[7px] px-2 py-2.5 text-[14px] text-center min-h-[44px]"
                          style={{
                            background: C.surface,
                            border:     `1px solid ${C.accent}`,
                            color:      C.text,
                            fontFamily: "'DM Mono', monospace",
                            boxSizing:  'border-box',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] block mb-1" style={{ color: C.muted }}>Notas</label>
                    <input
                      value={draft.notes ?? ''}
                      onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Notas…"
                      className="w-full rounded-[7px] px-3 py-2.5 text-[13px] min-h-[44px]"
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Carb selections */}
                  {carbFoods.length > 0 && (
                    <div
                      className="rounded-[10px] p-3"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    >
                      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#60a5fa' }}>
                        Selección de carbohidratos
                      </div>
                      <CarbSelectionsEditor
                        selections={draft.carbSelections ?? []}
                        carbFoods={carbFoods}
                        totalPortions={parseFloat(String(draft.carbs)) || 0}
                        onChange={next => setDraft(d => ({ ...d, carbSelections: next }))}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={saveSlot}
                      className="flex-1 py-2.5 rounded-[9px] text-[14px] font-bold cursor-pointer min-h-[44px]"
                      style={{ border: 'none', background: C.accent, color: '#000' }}
                    >
                      ✓ Guardar
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="py-2.5 px-4 rounded-[9px] text-[14px] cursor-pointer min-h-[44px]"
                      style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode card */
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                      <span className="text-[14px] font-medium" style={{ color: C.text }}>{SLOT_LABELS[slot]}</span>
                    </div>
                    <button
                      onClick={() => startEdit(slot)}
                      className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                      style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                    >
                      Editar
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {MACRO_COLS.map(m => (
                      <div
                        key={m.key}
                        className="rounded-lg p-2 text-center"
                        style={{ background: C.surface3 }}
                      >
                        <div
                          className="text-[16px] font-bold"
                          style={{ color: (s[m.key] ?? 0) > 0 ? m.color : C.dim, fontFamily: "'DM Mono', monospace" }}
                        >
                          {s[m.key] ?? 0}
                          <span className="text-[10px] font-normal ml-0.5" style={{ color: C.dim }}>{m.unit}</span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {s.notes && (
                    <div className="text-[12px] mt-2.5" style={{ color: C.muted }}>{s.notes}</div>
                  )}

                  {(s.carbSelections?.length ?? 0) > 0 && (
                    <div className="mt-2">
                      <CarbChips selections={s.carbSelections!} carbFoods={carbFoods} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div
        className="p-3 rounded-[10px] text-[12px]"
        style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
      >
        💡 Estos valores son los indicados por tu nutriólogo.{' '}
        <strong style={{ color: C.text }}>Carbos</strong> se mide en porciones (ver pestaña Carbohidratos).
        El planificador puede sustituir o combinar carbohidratos por día.
      </div>
    </div>
  );
}
