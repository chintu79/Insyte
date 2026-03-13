/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4457bc',
          800: '#334ba5',
          900: '#223a8e',
        },
        'secondary': {
          50: '#fef2f4',
          500: '#f5576c',
          600: '#e8425a',
          700: '#db2d48',
        },
        'accent': {
          cyan: '#00f2fe',
          purple: '#667eea',
          pink: '#f5576c',
        },
        'dark': {
          bg: '#0f0f1e',
          card: '#1a1a2e',
          border: '#2d2d44',
        }
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px rgba(102, 126, 234, 0.3)',
        'glow-lg': '0 0 60px rgba(102, 126, 234, 0.4)',
      },
      backdropFilter: {
        'glass': 'blur(10px)',
      },
      animation: {
        'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'glow': {
          '0%, 100%': { opacity: '0.5', filter: 'blur(1px)' },
          '50%': { opacity: '1', filter: 'blur(2px)' },
        },
        'shimmer': {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [],
}