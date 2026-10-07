import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Pencil, Trash2 } from 'lucide-react';
import { C, FONT } from '../theme';
import * as api from '../api';
import { formatPortionUnits } from '../constants';
import type { CarbFood } from '../types';
import type { PageProps } from '../App';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Button, Card, Field, PageHeader, Sheet, inputClass, inputStyle } from '../components/ui';

/* ─── Form state shape (matches Omit<CarbFood, 'id'> minus personId) ─── */
interface CarbFoodForm {
  name:            string;
  unitLabel:       string;
  unitsPerPortion: number;
  notes:           string;
  sortOrder:       number;
}

/* Lime chip showing what one portion looks like, e.g. "2 pza" */
function PortionChip({ food }: { food: Pick<CarbFood, 'unitLabel' | 'unitsPerPortion'> }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold tabular whitespace-nowrap"
      style={{ background: C.accentSoft, color: C.accentText, fontFamily: FONT.mono }}
    >
      {formatPortionUnits(1, food)}
    </span>
  );
}

/* ─── Modal (add / edit) ─── */
function CarbFoodModal({
  food, personId, onSave, onClose,
}: {
  food: CarbFood | null;
  personId: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CarbFoodForm>({
    name:            food?.name            ?? '',
    unitLabel:       food?.unitLabel       ?? '',
    unitsPerPortion: food?.unitsPerPortion ?? 1,
    notes:           food?.notes           ?? '',
    sortOrder:       food?.sortOrder       ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CarbFoodForm>(k: K, v: CarbFoodForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.unitLabel.trim()) return;
    setSaving(true);
    try {
      if (food?.id) {
        await api.updateCarbFood(food.id, {
          name:            form.name.trim(),
          unitLabel:       form.unitLabel.trim(),
          unitsPerPortion: form.unitsPerPortion,
          notes:           form.notes.trim() || null,
          sortOrder:       form.sortOrder,
        });
      } else {
        await api.createCarbFood({
          personId,
          name:            form.name.trim(),
          unitLabel:       form.unitLabel.trim(),
          unitsPerPortion: form.unitsPerPortion,
          notes:           form.notes.trim() || null,
          sortOrder:       form.sortOrder,
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const valid = !!form.name.trim() && !!form.unitLabel.trim();

  return (
    <Sheet title={`${food ? 'Editar' : 'Nuevo'} carbohidrato`} onClose={onClose} maxWidth={500}>
      <div className="flex flex-col gap-4 mb-7">
        <Field label="Nombre">
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="ej. Tortilla de maíz"
            className={inputClass}
            style={inputStyle}
          />
        </Field>

        <Field label={<>Unidad <span style={{ color: C.muted, fontWeight: 400 }}>(pza, tza, reb, paquete, waffle…)</span></>}>
          <input
            value={form.unitLabel}
            onChange={e => set('unitLabel', e.target.value)}
            placeholder="ej. pza"
            className={inputClass}
            style={inputStyle}
          />
        </Field>

        <Field label="Unidades por porción" hint="Ejemplos: tortilla=1, tostada=2, arroz=0.5">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={form.unitsPerPortion}
            onChange={e => set('unitsPerPortion', parseFloat(e.target.value) || 1)}
            className={`${inputClass} tabular`}
            style={{ ...inputStyle, fontFamily: FONT.mono }}
          />
        </Field>

        <Field label="Notas (opcional)">
          <input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="ej. integral, sin sal…"
            className={inputClass}
            style={inputStyle}
          />
        </Field>

        {valid && (
          <div className="rounded-2xl p-4 text-[14px] flex flex-wrap items-center gap-2" style={{ background: C.surface3, color: C.muted }}>
            1 porción = <PortionChip food={form} /> <span style={{ color: C.text, fontWeight: 600 }}>{form.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={!valid || saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </Sheet>
  );
}

function RowActions({ onEdit, onDelete, name }: { onEdit: () => void; onDelete: () => void; name: string }) {
  return (
    <div className="flex gap-1 justify-end shrink-0">
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Editar ${name}`} title="Editar" icon={<Pencil size={15} />} style={{ border: 'none' }} />
      <Button size="sm" variant="ghost" onClick={onDelete} aria-label={`Borrar ${name}`} title="Borrar" icon={<Trash2 size={15} />} style={{ border: 'none', color: C.red }} />
    </div>
  );
}

/* ─── Page ─── */
export default function CarbsPage({ person }: PageProps) {
  const [foods,        setFoods]        = useState<CarbFood[]>([]);
  const [modal,        setModal]        = useState<CarbFood | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarbFood | null>(null);

  const reload = () => api.getCarbFoods(person).then(setFoods).catch(() => {});

  useEffect(() => { reload(); }, [person]);

  return (
    <div className="px-4 py-5 md:px-12 md:py-10 max-w-[1000px]">
      <PageHeader
        eyebrow={<>{foods.length} fuentes · Porciones configuradas por nutriólogo</>}
        title="Carbohidratos"
        actions={
          <Button variant="primary" onClick={() => setModal('new')} icon={<Plus size={16} strokeWidth={2.5} style={{ color: C.primaryIcon }} />}>
            Agregar
          </Button>
        }
      />

      {/* Info banner */}
      <Card tone="accent" className="p-4 md:p-5 mb-4 md:mb-5 flex gap-3 items-start text-[14px]">
        <Lightbulb size={20} className="shrink-0 mt-px" />
        <span>
          Una <strong>porción</strong> es la unidad estándar definida por tu nutriólogo.
          Configura cuántas unidades físicas tiene cada porción para ver equivalencias en el planificador.
        </span>
      </Card>

      {foods.length === 0 ? (
        <Card className="text-center py-12 px-5 text-[14px]" style={{ color: C.muted }}>
          Sin carbohidratos registrados. ¡Agrega el primero!
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block px-4 pt-2 pb-3 mb-5">
            <div
              className="px-3 py-3 grid items-center text-[12px] font-semibold"
              style={{ gridTemplateColumns: '1.3fr 120px 170px 1fr 92px', gap: 12, color: C.muted, borderBottom: `1px solid ${C.border}` }}
            >
              <div>Nombre</div><div>Porción</div><div>Unid. / porción</div><div>Notas</div><div />
            </div>
            {foods.map((food, idx) => (
              <div
                key={food.id}
                className="px-3 py-2.5 grid items-center text-[14px]"
                style={{
                  gridTemplateColumns: '1.3fr 120px 170px 1fr 92px',
                  gap: 12,
                  borderTop: idx > 0 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div className="font-semibold">{food.name}</div>
                <div><PortionChip food={food} /></div>
                <div className="tabular" style={{ color: C.muted }}>{food.unitsPerPortion} {food.unitLabel} / porc.</div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: C.muted }}>{food.notes || '—'}</div>
                <RowActions name={food.name} onEdit={() => setModal(food)} onDelete={() => setDeleteTarget(food)} />
              </div>
            ))}
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-2.5 mb-4">
            {foods.map(food => (
              <Card key={food.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold">{food.name}</div>
                    {food.notes && <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>{food.notes}</div>}
                  </div>
                  <RowActions name={food.name} onEdit={() => setModal(food)} onDelete={() => setDeleteTarget(food)} />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <PortionChip food={food} />
                  <span className="text-[13px]" style={{ color: C.muted }}>
                    1 porción = {food.unitsPerPortion} {food.unitLabel}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Equivalencias */}
          <Card tone="ink" className="p-5 md:p-6">
            <div className="text-[15px] font-semibold mb-3">Equivalencias · 1 porción</div>
            <div className="flex flex-wrap gap-2">
              {foods.map(food => (
                <span
                  key={food.id}
                  className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[13px]"
                  style={{ background: C.inkTrack }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full font-semibold tabular"
                    style={{ background: C.accent, color: C.accentInk, fontFamily: FONT.mono }}
                  >
                    {formatPortionUnits(1, food)}
                  </span>
                  {food.name}
                </span>
              ))}
            </div>
          </Card>
        </>
      )}

      {modal !== null && (
        <CarbFoodModal
          food={modal === 'new' ? null : modal}
          personId={person}
          onSave={() => { reload(); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDeleteModal
          title="Eliminar carbohidrato"
          message={`¿Seguro que quieres eliminar "${deleteTarget.name}"? Se eliminará de cualquier comida planificada.`}
          onConfirm={async () => { await api.deleteCarbFood(deleteTarget.id); reload(); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
