// Theme tokens resolve to CSS variables defined in index.css, so every
// inline style follows the active light/dark theme without re-rendering.
const v = (name: string) => `var(--${name})`;

export const C = {
  bg:          v('bg'),
  surface:     v('surface'),
  surface2:    v('surface2'),
  surface3:    v('surface3'),
  border:      v('border'),
  border2:     v('border2'),
  accent:      v('accent'),       // lime fill — pair with accentInk
  accent2:     v('accent'),
  accentInk:   v('accent-ink'),   // text on lime fills
  accentText:  v('accent-text'),  // accent used as text on surfaces
  accentSoft:  v('accent-soft'),
  accentGlow:  v('accent-soft'),
  ink:         v('ink'),          // inverted block (dark card / nav pill)
  inkText:     v('ink-text'),
  inkMuted:    v('ink-muted'),
  inkTrack:    v('ink-track'),
  primary:     v('primary'),      // primary button fill
  primaryText: v('primary-text'),
  primaryIcon: v('primary-icon'),  // icon accent inside primary buttons
  text:        v('text'),
  muted:       v('muted'),
  dim:         v('dim'),
  red:         v('red'),
  redSoft:     v('red-soft'),
  yellow:      v('yellow'),
  blue:        v('blue'),
  purple:      v('purple'),
  orange:      v('orange'),
  green:       v('green'),
  overlay:     v('overlay'),
} as const;

export const FONT = {
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  body:    "'Geist', system-ui, sans-serif",
  mono:    "'Geist Mono', ui-monospace, monospace",
} as const;

/** Translucent version of any token, e.g. alpha(C.red, 20). */
export const alpha = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** Resolved value of a token — for canvas APIs (Chart.js) that can't read var(). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

export type Theme = typeof C;
