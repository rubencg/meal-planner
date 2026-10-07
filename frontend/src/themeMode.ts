import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark';

const KEY = 'tiki_theme';

// index.html sets data-theme before first paint (no flash); this mirrors it
function initialMode(): ThemeMode {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let mode: ThemeMode = initialMode();
document.documentElement.dataset.theme = mode;

const listeners = new Set<() => void>();

export function setThemeMode(next: ThemeMode) {
  mode = next;
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  listeners.forEach(l => l());
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => mode,
  );
}
