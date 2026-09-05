/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Dusk booth" palette — deep plum/aubergine + dusty rose + warm gold,
        // instead of the generic cream/terracotta AI default.
        booth: {
          ivory: "#FBF4EE",
          paper: "#F4EAE1",
          plum: {
            50: "#F6EEF1",
            100: "#E9D5DD",
            200: "#D2ABBB",
            300: "#B5758F",
            400: "#8C4A63",
            500: "#6E3349",
            600: "#582939",
            700: "#402030",
            800: "#2C1720",
            900: "#1C0F15",
          },
          rose: {
            300: "#E7B4BE",
            400: "#D98A9A",
            500: "#C05F76",
          },
          gold: {
            300: "#E8CE99",
            400: "#D3AE63",
            500: "#B8903F",
          },
          ink: "#241A21",
          night: "#150F13",
          dusk: "#1F1620",
        },
      },
      fontFamily: {
        display: ["\"Fraunces\"", "ui-serif", "Georgia", "serif"],
        body: ["\"Manrope\"", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(44, 23, 32, 0.25)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(184,144,63,0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
