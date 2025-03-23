import type { Config } from "tailwindcss";
import tailwindForms from '@tailwindcss/forms';
import tailwindScrollbar from 'tailwind-scrollbar';

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  safelist: [
    'scrollbar-custom',
    'delay-75',
    'delay-150',
    'delay-300',
    'delay-500',
  ],
  plugins: [
    tailwindForms,
    tailwindScrollbar,
  ],
} satisfies Config;
