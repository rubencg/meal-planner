import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { cssVar } from '../theme';
import { useThemeMode } from '../themeMode';
import type { InBodyRecord } from '../types';
import { Card, Segmented } from './ui';

Chart.register(...registerables);

export const TREND_METRICS = [
  { key: 'weight',                label: 'Peso',     unit: 'kg' },
  { key: 'skeletalMuscleMass',    label: 'Músculo',  unit: 'kg' },
  { key: 'skeletalMusclePercent', label: '% Músculo', unit: '%' },
  { key: 'bodyFatMass',           label: 'Grasa kg', unit: 'kg' },
  { key: 'bodyFatPercent',        label: 'Grasa %',  unit: '%'  },
] as const;

export type TrendKey = typeof TREND_METRICS[number]['key'];

/** Ink line over a lime area — colors are read from the active theme. */
export function TrendChart({
  records, field, unit, height = 200, compact = false,
}: { records: InBodyRecord[]; field: TrendKey; unit: string; height?: number; compact?: boolean }) {
  const ref      = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const mode     = useThemeMode();

  useEffect(() => {
    if (!ref.current || records.length < 2) return;
    chartRef.current?.destroy();

    const ink    = cssVar('text');
    const muted  = cssVar('muted');
    const accent = cssVar('accent');
    const grid   = cssVar('border');
    const card   = cssVar('surface');
    const tick   = { color: muted, font: { size: 11, family: "'Geist Mono'" } };

    const labels = records.map(r =>
      new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    );
    const data = records.map(r => (r as unknown as Record<string, number>)[field]);

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: ink,
          backgroundColor: accent + (mode === 'dark' ? '33' : '8C'),
          borderWidth: 2.5,
          pointBackgroundColor: accent,
          pointBorderColor: ink,
          pointBorderWidth: 2,
          pointRadius: compact ? 0 : 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ink, titleColor: card, bodyColor: card,
            padding: 10, cornerRadius: 12, displayColors: false,
            titleFont: { family: "'Geist'" }, bodyFont: { family: "'Geist Mono'", size: 13 },
            callbacks: { label: ctx => `${ctx.parsed.y} ${unit}` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: tick },
          y: {
            display: !compact,
            grid: { color: grid }, border: { display: false },
            ticks: { ...tick, maxTicksLimit: 5 },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [records, field, unit, mode, compact]);

  return (
    <div className="relative" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
}

// Renders nothing with fewer than 2 records — a single point isn't a trend
export function InBodyChart({ records }: { records: InBodyRecord[] }) {
  const [active, setActive] = useState<TrendKey>('weight');

  if (records.length < 2) return null;
  const metric = TREND_METRICS.find(m => m.key === active)!;

  return (
    <Card className="p-5 md:p-7 mb-4 md:mb-5">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="text-[16px] font-semibold">Tendencia</div>
        <Segmented
          options={TREND_METRICS.map(m => ({ value: m.key, label: m.label }))}
          value={active}
          onChange={setActive}
        />
      </div>
      <TrendChart records={records} field={active} unit={metric.unit} height={240} />
    </Card>
  );
}
