import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { C } from '../theme';
import type { InBodyRecord } from '../types';

Chart.register(...registerables);

const CHARTS = [
  { key: 'weight',                label: 'Peso',          color: '#22c97a', unit: 'kg' },
  { key: 'skeletalMuscleMass',    label: 'Masa Muscular', color: '#60a5fa', unit: 'kg' },
  { key: 'skeletalMusclePercent', label: '% Muscular',    color: '#a78bfa', unit: '%'  },
  { key: 'bodyFatMass',           label: 'Grasa (kg)',    color: '#fb923c', unit: 'kg' },
  { key: 'bodyFatPercent',        label: '% Grasa',       color: '#f87171', unit: '%'  },
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

  return <canvas ref={ref} style={{ height: 160 }} />;
}

// Renders nothing with fewer than 2 records — a single point isn't a trend
export function InBodyChart({ records }: { records: InBodyRecord[] }) {
  const [activeChart, setActiveChart] = useState<string>('weight');

  if (records.length < 2) return null;

  return (
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
  );
}
