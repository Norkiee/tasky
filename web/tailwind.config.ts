import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#141414',
          tertiary: '#1A1A1A',
          input: '#0D0D0D',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1A1',
          tertiary: '#666666',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          muted: 'rgba(139, 92, 246, 0.15)',
        },
      },
    },
  },
  plugins: [],
}

export default config
