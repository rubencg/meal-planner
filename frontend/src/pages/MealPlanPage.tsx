import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { MEAL_SLOTS, SLOT_LABELS, SLOT_ICONS } from '../constants';
import type { MealPlan, SlotData, MealSlot } from '../types';
import type { PageProps } from '../App';

const MACRO_COLS = [
  { key: 'protein' as const, label: 'Proteína', unit: 'g',   color: '#22c97a' },
  { key: 'carbs'   as const, label: 'Carbos',   unit: 'g',   color: '#60a5fa' },
  { key: 'fruit'   as const, label: 'Fruta',    unit: 'taz', color: '#fb923c' },
];

export default function MealPlanPage({ person }: PageProps) {
  const [plan,    setPlan]    = useState<MealPlan>({ personId: person, slots: {} });
  const [editing, setEditing] = useState<MealSlot | null>(null);
  const [draft,   setDraft]   = useState<Partial<SlotData>>({});
  const [saved,   setSaved]   = useState(false);
  const [personName, setPersonName] = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    api.getMealPlan(person).then(setPlan).catch(() => {});
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
    setDraft({ protein: 0, carbs: 0, fruit: 0, notes: '', ...(plan.slots?.[slot] ?? {}) });
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
          protein: parseFloat(String(draft.protein)) || 0,
          carbs:   parseFloat(String(draft.carbs))   || 0,
          fruit:   parseFloat(String(draft.fruit))   || 0,
          notes:   draft.notes ?? '',
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
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[860px]">
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
        <div
          className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-3"
          style={{ color: C.muted }}
        >
          Totales Diarios
        </div>
        <div className="grid grid-cols-3 gap-4">
          {MACRO_COLS.map(m => (
            <div key={m.key} className="text-center">
              <div
                className="text-[24px] font-bold"
                style={{ color: m.color, fontFamily: "'DM Mono', monospace" }}
              >
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
            gridTemplateColumns: '170px repeat(3, 1fr) 1fr 70px',
            gap: 10,
          }}
        >
          {['Comida', 'Proteína', 'Carbos', 'Fruta', 'Notas', ''].map((h, i) => (
            <div
              key={i}
              className="text-[10px] uppercase tracking-[0.07em] font-semibold"
              style={{ color: C.dim, textAlign: i > 0 ? 'center' : 'left' }}
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
                <div
                  className="px-[18px] py-3 grid items-center"
                  style={{ gridTemplateColumns: '170px repeat(3, 1fr) 1fr 70px', gap: 10 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                    <span className="text-[13px] font-semibold" style={{ color: C.accent }}>{SLOT_LABELS[slot]}</span>
                  </div>
                  {(['protein', 'carbs', 'fruit'] as const).map(k => (
                    <input
                      key={k}
                      type="number"
                      min={0}
                      step={k === 'fruit' ? 0.25 : 1}
                      value={draft[k] ?? ''}
                      onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
                      className="w-full rounded-[7px] px-2 py-[7px] text-[13px] text-center"
                      style={{
                        background:  C.surface,
                        border:      `1px solid ${C.accent}`,
                        color:       C.text,
                        fontFamily:  "'DM Mono', monospace",
                        boxSizing:   'border-box',
                      }}
                    />
                  ))}
                  <input
                    value={draft.notes ?? ''}
                    onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Notas…"
                    className="w-full rounded-[7px] px-2 py-[7px] text-[12px]"
                    style={{
                      background: C.surface,
                      border:     `1px solid ${C.accent}`,
                      color:      C.text,
                      boxSizing:  'border-box',
                    }}
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
              ) : (
                <div
                  className="px-[18px] py-3 grid items-center"
                  style={{ gridTemplateColumns: '170px repeat(3, 1fr) 1fr 70px', gap: 10 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                    <span className="text-[13px] font-medium" style={{ color: C.text }}>{SLOT_LABELS[slot]}</span>
                  </div>
                  {MACRO_COLS.map(m => (
                    <div key={m.key} className="text-center">
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: (s[m.key] ?? 0) > 0 ? m.color : C.dim, fontFamily: "'DM Mono', monospace" }}
                      >
                        {s[m.key] ?? 0}
                      </span>
                      <span className="text-[10px]" style={{ color: C.dim }}>{m.unit}</span>
                    </div>
                  ))}
                  <div
                    className="text-[11px] overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ color: C.muted }}
                    title={s.notes ?? ''}
                  >
                    {s.notes || <span style={{ color: C.dim }}>—</span>}
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
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={k === 'fruit' ? 0.25 : 1}
                          value={draft[k] ?? ''}
                          onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
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
                      style={{
                        background: C.surface,
                        border:     `1px solid ${C.accent}`,
                        color:      C.text,
                        boxSizing:  'border-box',
                      }}
                    />
                  </div>

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
        💡 Estos valores son los indicados por tu nutriólogo. La columna{' '}
        <strong style={{ color: C.text }}>Proteína</strong> es el peso{' '}
        <strong style={{ color: C.text }}>cocido</strong>. El planificador calculará cuánto crudo
        necesitas según la proteína seleccionada.
      </div>
    </div>
  );
}
