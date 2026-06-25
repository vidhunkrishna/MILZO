/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7', // Ocean corporate blue
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0a3d5c',
        },
        milzo: {
          blue: '#0284c7',
          indigo: '#4f46e5',
          teal: '#0d9488',
          amber: '#eab308',
          rose: '#ef4444',
          emerald: '#22c55e',
          slate: '#475569',
        },
        dark: {
          bg: '#090d16',     // Premium Midnight Dark Navy
          card: '#111827',   // Slate deep grey/blue card
          border: '#1f2937', // Refined borders
          hover: '#1f2937',  // Hover background states
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 20px -8px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(2, 132, 199, 0.15)',
        'glow-cyan': '0 0 20px rgba(13, 148, 136, 0.15)',
        'glow-emerald': '0 0 20px rgba(34, 197, 94, 0.15)',
        'glow-rose': '0 0 20px rgba(239, 68, 68, 0.15)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'bounce-light': 'bounceLight 1.5s infinite',
        'pulse-slow': 'pulse 3.5s infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(-100%)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(-6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
