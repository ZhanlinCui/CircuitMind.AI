/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Engineering Precision Palette
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        indigo: {
          500: '#6366f1',
          600: '#4f46e5', // Primary Brand
          700: '#4338ca',
        },
        // Semantic Tokens (remapped to new palette)
        primary: '#4f46e5', // Indigo-600
        secondary: '#475569', // Slate-600
        tertiary: '#0891b2', // Cyan-600
        success: '#059669', // Emerald-600
        danger: '#e11d48', // Rose-600
        warning: '#d97706', // Amber-600
        info: '#3b82f6', // Blue-500
        
        // UI Tokens
        'text-primary': '#0f172a', // Slate-900
        'text-secondary': '#64748b', // Slate-500
        'bg-primary': '#f8fafc', // Slate-50 (App Background)
        'bg-surface': '#ffffff', // Card Background
        'border-default': '#e2e8f0', // Slate-200
        'border-active': '#4f46e5', // Indigo-600
        
        // Legacy Support (remapped)
        'bg-secondary': '#f1f5f9',
        'border-primary': '#e2e8f0',
        'border-secondary': '#cbd5e1',
        'card-bg': '#ffffff',
        'sidebar-bg': '#0f172a', // Slate-900
        'sidebar-text': '#94a3b8', // Slate-400
        'sidebar-text-active': '#ffffff',
        'sidebar-hover': '#1e293b', // Slate-800
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
        // Legacy
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'sm': '0.25rem', // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem', // 8px
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
        'gradient-surface': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }
    }
  },
  plugins: [],
};
