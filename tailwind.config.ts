import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vfsn: {
          bg: "var(--vfsn-bg)",
          surface: "var(--vfsn-surface)",
          text: "var(--vfsn-text)",
          "accent-1": "var(--vfsn-accent-1)",
          "accent-2": "var(--vfsn-accent-2)",
        },
      },
    },
  },
  plugins: [],
};
export default config;