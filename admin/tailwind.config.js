/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        luxe: {
          bg: '#FFFFFF',
          panel: '#FFFFFF',
          border: '#EDEDED',
        },
        gold: {
          DEFAULT: '#481F72',
          light: '#5F2B8F',
          dark: '#351652',
        },
        blush: {
          from: '#481F72',
          to: '#481F72',
        },
      },
      fontFamily: {
        sans: ['"Amazon Ember"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        goldGlow: '0 4px 18px rgba(72,31,114,0.12)',
        goldGlowLg: '0 8px 26px rgba(72,31,114,0.16)',
      },
      backgroundImage: {
        'blush-gradient': 'linear-gradient(90deg, #481F72 0%, #D4AF37 100%)',
      },
    },
  },
  plugins: [],
}
