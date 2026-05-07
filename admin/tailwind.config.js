/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e2a5e',
        accent: '#f39c12',
        success: '#10B981',
        danger: '#DC2626',
        warning: '#F97316',
        info: '#3B82F6',
        pending: '#FBBF24',
        roleAdmin: '#DC2626',
        roleTech: '#3B82F6',
        roleCashier: '#10B981',
      }
    },
  },
  plugins: [],
}
