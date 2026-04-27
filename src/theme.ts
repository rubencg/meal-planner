export const C = {
  bg:         '#070f0a',
  surface:    '#0e1a12',
  surface2:   '#122016',
  surface3:   '#192c1e',
  border:     '#1c2f24',
  border2:    '#244035',
  accent:     '#22c97a',
  accent2:    '#18a862',
  accentGlow: 'rgba(34,201,122,0.10)',
  text:       '#e4f2eb',
  muted:      '#6a9e82',
  dim:        '#38624a',
  red:        '#f87171',
  yellow:     '#fbbf24',
  blue:       '#60a5fa',
  purple:     '#a78bfa',
  orange:     '#fb923c',
  green:      '#34d399',
} as const;

export type Theme = typeof C;
