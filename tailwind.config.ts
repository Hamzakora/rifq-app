import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Arial", "Tahoma", "sans-serif"],
        quran: ["Traditional Arabic", "Amiri", "Scheherazade New", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
