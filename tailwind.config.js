/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        char: {
          900: "#1E1A16",
          800: "#2B241D",
          700: "#3A3128",
        },
        linen: "#F6F1E8",
        ember: {
          400: "#E3A23C",
          500: "#D18C25",
          600: "#B06F16",
        },
        olive: {
          500: "#5C6B47",
          600: "#49542F",
        },
        brick: {
          500: "#9C4536",
          600: "#7E3529",
        },
      },
      fontFamily: {
        // System font stacks — no external font fetch required, so the app
        // builds and renders identically with or without internet access.
        display: [
          "Iowan Old Style",
          "Palatino Linotype",
          "URW Palladio L",
          "P052",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        body: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
