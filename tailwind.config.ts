import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':        'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':        'fadeIn 0.3s ease-out both',
        'slide-down':     'slideDown 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in':       'scaleIn 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'float':          'float 8s ease-in-out infinite',
        'float-slow':     'float 11s ease-in-out infinite 2s',
        'float-slower':   'float 14s ease-in-out infinite 4s',
        'glow-pulse':     'glowPulse 2.8s ease-in-out infinite',
        'shake':          'shake 0.45s ease-in-out',
        'shimmer':        'shimmer 2.2s linear infinite',
        'progress-fill':  'progressFill 0.8s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft':     'pulseSoft 3s ease-in-out infinite',
        'spin-slow':      'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(110%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(18px,-22px) scale(1.06)' },
          '66%':     { transform: 'translate(-12px,12px) scale(0.96)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 18px 3px rgba(59,130,246,0.35)' },
          '50%':     { boxShadow: '0 0 38px 10px rgba(59,130,246,0.55)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '15%':     { transform: 'translateX(-5px)' },
          '30%':     { transform: 'translateX(5px)' },
          '45%':     { transform: 'translateX(-5px)' },
          '60%':     { transform: 'translateX(5px)' },
          '75%':     { transform: 'translateX(-3px)' },
          '90%':     { transform: 'translateX(3px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        progressFill: {
          '0%':   { width: '0%' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.65' },
        },
      },
      boxShadow: {
        'glow-blue':   '0 0 20px -4px rgba(59,130,246,0.5)',
        'glow-green':  '0 0 20px -4px rgba(16,185,129,0.5)',
        'glow-amber':  '0 0 20px -4px rgba(245,158,11,0.5)',
        'glow-purple': '0 0 20px -4px rgba(139,92,246,0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
