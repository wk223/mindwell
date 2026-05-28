import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Deep space core (backgrounds) ──
        void: {
          950: "#03050c",
          900: "#060918",
          850: "#0a0e1f",
          800: "#0e1328",
          700: "#131b33",
        },
        // ── Moonlight warm accents ──
        moon: {
          50: "#fdf8f0",
          100: "#f9edd9",
          200: "#f0d9ad",
          300: "#e6c180",
          400: "#d9a654",
          500: "#c98d32",
          600: "#a87028",
          700: "#875620",
          800: "#6b421c",
          900: "#543418",
        },
        // ── Tinted neutrals (warm offset against deep blue) ──
        slate: {
          50: "#f8f7f9",
          100: "#eeecf2",
          200: "#d6d2de",
          300: "#b3adc0",
          400: "#8a829b",
          500: "#6d657f",
          600: "#575068",
          700: "#464055",
          800: "#363045",
          900: "#242132",
        },
        // ── Emotional accent (soft lavender, sparing use) ──
        lavender: {
          50: "#f6f4fd",
          100: "#ebe5f9",
          200: "#d8cff4",
          300: "#bcaaeb",
          400: "#9c80e0",
          500: "#7d5bd4",
          600: "#6842c4",
          700: "#5533a8",
          800: "#432b85",
          900: "#35256a",
        },
        // ── Semantic ──
        rose: {
          50: "#fef5f6",
          100: "#fde8ea",
          200: "#fbc9cf",
          300: "#f69aa5",
          400: "#ee5c6c",
          500: "#e02d41",
          600: "#c41a2d",
          700: "#a11524",
          800: "#821521",
          900: "#691620",
        },
        success: {
          50: "#f2fcf5",
          100: "#dff7e7",
          500: "#3db86c",
          600: "#2d9c58",
          700: "#1f7a43",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"ZCOOL XiaoWei"', "Georgia", "serif"],
        sans: ['"Inter"', '"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "20px",
        "glass-heavy": "40px",
      },
      boxShadow: {
        "glow-sm": "0 0 20px -5px rgba(201, 141, 50, 0.15)",
        "glow-md": "0 0 40px -10px rgba(201, 141, 50, 0.2)",
        "glow-lg": "0 0 80px -20px rgba(201, 141, 50, 0.25)",
        "moon": "0 0 120px -30px rgba(200, 180, 220, 0.15)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
      },
      animation: {
        "breathe": "breathe 8s ease-in-out infinite",
        "breathe-slow": "breathe 12s ease-in-out infinite",
        "float": "float 10s ease-in-out infinite",
        "float-slow": "float 16s ease-in-out infinite",
        "twinkle": "twinkle 4s ease-in-out infinite",
        "shimmer": "shimmer 6s linear infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "25%": { transform: "translateY(-8px)" },
          "75%": { transform: "translateY(4px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
