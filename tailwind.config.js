/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B8860B', // Dark Gold
          light: '#DAA520',
          dark: '#8B6508'
        },
        secondary: '#1A1A1A', // Rich Black
        accent: {
          DEFAULT: '#E5E7EB',
          hover: '#D1D5DB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
