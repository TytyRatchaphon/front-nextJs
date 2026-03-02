import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import scrollbarHide from 'tailwind-scrollbar-hide'

const config: Config = {
  
  content: [
    './src/**/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      
      // VVVVVV  เพิ่มส่วนนี้  VVVVVV
      colors: {
        primary: '#dc2626', // <-- นี่คือสีแดง (red-600)
      },
      // ^^^^^^  จบส่วนที่เพิ่ม  ^^^^^^

      fontFamily: {
        sans: ["var(--font-bai-jamjuree)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    scrollbarHide
  ],
}
export default config
