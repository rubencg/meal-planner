import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Check, X, Star, UtensilsCrossed, Plus, Pencil } from 'lucide-react';
import { SlotIcon } from '../components/SlotIcon';
import { C, FONT } from '../theme';
import * as api from '../api';
import { MEAL_SLOTS, SLOT_LABELS, slotType } from '../constants';
import type { Carga, StructuredSlotData, SlotData, MealSlot } from '../types';
import type { PageProps } from '../App';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { BigNumber, Button, Card, PageHeader, inputStyle } from '../components/ui';

const MACRO_COLS = [
  { key: 'protein' as const, label: 'Proteína', unit: 'g'    },
  { key: 'carbs'   as const, label: 'Carbos',   unit: 'porc' },
];

/* ─── Textarea que crece con su contenido ─── */
function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(resize, []);
  return (
    <textarea
      {...props}
      ref={ref}
      onInput={e => { resize(); props.onInput?.(e); }}
    />
  );
}

export default function MealPlanPage({ person }: PageProps) {
  const [cargas,      setCargas]      = useState<Carga[]>([]);
  const [activeId,    setActiveId]    = useState<string | null>(null);
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
      notes: draft.notes || undefined,
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

  const smallInput = 'rounded-full px-4 min-h-[44px] text-[14px]';

  return (
    <div className="px-4 py-5 md:px-12 md:py-10 max-w-[1100px]">
      <PageHeader
        eyebrow={<>{personName} · Planes por intensidad de entrenamiento</>}
        title="Cargas"
        actions={saved && (
          <span
            className="inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-full text-[13px] font-semibold"
            style={{ background: C.accent, color: C.accentInk }}
            role="status"
          >
            <Check size={15} strokeWidth={2.5} /> Guardado
          </span>
        )}
      />

      {/* Cargas selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        {cargas.map(c => {
          const active = activeId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setActiveId(c.id); setEditingSlot(null); }}
              aria-pressed={active}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full text-[14px] cursor-pointer"
              style={{
                border:     active ? '1px solid transparent' : `1px solid ${C.border2}`,
                background: active ? C.ink : C.surface,
                color:      active ? C.inkText : C.text,
                fontWeight: active ? 600 : 500,
              }}
            >
              {c.isDefault && <Star size={13} style={{ color: active ? C.accent : C.yellow, fill: 'currentColor' }} />}
              {c.name}
            </button>
          );
        })}
        {creating ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la carga…"
              aria-label="Nombre de la nueva carga"
              className={smallInput}
              style={inputStyle}
            />
            <Button variant="accent" onClick={handleCreate} aria-label="Crear carga" icon={<Check size={16} strokeWidth={2.5} />} />
            <Button variant="ghost" onClick={() => { setCreating(false); setNewName(''); }} aria-label="Cancelar" icon={<X size={16} />} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full text-[14px] cursor-pointer"
            style={{ border: `1px dashed ${C.border2}`, background: 'transparent', color: C.muted }}
          >
            <Plus size={15} /> Nueva carga
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
                  aria-label="Nuevo nombre"
                  className={smallInput}
                  style={inputStyle}
                />
                <Button variant="accent" onClick={handleRename} aria-label="Guardar nombre" icon={<Check size={16} strokeWidth={2.5} />} />
                <Button variant="ghost" onClick={() => setRenaming(false)} aria-label="Cancelar" icon={<X size={16} />} />
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => { setRenameValue(activeCarga.name); setRenaming(true); }}>
                Renombrar
              </Button>
            )}
            {!activeCarga.isDefault && (
              <Button size="sm" variant="ghost" onClick={handleSetDefault}>
                Marcar predeterminada
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={cargas.length <= 1} style={{ color: C.red }}>
              Borrar carga
            </Button>
          </div>

          {/* Daily totals */}
          <Card tone="accent" className="p-5 md:p-7 mb-4 md:mb-5">
            <div className="text-[14px] font-semibold mb-4">Totales diarios · comidas estructuradas</div>
            <div className="grid grid-cols-2 gap-4">
              {MACRO_COLS.map(m => (
                <div key={m.key} className="flex flex-col gap-2">
                  <BigNumber value={totals[m.key]} unit={m.unit} size={56} />
                  <div className="text-[13px] font-medium">{m.label} / día</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Slots */}
          <div className="grid md:grid-cols-2 gap-2.5 md:gap-3">
            {MEAL_SLOTS.map(slot => {
              const isStructured = slotType(slot) === 'structured';
              const s = (activeCarga.slots?.[slot] ?? {}) as Partial<SlotData>;
              const isEdit = editingSlot === slot;

              const title = (
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.surface3 }}>
                    <SlotIcon slot={slot} size={17} />
                  </span>
                  <span className="text-[15px] font-semibold">{SLOT_LABELS[slot]}</span>
                </div>
              );

              if (!isStructured) {
                return (
                  <Card key={slot} className="p-4 md:p-5 flex flex-col gap-3">
                    {title}
                    <AutoTextarea
                      key={`${activeCarga.id}-${slot}`}
                      defaultValue={s.text ?? ''}
                      onBlur={e => saveFreeSlot(slot, e.target.value)}
                      placeholder="Ej: ½ tza de fruta + ½ medida de proteína…"
                      aria-label={`Plan de ${SLOT_LABELS[slot]}`}
                      rows={2}
                      className="w-full rounded-2xl px-4 py-3 text-[14px] leading-relaxed resize-none overflow-hidden"
                      style={inputStyle}
                    />
                  </Card>
                );
              }

              return (
                <Card key={slot} className="p-4 md:p-5 flex flex-col gap-3" style={isEdit ? { boxShadow: `inset 0 0 0 2px ${C.text}` } : undefined}>
                  {isEdit ? (
                    <>
                      {title}
                      <div className="grid grid-cols-2 gap-2">
                        {MACRO_COLS.map(m => (
                          <label key={m.key} className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-semibold">
                              {m.label} <span style={{ color: C.muted, fontWeight: 400 }}>({m.unit})</span>
                            </span>
                            <input
                              type="number" min={0} step={m.key === 'carbs' ? 0.5 : 1}
                              value={draft[m.key] ?? ''}
                              onChange={e => setDraft(d => ({ ...d, [m.key]: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                              placeholder="—"
                              className="w-full rounded-2xl px-3 min-h-[48px] text-[16px] text-center tabular"
                              style={{ ...inputStyle, fontFamily: FONT.mono }}
                            />
                          </label>
                        ))}
                      </div>

                      <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-semibold">Notas</span>
                        <input
                          value={draft.notes ?? ''}
                          onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                          placeholder="Notas…"
                          className="w-full rounded-2xl px-4 min-h-[48px] text-[14px]"
                          style={inputStyle}
                        />
                      </label>

                      <div className="flex gap-2">
                        <Button variant="primary" onClick={saveStructuredSlot} className="flex-1" icon={<Check size={16} strokeWidth={2.5} />}>
                          Guardar
                        </Button>
                        <Button variant="secondary" onClick={() => setEditingSlot(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center gap-2">
                        {title}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditStructured(slot)}
                          aria-label={`Editar ${SLOT_LABELS[slot]}`}
                          icon={<Pencil size={14} />}
                        >
                          Editar
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {MACRO_COLS.map(m => {
                          const value = s[m.key];
                          const has   = value !== undefined && value > 0;
                          return (
                            <div key={m.key} className="rounded-2xl px-4 py-3 flex flex-col gap-1.5" style={{ background: C.surface2 }}>
                              <span className="text-[12px] font-semibold" style={{ color: C.muted }}>{m.label}</span>
                              <span style={{ color: has ? C.text : C.dim }}>
                                <BigNumber value={has ? value : '—'} unit={has ? m.unit : undefined} size={30} unitColor={C.muted} />
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {s.notes && (
                        <div className="text-[13px]" style={{ color: C.muted }}>{s.notes}</div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="text-center py-12 px-5 flex flex-col items-center gap-3" style={{ border: `1px dashed ${C.border2}` }}>
          <UtensilsCrossed size={34} strokeWidth={1.5} style={{ color: C.muted }} />
          <div className="text-[16px] font-semibold">Sin cargas configuradas</div>
          <div className="text-[14px] mb-2" style={{ color: C.muted }}>
            Crea la primera carga para empezar a capturar el plan de {personName}.
          </div>
          <Button variant="accent" onClick={() => setCreating(true)} icon={<Plus size={16} strokeWidth={2.5} />}>
            Crear primera carga
          </Button>
        </Card>
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

