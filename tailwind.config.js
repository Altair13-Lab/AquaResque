/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        ink: "#07111d",
        panel: "#0d1a29",
        line: "#1d3042",
        mint: "#55e6bd",
      },
    },
  },
  plugins: [],
};
