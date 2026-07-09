// tailwind.config.ts (Tailwind v4 can actually run with an empty config)
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;