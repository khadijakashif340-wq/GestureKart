import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#06080e',
        dark: {
          950: '#06080e',
          900: '#0a0d14',
          850: '#0f1420',
          800: '#141b2d',
          700: '#1e293b',
          600: '#334155',
        },
        neon: {
          emerald: '#10b981',
          emeraldGlow: '#059669',
          amber: '#f59e0b',
          amberGlow: '#d97706',
          red: '#ef4444',
          redGlow: '#dc2626',
          cyan: '#06b6d4',
          cyanGlow: '#0891b2',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', '"Noto Naskh Arabic"', 'serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.4)',
        'glow-red': '0 0 25px -2px rgba(239, 68, 68, 0.5)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
