/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans KR'", "sans-serif"],
      },
      colors: {
        blue: {
          50:  "#EFF7FD",
          100: "#D9EEFA",
          200: "#B8DCF5",
          300: "#96CAEF",
          400: "#83BFEC",
          500: "#6FB6E8",
          600: "#6FB6E8",
          700: "#5AA5D8",
          800: "#4590C3",
        },
        surface: "#f8fafc",
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(0,0,0,.06), 0 4px 16px 0 rgba(0,0,0,.06)",
        "card-hover": "0 4px 12px 0 rgba(111,182,232,.18), 0 8px 32px 0 rgba(111,182,232,.12)",
      },
      animation: {
        "fade-in": "fadeIn .2s ease",
        "slide-up": "slideUp .25s ease",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
}
