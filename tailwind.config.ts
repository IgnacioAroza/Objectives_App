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
        // Neutrales tematizados via CSS vars (cambian con .dark)
        navy:    'rgb(var(--color-fg) / <alpha-value>)',
        cream:   'rgb(var(--color-bg) / <alpha-value>)',
        beige:   'rgb(var(--color-surface-muted) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        muted:   'rgb(var(--color-muted) / <alpha-value>)',
        // Tokens del sidebar (siempre oscuro en ambos modos)
        sidebar:      'rgb(var(--color-sidebar) / <alpha-value>)',
        'sidebar-fg': 'rgb(var(--color-sidebar-fg) / <alpha-value>)',
        // Acentos fijos
        brand: '#1E4FD8',
        sky:   '#4DA3FF',
        // Badge backgrounds (light, fijos)
        'brand-light': '#EEF2FF',
        'sky-light':   '#EBF5FF',
        'navy-light':  '#EEEFFE',
      },
      fontFamily: {
        display: ['var(--font-montserrat)', 'sans-serif'],
        body:    ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
