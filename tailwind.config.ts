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
        primary: {
          50: '#f0f3fa',
          100: '#d9e1f2',
          500: '#15378F',
          600: '#112d75',
          700: '#0d225c',
        },
      },
    },
  },
  plugins: [],
}

export default config
