/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        '': '#fafbfb',
        'webgreen': '#37d98f',
        'webred': '#ec3b47',
        'webblue': '#1C4E80',
        'webgray': '#eaf0f6',
        'webdg': '#18181c',
      },
      animation: {
        load: 'load 2.5s linear forwards',
      },
      keyframes: {
        load: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}