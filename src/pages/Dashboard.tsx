import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { getWeekStart, formatWeekLabel, rawWeight, DAYS, DAY_LABELS, DAY_FULL, todayKey } from '../constants';
import type { InBodyRecord, MealPlan, PlannerEntry } from '../types';
import type { PageProps } from '../App';

function MacroRing({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct  = target > 0 ? Math.min(value / target, 1) : 0;
  const r = 28, cx = 34, cy = 34, stroke = 5;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="68" height="68">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.surface3} strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill={C.text} fontSize="12" fontWeight="600" fontFamily="'DM Mono', monospace">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="text-center">
        <div className="text-[12px] font-semibold" style={{ color: C.text }}>
          {value}<span className="font-normal" style={{ color: C.muted }}>/{target}g</span>
        </div>
        <div className="text-[11px]" style={{ color: C.muted }}>{label}</div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, unit, delta, icon, lowerIsBetter,
}: {
  label: string; value: number | undefined; unit?: string; delta?: number | null; icon: string; lowerIsBetter?: boolean;
}) {
  const better = delta !== undefined && delta !== null ? (lowerIsBetter ? delta < 0 : delta > 0) : false;
  return (
    <div
      className="rounded-xl p-3.5 flex flex-col gap-2"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}
    >
      <div className="flex justify-between items-start">
        <span className="text-lg">{icon}</span>
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
  const [plan,    setPlan]    = useState<MealPlan>({ personId: person, slots: {} });
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [personName, setPersonName] = useState(person === 'ruben' ? 'Ruben' : 'Sarahi');

  const weekStart = getWeekStart();

  useEffect(() => {
    api.getPersons().then(ps => {
      const p = ps.find(x => x.id === person);
      if (p) setPersonName(p.name);
    }).catch(() => {});
    api.getInBody(person).then(setInbody).catch(() => {});
    api.getMealPlan(person).then(setPlan).catch(() => {});
    api.getWeek(weekStart).then(es => setEntries(es.filter(e => e.personId === person))).catch(() => {});
  }, [person, weekStart]);

  const latest = inbody[inbody.length - 1];
  const prev   = inbody[inbody.length - 2];
  const delta  = (key: keyof InBodyRecord) => {
    if (!latest || !prev) return null;
    const a = latest[key] as number | undefined;
    const b = prev[key]   as number | undefined;
    if (a == null || b == null) return null;
    return Math.round((a - b) * 10) / 10;
  };

  const today = todayKey();
  const todayEntries = today ? entries.filter(e => e.day === today && e.proteinId) : [];
  const todayCookedProtein = todayEntries.reduce((s, e) => s + (e.cookedGrams ?? 0), 0);

  const totalProtein = Object.values(plan.slots ?? {}).reduce((s, sl) => s + (sl?.protein ?? 0), 0);
  const totalCarbs   = Object.values(plan.slots ?? {}).reduce((s, sl) => s + (sl?.carbs   ?? 0), 0);
  const planDailyProtein = totalProtein;

  const dayTotals = DAYS.map(day => {
    const dayEntries = entries.filter(e => e.day === day && e.proteinId);
    const totalCooked = dayEntries.reduce((s, e) => s + (e.cookedGrams ?? 0), 0);
    return { day, totalCooked };
  });

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[1080px]">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[13px] mb-1" style={{ color: C.muted }}>
          {new Date().getHours() < 12 ? 'Buenos días' : 'Buenas tardes'} 👋
        </div>
        <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
          Panel de {personName}
        </h1>
        <div className="text-[13px] mt-1" style={{ color: C.muted }}>
          Semana del {formatWeekLabel(weekStart)}
        </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            <StatCard icon="⚖️"  label="Peso Corporal"  value={latest.weight}            unit="kg"   delta={delta('weight')}            lowerIsBetter />
            <StatCard icon="💪"  label="Masa Muscular"  value={latest.skeletalMuscleMass} unit="kg"   delta={delta('skeletalMuscleMass')} />
            <StatCard icon="🔥"  label="Grasa Corporal" value={latest.bodyFatPercent}     unit="%"    delta={delta('bodyFatPercent')}     lowerIsBetter />
            <StatCard icon="📊"  label="IMC"            value={latest.bmi}                            delta={delta('bmi')}               lowerIsBetter />
            <StatCard icon="🫀"  label="TMB"            value={latest.bmr}               unit="kcal" />
            <StatCard icon="🎯"  label="Grasa Visceral" value={latest.visceralFatLevel}  unit="lvl"  delta={delta('visceralFatLevel')}   lowerIsBetter />
          </div>
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

      {/* Middle row: macros + weekly chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Today macro targets */}
        <div
          className="rounded-[14px] p-4 md:p-[18px]"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          <div className="flex justify-between items-center mb-3.5">
            <div className="text-[14px] font-semibold" style={{ color: C.text }}>Metas de Hoy</div>
            <div className="text-[12px] capitalize" style={{ color: C.muted }}>
              {today ? DAY_FULL[today] : 'Fin de semana'}
            </div>
          </div>
          {totalProtein > 0 ? (
            <div className="flex justify-around flex-wrap gap-2.5">
              <MacroRing label="Proteína" value={Math.round(todayCookedProtein)} target={totalProtein} color={C.accent} />
              <MacroRing label="Carbos"   value={0}                              target={totalCarbs}   color={C.blue}  />
            </div>
          ) : (
            <div className="text-center py-3.5 text-[13px]" style={{ color: C.muted }}>
              Sin plan configurado.{' '}
              <button
                onClick={() => setPage('plannutri')}
                className="border-none cursor-pointer text-[13px]"
                style={{ color: C.accent, background: 'none' }}
              >
                Configurar →
              </button>
            </div>
          )}
        </div>

        {/* Weekly protein bar chart */}
        <div
          className="rounded-[14px] p-4 md:p-[18px]"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          <div className="text-[14px] font-semibold mb-3.5" style={{ color: C.text }}>
            Proteína Semanal (g cocida)
          </div>
          <div className="flex items-end gap-2 h-20">
            {dayTotals.map(({ day, totalCooked }) => {
              const h = planDailyProtein > 0 ? Math.max((totalCooked / planDailyProtein) * 64, totalCooked > 0 ? 6 : 0) : 0;
              const isToday = day === today;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="text-[9px]"
                    style={{ color: C.muted, fontFamily: "'DM Mono', monospace" }}
                  >
                    {totalCooked > 0 ? totalCooked : ''}
                  </div>
                  <div
                    className="w-full rounded-t-[3px] transition-all duration-[400ms] ease-out"
                    style={{
                      height:     Math.max(h, 0),
                      background: isToday ? C.accent : totalCooked > 0 ? C.accent + '88' : C.surface3,
                    }}
                  />
                  <div
                    className="text-[10px]"
                    style={{ color: isToday ? C.accent : C.muted, fontWeight: isToday ? 600 : 400 }}
                  >
                    {DAY_LABELS[day]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div
        className="text-[11px] uppercase tracking-[0.07em] mb-2.5 font-semibold"
        style={{ color: C.muted }}
      >
        Acciones Rápidas
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Planificar Semana', icon: '📅', page: 'planner'   as const },
          { label: 'Ver Proteínas',     icon: '🥩', page: 'proteinas' as const },
          { label: 'Lista de Compras',  icon: '🛒', page: 'compras'   as const },
          { label: 'Historial InBody',  icon: '📈', page: 'inbody'    as const },
        ].map(a => (
          <button
            key={a.page}
            onClick={() => setPage(a.page)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] cursor-pointer font-medium transition-all duration-150"
            style={{
              border:     `1px solid ${C.border2}`,
              background: C.surface2,
              color:      C.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
