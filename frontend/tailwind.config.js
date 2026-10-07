/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Semantic tokens backed by the CSS variables in index.css (light/dark)
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        border:   'var(--border)',
        border2:  'var(--border2)',
        accent:   'var(--accent)',
        accent2:  'var(--accent)',
        tktext:   'var(--text)',
        muted:    'var(--muted)',
        dim:      'var(--dim)',
      },
      fontFamily: {
        sans:    ["'Geist'", 'system-ui', 'sans-serif'],
        mono:    ["'Geist Mono'", 'ui-monospace', 'monospace'],
        display: ["'Bricolage Grotesque'", 'system-ui', 'sans-serif'],
      },
      // Dynamic viewport height — avoids mobile browser chrome issues
      height: {
        dvh: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
    },
  },
  plugins: [],
};
