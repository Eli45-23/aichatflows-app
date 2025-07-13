/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Modern white theme palette
        primary: '#00D4AA', // Mint green (keep brand color)
        'primary-dark': '#00B894',
        secondary: '#6B7280', // Medium gray
        accent: '#3B82F6', // Modern blue
        
        // Mint Theme Colors
        'mint-primary': '#00D4AA',
        'mint-dark': '#00B894',
        'mint-bg-primary': '#F0FDF4', // Light mint background
        'mint-bg-secondary': '#DCFCE7', // Slightly darker mint background
        'mint-bg-card': '#FFFFFF', // White cards for mint theme
        'mint-text-primary': '#1A1A1A', // Dark text on light mint
        'mint-text-secondary': '#166534', // Mint green text
        'mint-text-muted': '#6B7280', // Muted gray text
        'mint-border': '#BBF7D0', // Light mint border
        
        // Teal Theme Colors
        'teal-primary': '#0D9488',
        'teal-dark': '#0F766E',
        'teal-bg-primary': '#F0FDFA', // Light teal background
        'teal-bg-secondary': '#CCFBF1', // Slightly darker teal background
        'teal-bg-card': '#FFFFFF', // White cards for teal theme
        'teal-text-primary': '#1A1A1A', // Dark text on light teal
        'teal-text-secondary': '#0F766E', // Teal text
        'teal-text-muted': '#6B7280', // Muted gray text
        'teal-border': '#99F6E4', // Light teal border
        
        // Background colors - White theme
        'bg-primary': '#FFFFFF', // Pure white
        'bg-secondary': '#F8F9FA', // Light gray
        'bg-card': '#FFFFFF', // White cards
        'bg-elevated': '#FFFFFF', // White elevated surfaces
        
        // Text colors - Dark on light
        'text-primary': '#1A1A1A', // Dark gray
        'text-secondary': '#4A5568', // Medium gray
        'text-muted': '#6B7280', // Light gray
        'text-accent': '#00D4AA', // Mint green text
        
        // Status colors - Light backgrounds
        success: '#10B981', // Green
        warning: '#F59E0B', // Amber
        danger: '#EF4444', // Red
        info: '#3B82F6', // Blue
        
        // Border and shadow colors - Light theme
        'border-primary': '#E2E8F0',
        'border-accent': '#00D4AA',
        'shadow-glow': 'rgba(0, 212, 170, 0.15)',
      },
      gradients: {
        'primary': 'linear-gradient(135deg, #00D4AA 0%, #0099CC 100%)',
        'accent': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'success': 'linear-gradient(135deg, #00D9FF 0%, #00D4AA 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 170, 0.15)',
        'glow-lg': '0 0 30px rgba(0, 212, 170, 0.2)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'input': '4px',
      },
      spacing: {
        'card': '16px',
        'section': '24px',
        'page': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-subtle': 'bounceSubtle 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 212, 170, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 212, 170, 0.6)' },
        },
        bounceSubtle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'scale(1)' },
          '40%, 43%': { transform: 'scale(0.98)' },
          '70%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}