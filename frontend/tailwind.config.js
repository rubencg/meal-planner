/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#070f0a',
        surface:  '#0e1a12',
        surface2: '#122016',
        surface3: '#192c1e',
        border:   '#1c2f24',
        border2:  '#244035',
        accent:   '#22c97a',
        accent2:  '#18a862',
        tktext:   '#e4f2eb',
        muted:    '#6a9e82',
        dim:      '#38624a',
      },
      fontFamily: {
        sans: ["'DM Sans'", 'sans-serif'],
        mono: ["'DM Mono'", 'monospace'],
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
