/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-bg': '#F5F5F7',
        'apple-text': '#1D1D1F',
        'apple-gray': '#86868B',
        'apple-blue': '#0A60D6',
        'apple-slate-blue': '#3C516E', // Ultimate Prompt Main Action
        'apple-sage-green': '#869277', // Ultimate Prompt Switch ON
        'apple-green': '#34C759',
        'apple-surface': 'rgba(255, 255, 255, 0.65)',
      },
      borderRadius: {
        'apple': '20px',
        'apple-lg': '24px',
        'apple-xl': '32px',
      },
      boxShadow: {
        'apple': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'apple-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'apple-card': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
