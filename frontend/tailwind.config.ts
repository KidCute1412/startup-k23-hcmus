import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vanguard: {
          primary: "#D4AF37",
          secondary: "#AA7C11",
          accent: "#800020",
          dark: {
            bg: "#090B10",
            surf: "#111420",
            surfDim: "#0B0D15",
            surfBright: "#1A1E30",
            border: "#2C3248",
            text: "#F3EFE0",
            textMuted: "#8E98B0",
          },
          light: {
            bg: "#FAF9F6",
            surf: "#FFFFFF",
            surfDim: "#F3EFE0",
            surfBright: "#FFFFFF",
            border: "#E5E0D8",
            text: "#1C1F26",
            textMuted: "#7A808F",
          },
        },
      },
      fontFamily: {
        body: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      borderRadius: {
        "v-sm": "2px",
        "v-md": "4px",
        "v-lg": "8px",
        "v-none": "0px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gold-metal": "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
      },
      boxShadow: {
        royal: "0 24px 70px -28px rgba(212, 175, 55, 0.45)",
      },
      transitionTimingFunction: {
        royal: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
