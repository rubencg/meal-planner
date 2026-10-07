import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { C, FONT } from '../theme';
import * as api from '../api';
import type { InBodyRecord } from '../types';
import type { PageProps } from '../App';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { InBodyChart } from '../components/InBodyChart';
import { BigNumber, Button, Card, DeltaPill, Field, PageHeader, Sheet, inputClass, inputStyle } from '../components/ui';

const INBODY_FIELDS = [
  // Ordered in pairs: each two entries share a row in the 2-column modal grid
  { key: 'weight',                label: 'Peso',            unit: 'kg',   step: 0.1  },
  { key: 'bmi',                   label: 'IMC',             unit: '',     step: 0.1  },
  { key: 'skeletalMuscleMass',    label: 'Masa Muscular',   unit: 'kg',   step: 0.1  },
  { key: 'skeletalMusclePercent', label: '% Muscular',      unit: '%',    step: 0.1  },
  { key: 'bodyFatMass',           label: 'Grasa',           unit: 'kg',   step: 0.1  },
  { key: 'bodyFatPercent',        label: '% Grasa',         unit: '%',    step: 0.1  },
  { key: 'visceralFatLevel',      label: 'Grasa Visceral',  unit: 'lvl',  step: 1    },
  { key: 'waistHipRatio',         label: 'Cintura-Cadera',  unit: '',     step: 0.01 },
] as const;

type FieldKey = typeof INBODY_FIELDS[number]['key'];

const TREND_CARDS: { key: FieldKey; label: string; unit: string; lb: boolean }[] = [
  { key: 'weight',                label: 'Peso',         unit: 'kg',  lb: true  },
  { key: 'skeletalMuscleMass',    label: 'Músculo',      unit: 'kg',  lb: false },
  { key: 'skeletalMusclePercent', label: '% Muscular',   unit: '%',   lb: false },
  { key: 'bodyFatMass',           label: 'Grasa',        unit: 'kg',  lb: true  },
  { key: 'bodyFatPercent',        label: '% Grasa',      unit: '%',   lb: true  },
  { key: 'visceralFatLevel',      label: 'Gr. Visceral', unit: 'lvl', lb: true  },
];

const TABLE_COLS: { key: FieldKey; label: string; desktop: boolean }[] = [
  { key: 'weight',                label: 'Peso',          desktop: false },
  { key: 'skeletalMuscleMass',    label: 'Masa Muscular', desktop: true  },
  { key: 'skeletalMusclePercent', label: '% Muscular',    desktop: false },
  { key: 'bodyFatMass',           label: 'Grasa',         desktop: true  },
  { key: 'bodyFatPercent',        label: '% Grasa',       desktop: false },
  { key: 'bmi',                   label: 'IMC',           desktop: true  },
];

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

