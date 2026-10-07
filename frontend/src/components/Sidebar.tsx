import { useEffect, useState } from 'react';
import { LayoutGrid, Activity, Wheat, ClipboardList, Sun, Moon, type LucideIcon } from 'lucide-react';
import { C, FONT } from '../theme';
import { setThemeMode, useThemeMode } from '../themeMode';
import * as api from '../api';
import type { Person } from '../types';

type Page = 'dashboard' | 'inbody' | 'carbos' | 'plannutri';

const NAV: { id: Page; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Panel',            shortLabel: 'Panel',  icon: LayoutGrid },
  { id: 'inbody',    label: 'Historial InBody', shortLabel: 'InBody', icon: Activity },
  { id: 'carbos',    label: 'Carbohidratos',    shortLabel: 'Carbos', icon: Wheat },
  { id: 'plannutri', label: 'Plan Nutricional', shortLabel: 'Plan',   icon: ClipboardList },
];

interface SidebarProps {
  page:      Page;
  setPage:   (p: Page) => void;
  person:    string;
  setPerson: (id: string) => void;
}

function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/favicon.svg" alt="" className="shrink-0" style={{ width: size, height: size }} />
      <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: size * 0.55, letterSpacing: '-0.5px', color: C.text }}>
        tiki
      </span>
    </div>
  );
}

function ThemeToggle() {
  const mode = useThemeMode();
  const dark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={() => setThemeMode(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className="w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer shrink-0"
      style={{ background: C.surface3, color: C.text, border: 'none' }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function usePersons() {
  const [persons, setPersons] = useState<Person[]>([
    { id: 'ruben', name: 'Ruben' },
    { id: 'sarahi', name: 'Sarahi' },
  ]);
  useEffect(() => { api.getPersons().then(setPersons).catch(() => {}); }, []);
  return persons;
}

export default function Sidebar({ page, setPage, person, setPerson }: SidebarProps) {
  const persons = usePersons();

  return (
    <>
      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <aside
        className="hidden md:flex flex-col h-dvh sticky top-0 z-10 w-[248px] min-w-[248px] px-[18px] py-7 gap-8"
        style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}
      >
        <div className="px-2"><Logo /></div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {NAV.map(item => {
            const active = page === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-3 w-full min-h-[46px] px-3.5 rounded-2xl text-left text-[14px] cursor-pointer border-none"
                style={{
                  background: active ? C.ink : 'transparent',
                  color:      active ? C.inkText : C.muted,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={18} strokeWidth={2} style={{ color: active ? C.accent : 'currentColor' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold" style={{ color: C.muted }}>Persona activa</span>
            <ThemeToggle />
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl" style={{ background: C.surface3 }}>
            {persons.map(p => {
              const active = person === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPerson(p.id)}
                  aria-pressed={active}
                  className="min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-[13px] cursor-pointer border-none"
                  style={{
                    background: active ? C.accent : 'transparent',
                    color:      active ? C.accentInk : C.muted,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <span
                    className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[11px] font-bold"
                    style={{ background: active ? C.accentInk : C.border2, color: active ? C.accent : C.text }}
                  >
                    {p.name[0]}
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR (< md) ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-[64px]"
        style={{ background: C.bg }}
      >
        <Logo size={34} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex gap-1 p-1 rounded-full" style={{ background: C.surface }}>
            {persons.map(p => {
              const active = person === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPerson(p.id)}
                  aria-label={p.name}
                  aria-pressed={active}
                  className="w-[38px] h-[38px] rounded-full text-[14px] font-bold cursor-pointer border-none"
                  style={{
                    background: active ? C.accent : 'transparent',
                    color:      active ? C.accentInk : C.muted,
                  }}
                >
                  {p.name[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE FLOATING NAV (< md) ── */}
      <nav
        className="md:hidden fixed left-4 right-4 z-40 grid grid-cols-4 gap-1 p-1.5 rounded-full h-[64px]"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          background: C.ink,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        }}
      >
        {NAV.map(item => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="flex items-center justify-center gap-1.5 rounded-full border-none cursor-pointer min-w-0 text-[13px] font-semibold"
              style={{
                background: active ? C.accent : 'transparent',
                color:      active ? C.accentInk : C.inkMuted,
              }}
            >
              <Icon size={19} strokeWidth={2} />
              {active && <span className="truncate">{item.shortLabel}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
}
