import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkRed: "#780000",
          red: "#C1121F",
          cream: "#FDF0D5",
          ink: "#003049",
          sidebar: "#003049",
          canvas: "#FFFFFF",
          blue: "#669BBC"
        }
      },
      boxShadow: {
        soft: "0 22px 60px -38px rgba(0, 48, 73, 0.42)",
        panel: "0 16px 42px -30px rgba(0, 48, 73, 0.34)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
