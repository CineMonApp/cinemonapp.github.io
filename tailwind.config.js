/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './content/**/*.{html,md}',
    './layouts/**/*.html',
    './themes/cinemon/layouts/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#0b0433',
        'dark-gray': '#36354B',
        'turquoise': '#665DEF',
        'light-purple': '#A299FF',
        'deep-purple': '#5f4fff',
        'border-gray': '#5a547c',
        'hover-gray': '#9791b9',
        'footer-dark': '#06021f',
        'footer-text': '#cac8db',
        'dialog-bg': '#5a5871',
        'dialog-overlay': 'rgba(0, 0, 0, 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1-large': ['3.5rem', { lineHeight: '4.375rem', letterSpacing: '-0.2px' }],
      },
      borderRadius: {
        'btn': '32px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, rgba(10,4,47,1) 0%, rgba(5,2,24,1) 100%)',
        'gradient-purple': 'linear-gradient(to bottom, #A299FF, #5f4fff)',
        'gradient-text': 'linear-gradient(135deg, #ffffff 0%, #a299ff 100%)',
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
