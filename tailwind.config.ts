import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',

        // Semantic colors
        success: 'var(--color-success)',
        'success-foreground': 'var(--color-success-foreground)',
        'success-muted': 'var(--color-success-muted)',
        'success-muted-foreground': 'var(--color-success-muted-foreground)',
        error: 'var(--color-error)',
        'error-foreground': 'var(--color-error-foreground)',
        'error-muted': 'var(--color-error-muted)',
        'error-muted-foreground': 'var(--color-error-muted-foreground)',
        warning: 'var(--color-warning)',
        'warning-foreground': 'var(--color-warning-foreground)',
        'warning-muted': 'var(--color-warning-muted)',
        'warning-muted-foreground': 'var(--color-warning-muted-foreground)',
        info: 'var(--color-info)',
        'info-foreground': 'var(--color-info-foreground)',
        'info-muted': 'var(--color-info-muted)',
        'info-muted-foreground': 'var(--color-info-muted-foreground)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
