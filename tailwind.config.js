/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nahora: { forest: '#123B32', green: '#176B52', gold: '#D7A84B', canvas: '#F5F7F5', ink: '#17212B' },
      },
      fontFamily: { sans: ['Inter', 'Noto Sans Bengali', 'sans-serif'] },
    },
  },
  plugins: [],
}
