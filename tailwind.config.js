/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // "Midnight" — warmer, neutral, premium dark palette.
        // Overrides Tailwind's flat slate-blue defaults for dark mode surfaces.
        midnight: {
          50: '#f5f5f7',
          100: '#e7e7eb',
          200: '#c9c9d2',
          300: '#a0a0ae',
          400: '#71717f',
          500: '#52525c',
          600: '#3f3f48',
          700: '#2e2e36',
          800: '#1f1f27',
          900: '#16161c',
          950: '#0b0b10',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        'card-lg':
          '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 10px 20px -3px rgb(15 23 42 / 0.08)',
        'card-dark':
          '0 1px 3px 0 rgb(0 0 0 / 0.45), 0 1px 2px 0 rgb(0 0 0 / 0.3), inset 0 1px 0 0 rgb(255 255 255 / 0.03)',
        glow: '0 0 0 4px rgb(99 102 241 / 0.15)',
        'glow-strong': '0 0 30px -8px rgb(99 102 241 / 0.5)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'scale-in': 'scale-in 200ms ease-out both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, rgb(99 102 241) 0%, rgb(14 165 233) 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, rgb(238 242 255) 0%, rgb(236 254 255) 100%)',
        'brand-gradient-dark':
          'linear-gradient(135deg, rgb(49 46 129) 0%, rgb(22 78 99) 100%)',
        'midnight-radial':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};
