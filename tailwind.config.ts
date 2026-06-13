
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        asce: {
          mint: '#2ee59d',
          blue: '#4c8dff',
          amber: '#f5b84b',
          red: '#ff5c7a',
          base: '#080b0f',
          panel: '#0d141a',
          elevated: '#101820',
        },
      },
    }
  },
  plugins: [],
};
export default config;
