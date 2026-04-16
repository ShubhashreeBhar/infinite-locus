/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'hsl(250,100%,97%)',
          100: 'hsl(250,100%,93%)',
          200: 'hsl(250,90%,85%)',
          300: 'hsl(250,80%,72%)',
          400: 'hsl(250,75%,60%)',
          500: 'hsl(250,70%,50%)',
          600: 'hsl(250,72%,42%)',
          700: 'hsl(250,75%,35%)',
          800: 'hsl(250,78%,25%)',
          900: 'hsl(250,80%,16%)',
        },
        surface: {
          900: 'hsl(230,25%,8%)',
          800: 'hsl(230,22%,12%)',
          700: 'hsl(230,20%,16%)',
          600: 'hsl(230,18%,22%)',
          500: 'hsl(230,15%,30%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
