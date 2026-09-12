/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cash: {
          DEFAULT: '#B5792C',
          soft: '#FDF3E4',
          border: '#EAD3AC',
        },
        online: {
          DEFAULT: '#2C5F7C',
          soft: '#EAF2F6',
          border: '#C3DAE5',
        },
        brand: {
          DEFAULT: '#1F4B43',
          dark: '#163530',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
