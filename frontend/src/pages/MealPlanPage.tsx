import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { MEAL_SLOTS, SLOT_LABELS, SLOT_ICONS, slotType, formatPortionUnits } from '../constants';
import type { Carga, StructuredSlotData, SlotData, MealSlot, CarbFood, CarbSelection } from '../types';
import type { PageProps } from '../App';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

const MACRO_COLS = [
  { key: 'protein' as const, label: 'Proteína', unit: 'g',    color: '#22c97a' },
  { key: 'carbs'   as const, label: 'Carbos',   unit: 'porc', color: '#60a5fa' },
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
  const [cargas,      setCargas]      = useState<Carga[]>([]);
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [carbFoods,   setCarbFoods]   = useState<CarbFood[]>([]);
  const [editingSlot, setEditingSlot] = useState<MealSlot | null>(null);
  const [draft,       setDraft]       = useState<Partial<StructuredSlotData>>({});
  const [saved,       setSaved]       = useState(false);
  const [personName,  setPersonName]  = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');
  const [creating,    setCreating]    = useState(false);
  const [newName,     setNewName]     = useState('');
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reloadCargas = () => api.getCargas(person).then(list => {
    setCargas(list);
    setActiveId(prev => {
      if (prev && list.some(c => c.id === prev)) return prev;
      return (list.find(c => c.isDefault) ?? list[0])?.id ?? null;
    });
  }).catch(() => {});

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    api.getCarbFoods(person).then(setCarbFoods).catch(() => {});
    setActiveId(null);
    reloadCargas();
    setEditingSlot(null);
  }, [person]);

  const activeCarga = cargas.find(c => c.id === activeId) ?? null;

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  const persistSlots = async (slots: Carga['slots']) => {
    if (!activeCarga) return;
    await api.updateCarga(activeCarga.id, { slots });
    setCargas(prev => prev.map(c => c.id === activeCarga.id ? { ...c, slots } : c));
    flashSaved();
  };

  const totals = MEAL_SLOTS.reduce(
    (acc, slot) => {
      if (slotType(slot) !== 'structured') return acc;
      const s = (activeCarga?.slots?.[slot] ?? {}) as Partial<StructuredSlotData>;
      acc.protein += s.protein ?? 0;
      acc.carbs   += s.carbs   ?? 0;
      return acc;
    },
    { protein: 0, carbs: 0 },
  );

  const startEditStructured = (slot: MealSlot) => {
    setDraft({ ...(activeCarga?.slots?.[slot] ?? {}) });
    setEditingSlot(slot);
  };

  const saveStructuredSlot = async () => {
    if (!editingSlot || !activeCarga) return;
    const protein = draft.protein !== undefined && draft.protein !== ('' as unknown) ? parseFloat(String(draft.protein)) : undefined;
    const carbs   = draft.carbs   !== undefined && draft.carbs   !== ('' as unknown) ? parseFloat(String(draft.carbs))   : undefined;
    const next: StructuredSlotData = {
      ...(protein !== undefined && !isNaN(protein) ? { protein } : {}),
      ...(carbs   !== undefined && !isNaN(carbs)   ? { carbs }   : {}),
      notes:          draft.notes || undefined,
      carbSelections: (draft.carbSelections ?? []).length > 0 ? draft.carbSelections : undefined,
    };
    await persistSlots({ ...(activeCarga.slots ?? {}), [editingSlot]: next });
    setEditingSlot(null);
  };

  const saveFreeSlot = async (slot: MealSlot, text: string) => {
    if (!activeCarga) return;
    const next = text.trim() ? { text } : {};
    await persistSlots({ ...(activeCarga.slots ?? {}), [slot]: next });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const carga = await api.createCarga({ personId: person, name: newName.trim() });
    setNewName('');
    setCreating(false);
    await reloadCargas();
    setActiveId(carga.id);
  };

  const handleRename = async () => {
    if (!activeCarga || !renameValue.trim()) return;
    await api.updateCarga(activeCarga.id, { name: renameValue.trim() });
    setRenaming(false);
    reloadCargas();
  };

  const handleSetDefault = async () => {
    if (!activeCarga) return;
    await api.setDefaultCarga(activeCarga.id);
    reloadCargas();
  };

  const handleDelete = async () => {
    if (!activeCarga) return;
    await api.deleteCarga(activeCarga.id);
    setConfirmDelete(false);
    setActiveId(null);
    reloadCargas();
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[920px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Cargas
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {personName} · Planes por intensidad de entrenamiento
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

      {/* Cargas selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        {cargas.map(c => (
          <button
            key={c.id}
            onClick={() => { setActiveId(c.id); setEditingSlot(null); }}
            className="px-3.5 py-2 rounded-[9px] text-[13px] cursor-pointer transition-all duration-150 min-h-[40px]"
            style={{
              border:     `1px solid ${activeId === c.id ? C.accent : C.border2}`,
              background: activeId === c.id ? C.accentGlow : 'none',
              color:      activeId === c.id ? C.accent : C.text,
              fontWeight: activeId === c.id ? 600 : 400,
            }}
          >
            {c.isDefault && '⭐ '}{c.name}
          </button>
        ))}
        {creating ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la carga…"
              className="rounded-[9px] px-3 py-2 text-[13px] min-h-[40px]"
              style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text }}
            />
            <button onClick={handleCreate} className="px-3 py-2 rounded-[9px] text-[13px] font-bold cursor-pointer min-h-[40px]" style={{ border: 'none', background: C.accent, color: '#000' }}>✓</button>
            <button onClick={() => { setCreating(false); setNewName(''); }} className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]" style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="px-3.5 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px dashed ${C.border2}`, background: 'none', color: C.muted }}
          >
            + Nueva carga
          </button>
        )}
      </div>

      {activeCarga ? (
        <>
          {/* Carga actions */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {renaming ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                  className="rounded-[9px] px-3 py-2 text-[13px] min-h-[40px]"
                  style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text }}
                />
                <button onClick={handleRename} className="px-3 py-2 rounded-[9px] text-[13px] font-bold cursor-pointer min-h-[40px]" style={{ border: 'none', background: C.accent, color: '#000' }}>✓</button>
                <button onClick={() => setRenaming(false)} className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]" style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}>✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setRenameValue(activeCarga.name); setRenaming(true); }}
                className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
              >
                Renombrar
              </button>
            )}
            {!activeCarga.isDefault && (
              <button
                onClick={handleSetDefault}
                className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
              >
                Marcar predeterminada
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={cargas.length <= 1}
              className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: `1px solid ${C.red}44`, background: 'none', color: C.red }}
            >
              Borrar carga
            </button>
          </div>

          {/* Daily totals */}
          <div
            className="rounded-[14px] p-4 md:p-[22px] mb-5"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: C.muted }}>
              Totales Diarios (comidas estructuradas)
            </div>
            <div className="grid grid-cols-2 gap-4">
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

          {/* Slots */}
          <div className="flex flex-col gap-2 mb-3.5">
            {MEAL_SLOTS.map(slot => {
              const isStructured = slotType(slot) === 'structured';
              const s = (activeCarga.slots?.[slot] ?? {}) as Partial<SlotData>;
              const isEdit = editingSlot === slot;

              if (!isStructured) {
                return (
                  <div
                    key={slot}
                    className="rounded-xl p-4"
                    style={{ background: C.surface2, border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                      <span className="text-[14px] font-medium" style={{ color: C.text }}>{SLOT_LABELS[slot]}</span>
                    </div>
                    <textarea
                      defaultValue={s.text ?? ''}
                      onBlur={e => saveFreeSlot(slot, e.target.value)}
                      placeholder="Ej: ½ tza de fruta + ½ medida de proteína…"
                      rows={2}
                      className="w-full rounded-[9px] px-3 py-2.5 text-[13px] resize-none"
                      style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={slot}
                  className="rounded-xl overflow-hidden"
                  style={{ background: C.surface2, border: `1px solid ${C.border}` }}
                >
                  {isEdit ? (
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                        <span className="text-[14px] font-semibold" style={{ color: C.accent }}>{SLOT_LABELS[slot]}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: MACRO_COLS[0].color }}>
                            Proteína <span className="font-normal" style={{ color: C.dim }}>(g)</span>
                          </label>
                          <input
                            type="number" min={0} step={1}
                            value={draft.protein ?? ''}
                            onChange={e => setDraft(d => ({ ...d, protein: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                            placeholder="—"
                            className="w-full rounded-[7px] px-2 py-2.5 text-[14px] text-center min-h-[44px]"
                            style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: MACRO_COLS[1].color }}>
                            Carbos <span className="font-normal" style={{ color: C.dim }}>(porc)</span>
                          </label>
                          <input
                            type="number" min={0} step={0.5}
                            value={draft.carbs ?? ''}
                            onChange={e => setDraft(d => ({ ...d, carbs: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                            placeholder="—"
                            className="w-full rounded-[7px] px-2 py-2.5 text-[14px] text-center min-h-[44px]"
                            style={{ background: C.surface, border: `1px solid ${C.accent}`, color: C.text, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }}
                          />
                        </div>
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
                            totalPortions={draft.carbs ?? 0}
                            onChange={next => setDraft(d => ({ ...d, carbSelections: next }))}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={saveStructuredSlot}
                          className="flex-1 py-2.5 rounded-[9px] text-[14px] font-bold cursor-pointer min-h-[44px]"
                          style={{ border: 'none', background: C.accent, color: '#000' }}
                        >
                          ✓ Guardar
                        </button>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="py-2.5 px-4 rounded-[9px] text-[14px] cursor-pointer min-h-[44px]"
                          style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px]">{SLOT_ICONS[slot]}</span>
                          <span className="text-[14px] font-medium" style={{ color: C.text }}>{SLOT_LABELS[slot]}</span>
                        </div>
                        <button
                          onClick={() => startEditStructured(slot)}
                          className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                          style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                        >
                          Editar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {MACRO_COLS.map(m => {
                          const value = s[m.key];
                          const has   = value !== undefined && value > 0;
                          return (
                            <div
                              key={m.key}
                              className="rounded-lg p-2 text-center"
                              style={{ background: C.surface3 }}
                            >
                              <div
                                className="text-[16px] font-bold"
                                style={{ color: has ? m.color : C.dim, fontFamily: "'DM Mono', monospace" }}
                              >
                                {has ? value : '—'}
                                {has && <span className="text-[10px] font-normal ml-0.5" style={{ color: C.dim }}>{m.unit}</span>}
                              </div>
                              <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{m.label}</div>
                            </div>
                          );
                        })}
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
        </>
      ) : (
        <div
          className="text-center py-12 px-5 rounded-[14px]"
          style={{ background: C.surface2, border: `1px dashed ${C.border2}` }}
        >
          <div className="text-[32px] mb-3">🍽️</div>
          <div className="text-[15px] font-semibold mb-2" style={{ color: C.text }}>
            Sin cargas configuradas
          </div>
          <div className="text-[13px] mb-4" style={{ color: C.muted }}>
            Crea la primera carga para empezar a capturar el plan de {personName}.
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2.5 rounded-[10px] text-[13px] font-bold cursor-pointer min-h-[44px]"
            style={{ border: 'none', background: C.accent, color: '#000' }}
          >
            + Crear primera carga
          </button>
        </div>
      )}

      {confirmDelete && activeCarga && (
        <ConfirmDeleteModal
          title={`Borrar "${activeCarga.name}"`}
          message="Esta acción no se puede deshacer. Los días del planner que usaban esta carga caerán a la predeterminada."
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
