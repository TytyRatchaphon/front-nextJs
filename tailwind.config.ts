import type { Config } from 'tailwindcss'
const defaultTheme = require("tailwindcss/defaultTheme");
// import scrollbarHide from 'tailwind-scrollbar-hide' 
// (ถ้าใช้ require('tailwind-scrollbar-hide') ด้านล่าง, import นี้ไม่จำเป็น)

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
    require('tailwind-scrollbar-hide')
  ],
}
export default config