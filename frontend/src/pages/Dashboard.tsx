import { useState, useEffect } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { C } from '../theme';
import * as api from '../api';
import { getWeekStart, formatWeekLabel } from '../constants';
import type { InBodyRecord } from '../types';
import type { PageProps } from '../App';
import { TrendChart, type TrendKey } from '../components/InBodyChart';
import { BigNumber, Button, Card, DeltaPill, PageHeader, Segmented, useIsMobile } from '../components/ui';

type NumKey = keyof Pick<InBodyRecord,
  'weight' | 'skeletalMuscleMass' | 'skeletalMusclePercent' | 'bodyFatMass' | 'bodyFatPercent' | 'bmi' | 'visceralFatLevel'>;

const HERO_METRICS: { key: TrendKey & NumKey; tab: string; label: string; unit: string; lowerIsBetter: boolean }[] = [
  { key: 'weight',             tab: 'Peso',    label: 'Peso corporal', unit: 'kg', lowerIsBetter: true  },
  { key: 'skeletalMuscleMass', tab: 'Músculo', label: 'Masa muscular', unit: 'kg', lowerIsBetter: false },
  { key: 'bodyFatPercent',     tab: 'Grasa %', label: 'Grasa corporal', unit: '%', lowerIsBetter: true  },
];

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', opts);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function StatCard({
  label, value, unit, delta, lowerIsBetter, tone = 'surface', footer,
}: {
  label: string; value: number | undefined; unit?: string; delta: number | null;
  lowerIsBetter?: boolean; tone?: 'surface' | 'accent' | 'ink'; footer?: React.ReactNode;
}) {
  const onAccent = tone === 'accent';
  const isMobile = useIsMobile();
  return (
    <Card tone={tone} className="p-4 md:p-[22px] flex flex-col justify-between gap-4 min-h-[132px] md:min-h-[182px]">
      <div className="flex justify-between items-center gap-2">
        <span className="text-[13px] md:text-[14px] font-semibold">{label}</span>
        {delta != null && (
          tone === 'ink'
            ? <span className="text-[13px] font-semibold tabular" style={{ color: C.accent }}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}</span>
            : <DeltaPill delta={delta} lowerIsBetter={lowerIsBetter} onAccent={onAccent} />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <BigNumber
          value={value ?? '—'}
          unit={unit}
          size={isMobile ? 38 : 56}
          unitColor={tone === 'surface' ? C.muted : tone === 'ink' ? C.inkMuted : undefined}
        />
        {footer}
      </div>
    </Card>
  );
}

/** 20-segment meter for the InBody visceral fat level (1–20). */
function VisceralMeter({ level }: { level: number }) {
  const filled = Math.max(0, Math.min(20, Math.round(level)));
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }} aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className="h-2 rounded-[2px]" style={{ background: i < filled ? C.accent : C.inkTrack }} />
      ))}
    </div>
  );
}

