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
        "store-blue": "#007AFF",
        "store-green": "#34C759",
        "play-green": "#01875F",
        "play-blue": "#4285F4",
      },
    },
  },
  plugins: [],
};
export default config;
