/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

// Breakpoints (rem) — matches dYdX trading UI conventions
const BREAKPOINTS = {
  mobile: '37.5rem',    // 600px
  tablet: '60rem',      // 960px
  desktopSmall: '80rem', // 1280px
  desktopMedium: '90rem', // 1440px
  desktopLarge: '120rem', // 1920px
};

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      mobile: { max: BREAKPOINTS.mobile },
      notMobile: { min: BREAKPOINTS.mobile },
      tablet: { max: BREAKPOINTS.tablet },
      notTablet: { min: BREAKPOINTS.tablet },
      desktopSmall: { max: BREAKPOINTS.desktopSmall },
      desktopMedium: { min: BREAKPOINTS.desktopMedium },
      desktopLarge: { min: BREAKPOINTS.desktopLarge },
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: 'var(--color-white)',
      black: 'var(--color-black)',
      green: 'var(--color-green)',
      red: 'var(--color-red)',
      'red-faded': 'var(--color-red-faded)',
      'green-faded': 'var(--color-green-faded)',
      'white-faded': 'var(--color-white-faded)',

      'color-layer-0': 'var(--color-layer-0)',
      'color-layer-1': 'var(--color-layer-1)',
      'color-layer-2': 'var(--color-layer-2)',
      'color-layer-3': 'var(--color-layer-3)',
      'color-layer-4': 'var(--color-layer-4)',
      'color-layer-5': 'var(--color-layer-5)',
      'color-layer-6': 'var(--color-layer-6)',
      'color-layer-7': 'var(--color-layer-7)',

      'color-border': 'var(--color-border)',
      'color-border-faded': 'var(--color-border-faded)',
      'color-border-white': 'var(--color-border-white)',
      'color-border-red': 'var(--color-border-red)',

      'color-text-0': 'var(--color-text-0)',
      'color-text-1': 'var(--color-text-1)',
      'color-text-2': 'var(--color-text-2)',
      'color-text-button': 'var(--color-text-button)',

      'color-accent': 'var(--color-accent)',
      'color-accent-faded': 'var(--color-accent-faded)',

      'color-success': 'var(--color-success)',
      'color-warning': 'var(--color-warning)',
      'color-error': 'var(--color-error)',

      'color-positive': 'var(--color-positive)',
      'color-negative': 'var(--color-negative)',
      'color-positive-faded': 'var(--color-positive-faded)',
      'color-negative-faded': 'var(--color-negative-faded)',
    },
    fontFamily: {
      base: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      monospace: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      tiny:   ['0.625rem', { lineHeight: '0.875rem' }],
      mini:   ['0.6875rem', { lineHeight: '1rem' }],
      small:  ['0.75rem', { lineHeight: '1rem' }],
      base:   ['0.8125rem', { lineHeight: '1.125rem' }],
      medium: ['0.875rem', { lineHeight: '1.25rem' }],
      large:  ['1rem', { lineHeight: '1.375rem' }],
      extra:  ['1.125rem', { lineHeight: '1.5rem' }],
    },
    spacing: {
      px: '1px',
      0:     '0px',
      0.5:   '0.125rem',
      1:     '0.25rem',
      1.5:   '0.375rem',
      2:     '0.5rem',
      2.5:   '0.625rem',
      3:     '0.75rem',
      3.5:   '0.875rem',
      4:     '1rem',
      5:     '1.25rem',
      6:     '1.5rem',
      7:     '1.75rem',
      8:     '2rem',
      9:     '2.25rem',
      10:    '2.5rem',
      11:    '2.75rem',
      12:    '3rem',
      14:    '3.5rem',
      16:    '4rem',
      20:    '5rem',
      24:    '6rem',
      28:    '7rem',
      32:    '8rem',
      40:    '10rem',
      48:    '12rem',
      56:    '14rem',
      64:    '16rem',
      72:    '18rem',
      80:    '20rem',
      96:    '24rem',
    },
    borderRadius: {
      none:  '0',
      sm:    '0.25rem',
      md:    '0.375rem',
      lg:    '0.5rem',
      xl:    '0.75rem',
      '2xl': '1rem',
      full:  '9999px',
    },
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.15s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        'flash-bid': 'flashBid 0.6s ease-out forwards',
        'flash-ask': 'flashAsk 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(4px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        flashBid: {
          '0%':   { backgroundColor: 'rgba(37, 194, 110, 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashAsk: {
          '0%':   { backgroundColor: 'rgba(241, 75, 75, 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.row': {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        '.column': {
          display: 'flex',
          flexDirection: 'column',
        },
        '.spacedRow': {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        '.stack': {
          display: 'grid',
          gridTemplateAreas: "'stack'",
          '> *': { gridArea: 'stack' },
        },
      });
    }),
  ],
};
