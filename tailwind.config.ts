import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        flame: "#E63946",
        ember: "#F4631E",
        charcoal: "#1A1A1A",
        cream: "#FFF8F0",
        ash: "#2D2926"
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', "Georgia", "serif"],
        body: ['"Avenir Next"', '"Segoe UI"', "Helvetica", "Arial", "sans-serif"]
      },
      backgroundImage: {
        "flame-gradient":
          "radial-gradient(circle at top left, rgba(244,99,30,0.4), transparent 42%), radial-gradient(circle at top right, rgba(230,57,70,0.34), transparent 36%), linear-gradient(135deg, #1a1a1a 0%, #2d120f 48%, #401413 100%)",
        "cream-glow":
          "radial-gradient(circle at top, rgba(244,99,30,0.18), transparent 35%), linear-gradient(180deg, #fff8f0 0%, #fff2e2 100%)"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(26, 26, 26, 0.12)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
