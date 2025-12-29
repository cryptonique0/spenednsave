import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#1349ec",
        "primary-hover": "#0e36b0",
        "background-light": "#f8f9fc",
        "background-dark": "#0b0e14",
        "surface-light": "#ffffff",
        "surface-dark": "#151a25",
        "surface-border": "#222736",
        "surface-border-light": "#e2e4e9",
      },
      fontFamily: {
        "display": ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(19, 73, 236, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out infinite 1s',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
