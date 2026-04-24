import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#f7f5f0',
          100: '#eee8da',
          200: '#e7e3d8',
          300: '#d6cdbc',
        },
        amber: {
          warm: '#d9a57b',
        },
        ink: {
          DEFAULT: '#1a1814',
          light: '#4a4540',
          muted: '#8a8278',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