function InBodyModal({
  record, personId, onSave, onClose,
}: {
  record: Partial<InBodyRecord> | null;
  personId: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm]   = useState<Partial<InBodyRecord>>(record ?? { personId, date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form.id) await api.updateInBody(form.id, form);
      else await api.createInBody({ ...form, personId } as Omit<InBodyRecord, 'id'>);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <Sheet title={`${form.id ? 'Editar' : 'Nuevo'} registro InBody`} onClose={onClose} maxWidth={560}>
      <div className="grid grid-cols-2 gap-3.5 mb-7">
        <div className="col-span-2">
          <Field label="Fecha">
            <input
              type="date"
              value={form.date ?? ''}
              onChange={e => set('date', e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        </div>

        {INBODY_FIELDS.map(f => (
          <Field key={f.key} label={<>{f.label}{f.unit && <span style={{ color: C.muted, fontWeight: 400 }}> ({f.unit})</span>}</>}>
            <input
              type="number"
              step={f.step}
              value={(form[f.key as FieldKey] as number | undefined) ?? ''}
              onChange={e => set(f.key, parseFloat(e.target.value) || '')}
              className={`${inputClass} tabular`}
              style={{ ...inputStyle, fontFamily: FONT.mono }}
            />
          </Field>
        ))}
      </div>

      <div className="flex gap-2.5 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </Sheet>
  );
}

export default function InBodyPage({ person }: PageProps) {
  const [records,       setRecords]       = useState<InBodyRecord[]>([]);
  const [modal,         setModal]         = useState<Partial<InBodyRecord> | null | 'new'>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<InBodyRecord | null>(null);
  const [personName,    setPersonName]    = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

  const reload = () => api.getInBody(person).then(setRecords).catch(() => {});

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    reload();
  }, [person]);

  const latest = records[records.length - 1];
  const prev   = records[records.length - 2];
  const delta  = (key: FieldKey) => {
    if (!latest || !prev) return null;
    const a = latest[key] as number | undefined;
    const b = prev[key]   as number | undefined;
    if (a == null || b == null) return null;
    return Math.round((a - b) * 10) / 10;
  };

  return (
    <div className="px-4 py-5 md:px-12 md:py-10 max-w-[1240px]">
      <PageHeader
        eyebrow={<>{personName} · {records.length} registro{records.length !== 1 ? 's' : ''}</>}
        title="Historial InBody"
        actions={
          <Button variant="primary" onClick={() => setModal('new')} icon={<Plus size={16} strokeWidth={2.5} style={{ color: C.primaryIcon }} />}>
            Nuevo registro
          </Button>
        }
      />

      {/* Latest values */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3 mb-4 md:mb-5">
          {TREND_CARDS.map((f, i) => {
            const d = delta(f.key);
            return (
              <Card key={f.key} tone={i === 0 ? 'accent' : 'surface'} className="p-4 md:p-5 flex flex-col gap-4 justify-between">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[13px] font-semibold">{f.label}</span>
                  {d != null && <DeltaPill delta={d} lowerIsBetter={f.lb} onAccent={i === 0} />}
                </div>
                <BigNumber value={(latest[f.key] as number | undefined) ?? '—'} unit={f.unit} size={34} unitColor={i === 0 ? undefined : C.muted} />
              </Card>
            );
          })}
        </div>
      )}

      <InBodyChart records={records} />

      {/* Records table */}
      <Card className="overflow-hidden">
        <div className="px-5 md:px-7 pt-5 pb-3 text-[15px] font-semibold">Todos los registros</div>
        {records.length === 0 ? (
          <div className="px-5 pb-10 pt-4 text-center text-[14px]" style={{ color: C.muted }}>
            Sin registros. Agrega tu primera medición InBody.
          </div>
        ) : (
          <div className="overflow-x-auto px-2 md:px-4 pb-3">
            <table className="w-full text-[14px] tabular" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left whitespace-nowrap font-semibold text-[12px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                    Fecha
                  </th>
                  {TABLE_COLS.map(f => (
                    <th
                      key={f.key}
                      className={`px-3 py-3 text-right whitespace-nowrap font-semibold text-[12px]${f.desktop ? ' hidden md:table-cell' : ''}`}
                      style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((rec, i, arr) => {
                  const border = i < arr.length - 1 ? `1px solid ${C.border}` : 'none';
                  return (
                    <tr key={rec.id}>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderBottom: border }}>
                        {fmtDate(rec.date)}
                      </td>
                      {TABLE_COLS.map(f => (
                        <td
                          key={f.key}
                          className={`px-3 py-2.5 text-right${f.desktop ? ' hidden md:table-cell' : ''}${f.key === 'weight' ? ' font-semibold' : ''}`}
                          style={{ borderBottom: border }}
                        >
                          {(rec[f.key] as number | undefined) ?? '—'}
                        </td>
                      ))}
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ borderBottom: border }}>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setModal(rec)} aria-label="Editar registro" title="Editar" icon={<Pencil size={15} />} style={{ border: 'none' }} />
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(rec)} aria-label="Eliminar registro" title="Eliminar" icon={<Trash2 size={15} />} style={{ border: 'none', color: C.red }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal !== null && (
        <InBodyModal
          record={modal === 'new' ? null : modal}
          personId={person}
          onSave={() => { reload(); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDeleteModal
          title="Eliminar registro"
          message="Esta acción no se puede deshacer."
          onConfirm={async () => { await api.deleteInBody(deleteTarget.id); reload(); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
