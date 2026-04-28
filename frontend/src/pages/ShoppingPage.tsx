// TODO: include carb foods in the shopping aggregation (PlannerCarb -> CarbFood).
import { useState, useEffect, useMemo } from 'react';
import { C } from '../theme';
import * as api from '../api';
import { getWeekStart, formatWeekLabel, rawWeight, DAY_LABELS, SLOT_ICONS } from '../constants';
import type { Protein, PlannerEntry, WeekDay, MealSlot } from '../types';
import type { PageProps } from '../App';

export default function ShoppingPage(_props: PageProps) {
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem('tiki_week') || getWeekStart());
  const [entries,   setEntries]   = useState<PlannerEntry[]>([]);
  const [proteins,  setProteins]  = useState<Protein[]>([]);
  const [persons,   setPersons]   = useState([{ id: 'ruben', name: 'Ruben' }, { id: 'sarahi', name: 'Sarahi' }]);
  const [have,      setHave]      = useState<string[]>([]);
  const [viewMode,  setViewMode]  = useState<'all' | string>('all');

  const reload = () => {
    api.getWeek(weekStart).then(setEntries).catch(() => {});
    api.getHave(weekStart).then(setHave).catch(() => {});
  };

  useEffect(() => {
    api.getPersons().then(setPersons).catch(() => {});
    api.getProteins().then(setProteins).catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [weekStart]);

  const aggregated = useMemo(() => {
    const filtered = viewMode === 'all' ? entries : entries.filter(e => e.personId === viewMode);
    const map: Record<string, {
      protein:      Protein;
      totalRaw:     number;
      totalCooked:  number;
      slots:        { day: WeekDay; slot: MealSlot; personId: string; cookedGrams: number; rawG: number }[];
    }> = {};
    filtered.forEach(e => {
      if (!e.proteinId) return;
      const prot = proteins.find(p => p.id === e.proteinId);
      if (!prot) return;
      const rawG = rawWeight(e.cookedGrams ?? 0, prot.lossPercent);
      if (!map[e.proteinId]) map[e.proteinId] = { protein: prot, totalRaw: 0, totalCooked: 0, slots: [] };
      map[e.proteinId].totalRaw    += rawG;
      map[e.proteinId].totalCooked += e.cookedGrams ?? 0;
      map[e.proteinId].slots.push({ day: e.day, slot: e.slot, personId: e.personId, cookedGrams: e.cookedGrams ?? 0, rawG });
    });
    return Object.values(map).sort((a, b) => b.totalRaw - a.totalRaw);
  }, [entries, proteins, viewMode]);

  const haveSet   = new Set(have);
  const haveCount = aggregated.filter(i => haveSet.has(i.protein.id)).length;

  const toggleHave = async (id: string) => {
    const next = haveSet.has(id) ? have.filter(h => h !== id) : [...have, id];
    setHave(next);
    await api.toggleHave(weekStart, id, !haveSet.has(id));
  };

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + dir * 7);
    const ws = d.toISOString().split('T')[0];
    setWeekStart(ws); localStorage.setItem('tiki_week', ws);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[800px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Lista de Compras
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {formatWeekLabel(weekStart)} · {aggregated.length} proteínas · {haveCount} en carrito
          </div>
        </div>
        {/* Week nav */}
        <div className="flex gap-1.5">
          <button
            onClick={() => shiftWeek(-1)}
            className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            ← Ant.
          </button>
          <button
            onClick={() => { const ws = getWeekStart(); setWeekStart(ws); localStorage.setItem('tiki_week', ws); }}
            className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Esta Semana
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="px-3 py-2 rounded-[9px] text-[13px] cursor-pointer min-h-[40px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Sig. →
          </button>
        </div>
      </div>

      {/* Person filter */}
      <div
        className="flex gap-1.5 mb-4 p-1 rounded-[10px] w-fit"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}
      >
        {[{ id: 'all', name: 'Todos' }, ...persons].map(p => (
          <button
            key={p.id}
            onClick={() => setViewMode(p.id)}
            className="px-4 py-1.5 rounded-[7px] text-[13px] cursor-pointer transition-all duration-150 min-h-[36px]"
            style={{
              border:     'none',
              background: viewMode === p.id ? C.accent : 'none',
              color:      viewMode === p.id ? '#000' : C.muted,
              fontWeight: viewMode === p.id ? 600 : 400,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {aggregated.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between mb-1.5 text-[12px]" style={{ color: C.muted }}>
            <span>Progreso de compra</span>
            <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>
              {haveCount}/{aggregated.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface3 }}>
            <div
              className="h-full rounded-full transition-all duration-[400ms]"
              style={{
                width:      `${aggregated.length ? (haveCount / aggregated.length) * 100 : 0}%`,
                background: C.accent,
              }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {aggregated.length === 0 ? (
        <div
          className="text-center py-12 px-5 rounded-[14px]"
          style={{ background: C.surface2, border: `1px dashed ${C.border2}` }}
        >
          <div className="text-[32px] mb-3">🛒</div>
          <div className="text-[15px] font-semibold mb-2" style={{ color: C.text }}>
            Sin items esta semana
          </div>
          <div className="text-[13px]" style={{ color: C.muted }}>
            Asigna proteínas en el Planificador para generar tu lista automáticamente.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Summary card */}
          <div
            className="rounded-xl p-4 mb-1.5"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.06em] mb-2"
              style={{ color: C.muted }}
            >
              Resumen de la semana
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <span
                  className="text-[20px] font-bold"
                  style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}
                >
                  {aggregated.reduce((s, i) => s + i.totalRaw, 0)}g
                </span>
                <span className="text-[12px] ml-1" style={{ color: C.muted }}>total crudo a comprar</span>
              </div>
              <div>
                <span
                  className="text-[20px] font-bold"
                  style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}
                >
                  {aggregated.reduce((s, i) => s + i.totalCooked, 0)}g
                </span>
                <span className="text-[12px] ml-1" style={{ color: C.muted }}>proteína cocida total</span>
              </div>
            </div>
          </div>

          {/* Per-protein rows */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            {aggregated.map((item, i) => {
              const checked = haveSet.has(item.protein.id);
              return (
                <div
                  key={item.protein.id}
                  style={{
                    borderTop:  i > 0 ? `1px solid ${C.border}` : 'none',
                    background: checked ? `${C.accent}06` : 'transparent',
                  }}
                >
                  {/* Main row — full tap target */}
                  <div
                    onClick={() => toggleHave(item.protein.id)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 min-h-[64px]"
                  >
                    {/* Checkbox */}
                    <div
                      className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        border:     `2px solid ${checked ? C.accent : C.border2}`,
                        background: checked ? C.accent : 'none',
                      }}
                    >
                      {checked && <span className="text-[13px] font-bold" style={{ color: '#000' }}>✓</span>}
                    </div>

                    {/* Name + notes */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[14px] font-semibold truncate transition-all duration-150"
                        style={{
                          color:           checked ? C.muted : C.text,
                          textDecoration:  checked ? 'line-through' : 'none',
                        }}
                      >
                        {item.protein.name}
                      </div>
                      {item.protein.notes && (
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: C.dim }}>
                          {item.protein.notes}
                        </div>
                      )}
                    </div>

                    {/* Weight */}
                    <div className="text-right shrink-0">
                      <div
                        className="text-[17px] font-bold"
                        style={{
                          color:      checked ? C.muted : C.yellow,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {item.totalRaw}g
                      </div>
                      <div className="text-[11px]" style={{ color: C.dim }}>
                        crudo · {item.totalCooked}g coc.
                      </div>
                    </div>
                  </div>

                  {/* Slot breakdown chips */}
                  {item.slots.length > 0 && (
                    <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                      {item.slots.map((sl, j) => {
                        const pName = persons.find(p => p.id === sl.personId)?.name ?? sl.personId;
                        return (
                          <div
                            key={j}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: C.surface3,
                              color:      C.muted,
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            {DAY_LABELS[sl.day]} {SLOT_ICONS[sl.slot]} {sl.cookedGrams}g ({sl.rawG}g) {pName}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
