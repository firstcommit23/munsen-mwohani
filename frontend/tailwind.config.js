/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans KR'", "sans-serif"],
      },
      colors: {
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        surface: "#f8fafc",
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(0,0,0,.06), 0 4px 16px 0 rgba(0,0,0,.06)",
        "card-hover": "0 4px 12px 0 rgba(37,99,235,.12), 0 8px 32px 0 rgba(37,99,235,.08)",
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
