import type { Config } from 'tailwindcss'

const config: Config = {
  
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-bai-jamjuree)'],
        mono: ['var(--font-geist-mono)'],
        geist: ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [],
}
export default config