export default function Dashboard({ person, setPage }: PageProps) {
  const [inbody,     setInbody]     = useState<InBodyRecord[]>([]);
  const [personName, setPersonName] = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');
  const [heroKey,    setHeroKey]    = useState<TrendKey & NumKey>('weight');

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
  const delta  = (key: NumKey) => {
    if (!latest || !prev) return null;
    const a = latest[key];
    const b = prev[key];
    if (a == null || b == null) return null;
    return Math.round((a - b) * 10) / 10;
  };

  const hero  = HERO_METRICS.find(m => m.key === heroKey)!;
  const heroD = delta(hero.key);
  const today = capitalize(new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }));
  const isMobile = useIsMobile();

  return (
    <div className="px-4 py-5 md:px-12 md:py-10 max-w-[1240px]">
      <PageHeader
        eyebrow={<>{today} · Semana del {formatWeekLabel(weekStart)}</>}
        title={`Hola, ${personName}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPage('inbody')} className="hidden sm:inline-flex">Ver historial</Button>
            <Button variant="primary" onClick={() => setPage('inbody')} icon={<Plus size={16} strokeWidth={2.5} style={{ color: C.primaryIcon }} />}>
              Nuevo InBody
            </Button>
          </>
        }
      />

      {latest ? (
        <>
          <div className="text-[13px] font-semibold mb-3" style={{ color: C.muted }}>
            Último InBody · {fmtDate(latest.date)}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 mb-4 md:mb-5">
            {/* Hero: selected metric with its trend */}
            <Card className="col-span-2 lg:row-span-2 p-5 md:p-7 flex flex-col gap-5 min-h-[300px] md:min-h-[380px]">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <span className="text-[14px] md:text-[15px] font-semibold">{hero.label}</span>
                <Segmented
                  options={HERO_METRICS.map(m => ({ value: m.key, label: m.tab }))}
                  value={heroKey}
                  onChange={setHeroKey}
                />
              </div>
              <div className="flex flex-wrap items-end gap-3 md:gap-4">
                <BigNumber value={latest[hero.key] ?? '—'} unit={hero.unit} size={isMobile ? 72 : 104} unitColor={C.muted} />
                {heroD != null && prev && (
                  <span className="mb-1.5">
                    <DeltaPill delta={heroD} unit={hero.unit} lowerIsBetter={hero.lowerIsBetter} />
                    <span className="text-[12px] ml-2" style={{ color: C.muted }}>
                      vs. {fmtDate(prev.date, { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-auto">
                {inbody.length >= 2
                  ? <TrendChart records={inbody} field={hero.key} unit={hero.unit} height={isMobile ? 120 : 170} compact />
                  : <div className="text-[13px]" style={{ color: C.muted }}>Agrega otro registro para ver la tendencia.</div>}
              </div>
            </Card>

            <StatCard tone="accent" label="Grasa corporal" value={latest.bodyFatPercent}     unit="%"  delta={delta('bodyFatPercent')}     lowerIsBetter />
            <StatCard                label="Masa muscular" value={latest.skeletalMuscleMass} unit="kg" delta={delta('skeletalMuscleMass')} />
            <StatCard                label="IMC"           value={latest.bmi}                          delta={delta('bmi')}                lowerIsBetter />
            <StatCard
              tone="ink"
              label="Grasa visceral"
              value={latest.visceralFatLevel}
              unit="nivel"
              delta={delta('visceralFatLevel')}
              lowerIsBetter
              footer={latest.visceralFatLevel != null && <VisceralMeter level={latest.visceralFatLevel} />}
            />
          </div>

          {/* Recent records */}
          <Card className="px-5 md:px-7 pt-2 pb-3">
            <div className="flex justify-between items-center py-4">
              <span className="text-[15px] font-semibold">Registros recientes</span>
              <button
                type="button"
                onClick={() => setPage('inbody')}
                className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer border-none bg-transparent min-h-[44px]"
                style={{ color: C.text }}
              >
                Ver todos <ArrowRight size={15} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] tabular" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr>
                    {['Fecha', 'Peso', 'Músculo', 'Grasa'].map(h => (
                      <th key={h} className="text-left font-semibold text-[12px] py-3" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...inbody].reverse().slice(0, 3).map((r, i, arr) => {
                    const border = i < arr.length - 1 ? `1px solid ${C.border}` : 'none';
                    return (
                      <tr key={r.id}>
                        <td className="py-3" style={{ borderBottom: border }}>{fmtDate(r.date)}</td>
                        <td className="py-3 font-semibold" style={{ borderBottom: border }}>{r.weight ?? '—'} kg</td>
                        <td className="py-3" style={{ borderBottom: border }}>{r.skeletalMuscleMass ?? '—'} kg</td>
                        <td className="py-3" style={{ borderBottom: border }}>{r.bodyFatPercent ?? '—'} %</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 md:p-12 flex flex-col items-center text-center gap-4" style={{ border: `1px dashed ${C.border2}` }}>
          <div className="text-[15px]" style={{ color: C.muted }}>Aún no hay registros InBody para {personName}.</div>
          <Button variant="accent" onClick={() => setPage('inbody')} icon={<Plus size={16} strokeWidth={2.5} />}>
            Agregar primer registro
          </Button>
        </Card>
      )}
    </div>
  );
}
