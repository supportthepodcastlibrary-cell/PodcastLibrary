/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      fontWeight: {
        '300': '300',
        '400': '400',
        '500': '500',
        '600': '600',
        '700': '700',
      },
      colors: {
        ink: {
          50: '#FAFAF8',
          100: '#F6F2EC',
          200: '#E8E2D8',
          300: '#D4CDBF',
          400: '#A8A29A',
          500: '#666666',
          600: '#444444',
          700: '#333333',
          800: '#222222',
          900: '#111111',
          950: '#0A0A0A',
        },
        gold: {
          100: '#F8F0DC',
          200: '#F0E2BC',
          300: '#E8D49A',
          400: '#D8BC6E',
          500: '#C8A24D',
          600: '#A88836',
          700: '#8A7230',
        },
      },
    },
  },
  plugins: [],
};
