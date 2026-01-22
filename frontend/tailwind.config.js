/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This replaces the default sans font
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        // This replaces the default mono font
        mono: ['"JetBrains Mono"', 'monospace'],
        // You can also create brand-new categories
        display: ['"Archivo Black"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

