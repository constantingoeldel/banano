module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {

    extend: {
      colors: {
        transparent: "transparent",
        banano: {
          100: "#FFF9D7",
          200: '#FFED85',
          500: '#FCE54A',
          600: '#fbdd11',
          700: 'F1D104',
        },
        dark: '#18274E',
        light: "#00aced",
        contrast: '#D36582'

      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
