/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#1e2a5e',
        brand: '#38295f',
        gold: '#f39c12',
        spark: '#b1659d',
        soft: '#f4f5fb',
        slate: '#64748b'
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
