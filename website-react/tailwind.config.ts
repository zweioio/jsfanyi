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
        border: "rgba(0, 0, 0, 0.08)",
        primary: {
          DEFAULT: "#3B82F6",
          light: "rgba(59, 130, 246, 0.1)",
          glow: "rgba(59, 130, 246, 0.2)",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          light: "rgba(139, 92, 246, 0.1)",
        },
      },
      backgroundImage: {
        "gradient-1": "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
        "gradient-2": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
      },
      animation: {
        "badge-pulse": "badgePulse 3s infinite ease-in-out",
        "gradient-shift": "gradientShift 8s ease infinite",
        float: "float 20s infinite ease-in-out",
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        badgePulse: {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 0 10px rgba(59, 130, 246, 0)",
          },
        },
        gradientShift: {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
          },
          "50%": {
            transform: "translate(30px, -30px) scale(1.1)",
          },
        },
        aurora: {
          "0%": {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          "100%": {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
