/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5B4DFF',
        secondary: '#7C6CFF',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E7EAF3',
        heading: '#0F172A',
        body: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0,0,0,0.05)',
        'soft-lg': '0 12px 40px rgba(91,77,255,0.08)',
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
