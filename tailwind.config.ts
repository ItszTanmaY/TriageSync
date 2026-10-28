import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "Menlo",
          "Monaco",
          '"Cascadia Code"',
          '"Source Code Pro"',
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        obsidian: {
          950: "#040405",
          900: "#08080a",
          800: "#0f0f12",
          700: "#17171c",
          600: "#22222a",
        },
        signal: {
          red: "#FF2A44",
          redDark: "#400810",
          amber: "#FFB020",
          amberDark: "#3D2400",
          emerald: "#00E599",
          emeraldDark: "#003822",
          cyan: "#00E5FF",
          cyanDark: "#00343D",
        },
        triage: {
          red: "#FF2A44",
          yellow: "#FFB020",
          green: "#00E599",
          black: "#52525B",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
