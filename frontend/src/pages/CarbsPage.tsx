import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { formatPortionUnits } from '../constants';
import type { CarbFood } from '../types';
import type { PageProps } from '../App';

/* ─── Form state shape (matches Omit<CarbFood, 'id'> minus personId) ─── */
interface CarbFoodForm {
  name:            string;
  unitLabel:       string;
  unitsPerPortion: number;
  notes:           string;
  sortOrder:       number;
}

const EMPTY_FORM: CarbFoodForm = {
  name:            '',
  unitLabel:       '',
  unitsPerPortion: 1,
  notes:           '',
  sortOrder:       0,
};

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

  const preview = form.name && form.unitLabel
    ? formatPortionUnits(1, { unitLabel: form.unitLabel, unitsPerPortion: form.unitsPerPortion })
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border2}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>

        <div className="p-5 md:p-7">
          <div className="text-[17px] font-bold mb-5" style={{ color: C.text }}>
            {food ? 'Editar' : 'Nuevo'} Carbohidrato
          </div>

          <div className="flex flex-col gap-3.5 mb-5">
            {/* Name */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>
                Nombre
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ej. Tortilla de maíz"
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
              />
            </div>

            {/* Unit label */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>
                Unidad{' '}
                <span className="font-normal" style={{ color: C.dim }}>(pza, tza, reb, paquete, waffle…)</span>
              </label>
              <input
                value={form.unitLabel}
                onChange={e => set('unitLabel', e.target.value)}
                placeholder="ej. pza"
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
              />
            </div>

            {/* Units per portion */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>
                Unidades por porción
              </label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={form.unitsPerPortion}
                onChange={e => set('unitsPerPortion', parseFloat(e.target.value) || 1)}
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box', fontFamily: "'DM Mono', monospace" }}
              />
              <div className="text-[12px] mt-1.5" style={{ color: C.muted }}>
                Ejemplos: tortilla=1, tostada=2, arroz=0.5
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>Notas (opcional)</label>
              <input
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="ej. integral, sin sal…"
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
              />
            </div>

            {/* Preview */}
            {preview && (
              <div
                className="rounded-[10px] p-3 text-[13px]"
                style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
              >
                Vista previa: 1 porción ={' '}
                <span style={{ color: '#60a5fa', fontWeight: 600 }}>{preview} {form.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[9px] text-[14px] cursor-pointer min-h-[44px]"
              style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.unitLabel.trim() || saving}
              className="px-5 py-2.5 rounded-[9px] text-[14px] font-bold cursor-pointer min-h-[44px]"
              style={{
                border:     'none',
                background: C.accent,
                color:      '#000',
                opacity:    !form.name.trim() || !form.unitLabel.trim() ? 0.5 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Card (mobile list item) ─── */
function CarbFoodCard({
  food, onEdit, onDelete,
}: {
  food: CarbFood;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-[14px] p-4 flex flex-col gap-2.5"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="text-[15px] font-bold" style={{ color: C.text }}>{food.name}</div>
          {food.notes && (
            <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{food.notes}</div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
            style={{ border: `1px solid ${C.red}33`, background: 'none', color: C.red }}
          >
            Borrar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div
          className="px-3 py-1.5 rounded-full text-[13px] font-bold"
          style={{ background: '#60a5fa18', color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}
        >
          {formatPortionUnits(1, food)} / porc.
        </div>
        <div className="text-[12px]" style={{ color: C.muted }}>
          1 porción = {food.unitsPerPortion} {food.unitLabel}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function CarbsPage({ person }: PageProps) {
  const [foods, setFoods] = useState<CarbFood[]>([]);
  const [modal, setModal] = useState<CarbFood | null | 'new'>(null);

  const reload = () => api.getCarbFoods(person).then(setFoods).catch(() => {});

  useEffect(() => { reload(); }, [person]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Borrar este carbohidrato? Se eliminará de cualquier comida planificada.')) return;
    await api.deleteCarbFood(id);
    reload();
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[900px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Carbohidratos
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {foods.length} fuentes · Porciones configuradas por nutriólogo
          </div>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-bold cursor-pointer shrink-0 min-h-[44px]"
          style={{ border: 'none', background: C.accent, color: '#000' }}
        >
          + Agregar
        </button>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl p-3.5 mb-5 text-[13px] flex gap-2.5 items-start"
        style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
      >
        <span className="text-[18px] shrink-0">💡</span>
        <span>
          Una <strong style={{ color: C.text }}>porción</strong> es la unidad estándar definida por tu nutriólogo.
          Configura cuántas unidades físicas tiene cada porción para ver equivalencias en el planificador.
        </span>
      </div>

      {foods.length === 0 ? (
        <div className="text-center py-12 text-[14px]" style={{ color: C.muted }}>
          Sin carbohidratos registrados. ¡Agrega el primero!
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            className="hidden md:block rounded-[14px] overflow-hidden mb-5"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            <div
              className="px-5 py-2.5 grid items-center"
              style={{
                borderBottom: `1px solid ${C.border}`,
                gridTemplateColumns: '1fr 100px 160px 1fr 130px',
                gap: 10,
              }}
            >
              {['Nombre', 'Unidad', 'Unid. / porción', 'Notas', ''].map((h, i) => (
                <div
                  key={i}
                  className="text-[10px] uppercase tracking-[0.07em] font-semibold"
                  style={{ color: C.dim, textAlign: i === 4 ? 'right' : 'left' }}
                >
                  {h}
                </div>
              ))}
            </div>
            {foods.map((food, idx) => (
              <div
                key={food.id}
                className="px-5 py-3 grid items-center"
                style={{
                  gridTemplateColumns: '1fr 100px 160px 1fr 130px',
                  gap: 10,
                  borderTop: idx > 0 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: C.text }}>{food.name}</div>
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}
                >
                  {food.unitLabel}
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}
                >
                  {food.unitsPerPortion} {food.unitLabel} / porc.
                </div>
                <div className="text-[12px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: C.dim }}>
                  {food.notes || '—'}
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => setModal(food)}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                    style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(food.id)}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer min-h-[36px]"
                    style={{ border: `1px solid ${C.red}33`, background: 'none', color: C.red }}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3 mb-5">
            {foods.map(food => (
              <CarbFoodCard
                key={food.id}
                food={food}
                onEdit={() => setModal(food)}
                onDelete={() => handleDelete(food.id)}
              />
            ))}
          </div>

          {/* Equivalencias hint */}
          <div
            className="rounded-[10px] p-4 text-[12px]"
            style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
          >
            <div className="font-semibold mb-2" style={{ color: C.text }}>Equivalencias (1 porción)</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {foods.map(food => (
                <span key={food.id}>
                  <span style={{ color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>
                    {formatPortionUnits(1, food)}
                  </span>{' '}
                  {food.name}
                </span>
              ))}
            </div>
          </div>
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
    </div>
  );
}
