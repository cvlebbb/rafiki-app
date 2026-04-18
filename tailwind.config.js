export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rafiki: {
          purple: "#6D28D9",
          orange: "#FB923C",
          ink: "#111827",
          cream: "#F8F7FC"
        }
      },
      boxShadow: {
        glow: "0 14px 40px -16px rgba(109, 40, 217, 0.65)"
      },
      borderRadius: {
        card: "1.25rem"
      }
    }
  },
  plugins: []
};
