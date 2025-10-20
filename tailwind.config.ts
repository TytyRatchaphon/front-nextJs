import type { Config } from 'tailwindcss'
const defaultTheme = require("tailwindcss/defaultTheme");
import scrollbarHide from 'tailwind-scrollbar-hide'

const config: Config = {
  
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-bai-jamjuree)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}
export default config