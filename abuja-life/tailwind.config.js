/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        abuja: {
          green: "#008751",
          gold: "#eab308",
          sky: "#38bdf8",
          slate: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
