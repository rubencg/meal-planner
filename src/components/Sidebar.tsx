import { useEffect, useState } from 'react';
import { C } from '../theme';
import * as api from '../api';
import type { Person } from '../types';

type Page = 'dashboard' | 'inbody' | 'proteinas' | 'plannutri' | 'planner' | 'compras';

const NAV: { id: Page; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard', label: 'Panel Principal', shortLabel: 'Panel',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'inbody', label: 'Historial InBody', shortLabel: 'InBody',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    id: 'proteinas', label: 'Proteínas', shortLabel: 'Proteínas',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  },
  {
    id: 'plannutri', label: 'Plan Nutricional', shortLabel: 'Plan',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>,
  },
  {
    id: 'planner', label: 'Planificador', shortLabel: 'Semana',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    id: 'compras', label: 'Lista de Compras', shortLabel: 'Compras',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  },
];

interface SidebarProps {
  page:      Page;
  setPage:   (p: Page) => void;
  person:    string;
  setPerson: (id: string) => void;
}

export default function Sidebar({ page, setPage, person, setPerson }: SidebarProps) {
  const [persons, setPersons] = useState<Person[]>([
    { id: 'ruben', name: 'Ruben' },
    { id: 'sarahi', name: 'Sarahi' },
  ]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api.getPersons().then(setPersons).catch(() => {});
  }, []);

  // Close drawer on page navigation
  const handleSetPage = (p: Page) => {
    setPage(p);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <aside
        className="hidden md:flex flex-col h-dvh sticky top-0 z-10 w-[232px] min-w-[232px]"
        style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] py-[22px]" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[18px] shrink-0" style={{ background: C.accent }}>
            🌴
          </div>
          <div>
            <div className="font-bold text-[16px] tracking-[-0.3px]" style={{ color: C.text }}>Tiki</div>
            <div className="text-[10px] uppercase tracking-[0.06em]" style={{ color: C.muted }}>Planificador de Comidas</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2.5">
          {NAV.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSetPage(item.id)}
                className="flex items-center gap-2.5 w-full px-3 py-[9px] rounded-lg mb-0.5 text-left text-[13px] cursor-pointer border-none transition-all duration-150"
                style={{
                  background:  active ? C.accentGlow : 'transparent',
                  color:       active ? C.accent : C.muted,
                  fontFamily:  "'DM Sans', sans-serif",
                  fontWeight:  active ? 600 : 400,
                }}
              >
                <span className="shrink-0" style={{ opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {active && <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: C.accent }} />}
              </button>
            );
          })}
        </nav>

        {/* Person switcher */}
        <div className="px-2 pb-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-[0.08em] mb-2 pl-1" style={{ color: C.dim }}>Persona Activa</div>
          <div className="flex gap-1.5">
            {persons.map(p => (
              <button
                key={p.id}
                onClick={() => setPerson(p.id)}
                className="flex-1 py-2 px-1 rounded-[9px] cursor-pointer text-[13px] transition-all duration-150"
                style={{
                  border:      `1px solid ${person === p.id ? C.accent : C.border}`,
                  background:  person === p.id ? C.accentGlow : 'transparent',
                  color:       person === p.id ? C.accent : C.muted,
                  fontFamily:  "'DM Sans', sans-serif",
                  fontWeight:  person === p.id ? 600 : 400,
                }}
              >
                <div className="text-[20px] mb-0.5">{p.id === 'ruben' ? '🧔' : '👩'}</div>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV (< md) ── */}
      {/* Show only 5 items: dashboard, planner, compras, proteinas + hamburger for rest */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}`, height: 64 }}
      >
        {/* Primary 5 nav items */}
        {[NAV[0], NAV[4], NAV[5], NAV[2], NAV[3]].map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSetPage(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full border-none cursor-pointer transition-all duration-150 min-w-0"
              style={{ background: 'transparent', color: active ? C.accent : C.muted }}
            >
              <span style={{ opacity: active ? 1 : 0.55 }}>{item.icon}</span>
              <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* More / InBody button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full border-none cursor-pointer transition-all duration-150"
          style={{ background: 'transparent', color: page === 'inbody' ? C.accent : C.muted }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: page === 'inbody' ? 1 : 0.55 }}>
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
          <span className="text-[9px] font-medium leading-none">Más</span>
        </button>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
            style={{ background: C.surface, border: `1px solid ${C.border2}` }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
            </div>

            {/* Logo row */}
            <div className="flex items-center gap-2.5 px-5 pt-2 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base shrink-0" style={{ background: C.accent }}>
                🌴
              </div>
              <div>
                <div className="font-bold text-[15px]" style={{ color: C.text }}>Tiki</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Planificador de Comidas</div>
              </div>
            </div>

            {/* Full nav list */}
            <div className="px-3 py-2">
              {NAV.map(item => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetPage(item.id)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl mb-1 text-left text-[14px] cursor-pointer border-none transition-all duration-150"
                    style={{
                      background: active ? C.accentGlow : 'transparent',
                      color:      active ? C.accent : C.muted,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span style={{ opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {active && <div className="w-2 h-2 rounded-full" style={{ background: C.accent }} />}
                  </button>
                );
              })}
            </div>

            {/* Person switcher */}
            <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="text-[10px] uppercase tracking-[0.08em] mb-2 px-1 pt-2" style={{ color: C.dim }}>Persona Activa</div>
              <div className="flex gap-2">
                {persons.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPerson(p.id); setDrawerOpen(false); }}
                    className="flex-1 py-3 px-2 rounded-xl cursor-pointer text-[14px] transition-all duration-150"
                    style={{
                      border:     `1px solid ${person === p.id ? C.accent : C.border}`,
                      background: person === p.id ? C.accentGlow : 'transparent',
                      color:      person === p.id ? C.accent : C.muted,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: person === p.id ? 600 : 400,
                    }}
                  >
                    <div className="text-[24px] mb-1">{p.id === 'ruben' ? '🧔' : '👩'}</div>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  );
}
