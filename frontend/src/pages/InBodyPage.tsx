import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { C } from '../theme';
import * as api from '../api';
import type { InBodyRecord } from '../types';
import type { PageProps } from '../App';

Chart.register(...registerables);

const INBODY_FIELDS = [
  { key: 'weight',              label: 'Peso',            unit: 'kg',   step: 0.1  },
  { key: 'skeletalMuscleMass',  label: 'Masa Muscular',   unit: 'kg',   step: 0.1  },
  { key: 'bodyFatMass',         label: 'Masa Grasa',      unit: 'kg',   step: 0.1  },
  { key: 'bodyFatPercent',      label: '% Grasa',         unit: '%',    step: 0.1  },
  { key: 'bmi',                 label: 'IMC',             unit: '',     step: 0.1  },
  { key: 'visceralFatLevel',    label: 'Grasa Visceral',  unit: 'lvl',  step: 1    },
  { key: 'bmr',                 label: 'TMB',             unit: 'kcal', step: 1    },
  { key: 'recommendedCalories', label: 'Calorías Rec.',   unit: 'kcal', step: 1    },
  { key: 'waistHipRatio',       label: 'Cintura-Cadera',  unit: '',     step: 0.01 },
] as const;

const CHARTS = [
  { key: 'weight',             label: 'Peso',          color: '#22c97a', unit: 'kg'   },
  { key: 'skeletalMuscleMass', label: 'Masa Muscular', color: '#60a5fa', unit: 'kg'   },
  { key: 'bodyFatPercent',     label: '% Grasa',       color: '#f87171', unit: '%'    },
  { key: 'bmr',                label: 'TMB',           color: '#fbbf24', unit: 'kcal' },
] as const;

function LineChart({ records, field, color, unit }: { records: InBodyRecord[]; field: string; color: string; unit: string }) {
  const ref      = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || records.length < 2) return;
    chartRef.current?.destroy();
    const labels = records.map(r =>
      new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    );
    const data = records.map(r => (r as unknown as Record<string, number>)[field]);
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data, borderColor: color, backgroundColor: color + '18', borderWidth: 2,
          pointBackgroundColor: color, pointRadius: 4, fill: true, tension: 0.35,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: C.surface3, titleColor: C.text, bodyColor: C.muted,
            borderColor: C.border2, borderWidth: 1,
            callbacks: { label: ctx => ` ${ctx.parsed.y} ${unit}` },
          },
        },
        scales: {
          x: { grid: { color: C.border }, ticks: { color: C.muted, font: { size: 11, family: "'DM Mono'" } } },
          y: { grid: { color: C.border }, ticks: { color: C.muted, font: { size: 11, family: "'DM Mono'" } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [records, field, color, unit]);

  if (records.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[13px]"
        style={{ height: 160, color: C.muted }}
      >
        Se necesitan ≥2 registros
      </div>
    );
  }
  return <canvas ref={ref} style={{ height: 160 }} />;
}

