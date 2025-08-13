/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 1px 1px rgba(0,0,0,.35), 0 10px 30px rgba(0,0,0,.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
};
