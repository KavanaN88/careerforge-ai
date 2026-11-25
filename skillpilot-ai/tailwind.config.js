module.exports = Object.assign({content:["./index.html","./src/**/*.js"]}, {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          navy: '#0B1020',
          panel: '#151B2E',
          panel2: '#1B2338',
          indigo: { DEFAULT: '#6366F1', dim: '#4C4FD9' },
          cyan: { DEFAULT: '#06B6D4', dim: '#0891B2' },
          good: '#22C55E',
          warn: '#F59E0B',
          bad: '#F43F5E',
          ink: '#F8FAFC',
          mute: '#94A3B8',
          line: 'rgba(148,163,184,0.14)',
        },
        fontFamily: {
          display: ['"Space Grotesk"', 'sans-serif'],
          body: ['"Inter"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        boxShadow: {
          glow: '0 0 0 1px rgba(99,102,241,0.25), 0 8px 40px -8px rgba(99,102,241,0.35)',
          cyanglow: '0 0 0 1px rgba(6,182,212,0.25), 0 8px 40px -8px rgba(6,182,212,0.35)',
        },
      },
    },
  });