type FieldKey = typeof INBODY_FIELDS[number]['key'];

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
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      {/* Sheet / dialog */}
      <div
        className="w-full md:max-w-[540px] max-h-[92dvh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border2}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>

        <div className="p-5 md:p-7">
          <div className="text-[17px] font-bold mb-5" style={{ color: C.text }}>
            {form.id ? 'Editar' : 'Nuevo'} Registro InBody
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Date — full width */}
            <div className="col-span-2">
              <label className="text-[12px] block mb-1" style={{ color: C.muted }}>Fecha</label>
              <input
                type="date"
                value={form.date ?? ''}
                onChange={e => set('date', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[14px]"
                style={{
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  color: C.text, boxSizing: 'border-box',
                }}
              />
            </div>

            {INBODY_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-[12px] block mb-1" style={{ color: C.muted }}>
                  {f.label}{f.unit ? ` (${f.unit})` : ''}
                </label>
                <input
                  type="number"
                  step={f.step}
                  value={(form[f.key as FieldKey] as number | undefined) ?? ''}
                  onChange={e => set(f.key, parseFloat(e.target.value) || '')}
                  className="w-full rounded-lg px-3 py-2 text-[14px]"
                  style={{
                    background:  C.surface2, border: `1px solid ${C.border2}`,
                    color:       C.text, fontFamily: "'DM Mono', monospace",
                    boxSizing:   'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-[9px] text-[14px] cursor-pointer min-h-[44px]"
              style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-[9px] text-[14px] font-semibold cursor-pointer min-h-[44px]"
              style={{ border: 'none', background: C.accent, color: '#000' }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InBodyPage({ person }: PageProps) {
  const [records,     setRecords]     = useState<InBodyRecord[]>([]);
  const [modal,       setModal]       = useState<Partial<InBodyRecord> | null | 'new'>(null);
  const [activeChart, setActiveChart] = useState<string>('weight');
  const [personName,  setPersonName]  = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

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
    <div className="px-4 py-6 md:px-8 md:py-7">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Historial InBody
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {personName} · {records.length} registro{records.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer shrink-0 min-h-[44px]"
          style={{ border: 'none', background: C.accent, color: '#000' }}
        >
          + Agregar
        </button>
      </div>

      {/* Trend cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
          {([
            { key: 'weight',              label: 'Peso',         unit: 'kg',   lb: true  },
            { key: 'skeletalMuscleMass',  label: 'Músculo',      unit: 'kg',   lb: false },
            { key: 'bodyFatPercent',      label: '% Grasa',      unit: '%',    lb: true  },
            { key: 'visceralFatLevel',    label: 'Gr. Visceral', unit: 'lvl',  lb: true  },
            { key: 'bmr',                label: 'TMB',           unit: 'kcal', lb: false },
            { key: 'recommendedCalories', label: 'Cal. Rec.',    unit: 'kcal', lb: false },
          ] as { key: FieldKey; label: string; unit: string; lb: boolean }[]).map(f => {
            const d = delta(f.key);
            const better = d != null ? (f.lb ? d < 0 : d > 0) : false;
            return (
              <div
                key={f.key}
                className="rounded-xl p-3.5"
                style={{ background: C.surface2, border: `1px solid ${C.border}` }}
              >
                <div className="text-[11px] mb-1.5" style={{ color: C.muted }}>{f.label}</div>
                <div className="text-[22px] font-bold" style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}>
                  {(latest[f.key] as number | undefined) ?? '—'}
                  <span className="text-[12px] font-normal ml-0.5" style={{ color: C.muted }}> {f.unit}</span>
                </div>
                {d != null && (
                  <div className="text-[11px] mt-1" style={{ color: better ? C.accent : C.red }}>
                    {d > 0 ? '+' : ''}{d} {f.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {records.length >= 2 && (
        <div
          className="rounded-[14px] p-4 md:p-5 mb-6"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          <div className="flex gap-2 mb-4 flex-wrap">
            {CHARTS.map(ch => (
              <button
                key={ch.key}
                onClick={() => setActiveChart(ch.key)}
                className="px-3.5 py-1.5 rounded-full text-[12px] cursor-pointer min-h-[36px]"
                style={{
                  border:     `1px solid ${activeChart === ch.key ? ch.color : C.border}`,
                  background: activeChart === ch.key ? ch.color + '20' : 'transparent',
                  color:      activeChart === ch.key ? ch.color : C.muted,
                  fontWeight: activeChart === ch.key ? 600 : 400,
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>
          {CHARTS.filter(c => c.key === activeChart).map(ch => (
            <div key={ch.key} className="relative" style={{ height: 200 }}>
              <LineChart records={records} field={ch.key} color={ch.color} unit={ch.unit} />
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}
      >
        <div
          className="px-5 py-3.5 text-[13px] font-semibold"
          style={{ borderBottom: `1px solid ${C.border}`, color: C.text }}
        >
          Todos los Registros
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-[14px]" style={{ color: C.muted }}>
            Sin registros. Agrega tu primera medición InBody.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ background: C.surface3 }}>
                  <th
                    className="px-4 py-2.5 text-left whitespace-nowrap font-medium"
                    style={{ color: C.muted }}
                  >
                    Fecha
                  </th>
                  {INBODY_FIELDS.slice(0, 6).map(f => (
                    <th
                      key={f.key}
                      className="px-3 py-2.5 text-right whitespace-nowrap font-medium"
                      style={{ color: C.muted }}
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((rec, i) => (
                  <tr
                    key={rec.id}
                    style={{
                      borderTop:  `1px solid ${C.border}`,
                      background: i % 2 === 0 ? 'transparent' : C.surface3 + '40',
                    }}
                  >
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}
                    >
                      {rec.date}
                    </td>
                    {INBODY_FIELDS.slice(0, 6).map(f => (
                      <td
                        key={f.key}
                        className="px-3 py-3 text-right"
                        style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}
                      >
                        {(rec[f.key as FieldKey] as number | undefined) ?? '—'}
                      </td>
                    ))}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setModal(rec)}
                        className="mr-1.5 px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
                        style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={async () => { if (confirm('¿Eliminar registro?')) { await api.deleteInBody(rec.id); reload(); } }}
                        className="px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
                        style={{ border: `1px solid ${C.red}22`, background: 'none', color: C.red }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <InBodyModal
          record={modal === 'new' ? null : modal}
          personId={person}
          onSave={() => { reload(); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
