import type { Config } from "tailwindcss";

export const TAILWIND_PRIMARY_COLOR = "#4f46e5";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: TAILWIND_PRIMARY_COLOR, // Example primary color: Indigo
        secondary: "#64748b", // Example secondary color: Slate
        accent: "#10b981", // Example accent color: Emerald
        dark: "#1f2937", // Example dark color: Dark Blue Gray
        light: "#f3f4f6", // Example light color: Light Gray
      },
    },
  },
  plugins: [],
};
export default config;
