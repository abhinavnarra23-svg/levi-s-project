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
          red: "#C41230",
          blue: "#2563EB",
          ink: "#111827",
          sidebar: "#111827",
          canvas: "#F5F7FA"
        }
      },
      boxShadow: {
        soft: "0 22px 60px -38px rgba(15, 23, 42, 0.42)",
        panel: "0 16px 42px -30px rgba(15, 23, 42, 0.34)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
