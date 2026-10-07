import { useState, useEffect } from 'react';
import { Scale, BicepsFlexed, Flame, Gauge, Target, Activity, Sun, Sunset, type LucideIcon } from 'lucide-react';
import { C } from '../theme';
import * as api from '../api';
import { getWeekStart, formatWeekLabel } from '../constants';
import type { InBodyRecord } from '../types';
import type { PageProps } from '../App';
import { InBodyChart } from '../components/InBodyChart';

function StatCard({
  label, value, unit, delta, icon: Icon, lowerIsBetter,
}: {
  label: string; value: number | undefined; unit?: string; delta?: number | null; icon: LucideIcon; lowerIsBetter?: boolean;
}) {
  const better = delta !== undefined && delta !== null ? (lowerIsBetter ? delta < 0 : delta > 0) : false;
  return (
    <div
      className="rounded-xl p-3.5 flex flex-col gap-2"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}
    >
      <div className="flex justify-between items-start">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: C.accentGlow, color: C.accent }}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
        {delta !== undefined && delta !== null && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: better ? 'rgba(34,201,122,0.12)' : 'rgba(248,113,113,0.12)',
              color:      better ? C.accent : C.red,
            }}
          >
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          </span>
        )}
      </div>
      <div>
        <span className="text-[22px] font-bold" style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}>
          {value ?? '—'}
        </span>
        {unit && <span className="text-[12px] ml-0.5" style={{ color: C.muted }}>{unit}</span>}
      </div>
      <div className="text-[11px]" style={{ color: C.muted }}>{label}</div>
    </div>
  );
}

export default function Dashboard({ person, setPage }: PageProps) {
  const [inbody,  setInbody]  = useState<InBodyRecord[]>([]);
  const [personName, setPersonName] = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

  const weekStart = getWeekStart();

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    api.getInBody(person).then(setInbody).catch(() => {});
  }, [person]);

  const latest = inbody[inbody.length - 1];
  const prev   = inbody[inbody.length - 2];
  const delta  = (key: keyof InBodyRecord) => {
    if (!latest || !prev) return null;
    const a = latest[key] as number | undefined;
    const b = prev[key]   as number | undefined;
    if (a == null || b == null) return null;
    return Math.round((a - b) * 10) / 10;
  };

  const morning = new Date().getHours() < 12;

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[1080px]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start gap-3">
        <div>
          <div className="text-[13px] mb-1 flex items-center gap-1.5" style={{ color: C.muted }}>
            {morning ? <Sun size={14} /> : <Sunset size={14} />}
            {morning ? 'Buenos días' : 'Buenas tardes'}
          </div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Panel de {personName}
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            Semana del {formatWeekLabel(weekStart)}
          </div>
        </div>
        <button
          onClick={() => setPage('inbody')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer font-medium shrink-0"
          style={{
            border:     `1px solid ${C.border2}`,
            background: C.surface2,
            color:      C.text,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Activity size={14} color={C.accent} /> Historial InBody
        </button>
      </div>

      {/* InBody stats */}
      {latest ? (
        <>
          <div
            className="text-[11px] uppercase tracking-[0.07em] mb-2.5 font-semibold"
            style={{ color: C.muted }}
          >
            Último InBody · {latest.date}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
            <StatCard icon={Scale} label="Peso Corporal"  value={latest.weight}            unit="kg"   delta={delta('weight')}            lowerIsBetter />
            <StatCard icon={BicepsFlexed} label="Masa Muscular"  value={latest.skeletalMuscleMass} unit="kg"   delta={delta('skeletalMuscleMass')} />
            <StatCard icon={Flame} label="Grasa Corporal" value={latest.bodyFatPercent}     unit="%"    delta={delta('bodyFatPercent')}     lowerIsBetter />
            <StatCard icon={Gauge} label="IMC"            value={latest.bmi}                            delta={delta('bmi')}               lowerIsBetter />
            <StatCard icon={Target} label="Grasa Visceral" value={latest.visceralFatLevel}  unit="lvl"  delta={delta('visceralFatLevel')}   lowerIsBetter />
          </div>
          <InBodyChart records={inbody} />
        </>
      ) : (
        <div
          className="rounded-xl p-6 mb-6 text-center"
          style={{ background: C.surface2, border: `1px dashed ${C.border2}` }}
        >
          <div className="text-[14px]" style={{ color: C.muted }}>
            Sin datos InBody.{' '}
            <button
              onClick={() => setPage('inbody')}
              className="border-none cursor-pointer text-[14px]"
              style={{ color: C.accent, background: 'none' }}
            >
              Agregar primer registro →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
