/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488', // teal-600
        secondary: '#e0f2fe', // light-blue (sky-100)
      }
    },
  },
  plugins: [],
}
