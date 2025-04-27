/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E2942",
        secondary: "#2B3B59",
        accent: "#FF5C35",
        'accent-green': '#00A880',
        'button-blue': '#0099FF',
      },
    },
  },
}; 