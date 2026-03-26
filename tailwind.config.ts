import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:  '#141B63',
        brand: '#1E4FD8',
        sky:   '#4DA3FF',
        cream: '#FAF7F2',
        beige: '#E8E0D5',
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
