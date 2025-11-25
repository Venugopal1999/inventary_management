/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Amazon Seller Central inspired colors
        primary: {
          dark: '#232F3E',
          orange: '#FF9900',
          DEFAULT: '#FF9900',
        },
        secondary: {
          dark: '#37475A',
          DEFAULT: '#37475A',
        },
        amazon: {
          orange: '#FF9900',
          darkBlue: '#232F3E',
          lightBlue: '#37475A',
        },
        success: '#067D62',
        warning: '#F0C14B',
        error: '#C45500',
      },
    },
  },
  plugins: [],
}
