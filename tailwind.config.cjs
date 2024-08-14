/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./playground/index.html', './playground/**/*.{vue,js,ts,jsx,tsx,mdx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
}
