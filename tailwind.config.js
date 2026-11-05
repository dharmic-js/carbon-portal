/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#172554",
          teal: "#164e63",
          green: "#365314",
          lightNavy: "#1e3a8a",
          accentTeal: "#2A9D8F",
          accentOrange: "#F4A261",
          accentGreen: "#6A994E",
          accentRed: "#D9534F"
        }
      }
    },
  },
  plugins: [],
}

