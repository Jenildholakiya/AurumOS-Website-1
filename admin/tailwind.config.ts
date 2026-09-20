import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:  'var(--cream)',
        cream2: 'var(--cream2)',
        cream3: 'var(--cream3)',
        ink:    'var(--ink)',
        ink2:   'var(--ink2)',
        ink3:   'var(--ink3)',
        gold:   'var(--gold)',
        gold2:  'var(--gold2)',
        gold3:  'var(--gold3)',
        muted:  'var(--muted)',
        muted2: 'var(--muted2)',
      },
      fontFamily: {
        serif: ['Space Grotesk', 'DM Sans', 'system-ui', 'sans-serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(14,12,9,0.07), 0 1px 2px rgba(14,12,9,0.04)',
        card2: '0 4px 16px rgba(14,12,9,0.08), 0 1px 4px rgba(14,12,9,0.04)',
        card3: '0 8px 32px rgba(14,12,9,0.10), 0 2px 8px rgba(14,12,9,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
