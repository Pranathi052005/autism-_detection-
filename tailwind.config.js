/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bioluminescent Dark Color System
        'bio-black': '#080B0F',
        'bio-darker': '#0D1117',
        'bio-dark': '#1A1F2E',
        
        'bio-rose': '#FF6B8A',
        'bio-teal': '#00D4AA',
        
        'bio-glass': {
          50: 'rgba(255, 255, 255, 0.04)',
          100: 'rgba(255, 255, 255, 0.08)',
          200: 'rgba(255, 255, 255, 0.12)',
        },
        
        'bio-text': {
          primary: '#FFFFFF',
          secondary: '#A0ADB8',
          muted: '#6B7280',
        },
        
        'bio-glow': {
          rose: '0 0 20px rgba(255, 107, 138, 0.3)',
          teal: '0 0 20px rgba(0, 212, 170, 0.3)',
          white: '0 0 20px rgba(255, 255, 255, 0.1)',
        }
      },
      
      fontFamily: {
        'display': ['Clash Display', 'system-ui', 'sans-serif'],
        'heading': ['Syne', 'system-ui', 'sans-serif'],
        'body': ['DM Sans', 'system-ui', 'sans-serif'],
      },
      
      backgroundImage: {
        'bio-gradient': 'linear-gradient(135deg, #FF6B8A, #00D4AA)',
        'bio-gradient-radial': 'radial-gradient(circle at 20% 50%, rgba(255, 107, 138, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 212, 170, 0.1) 0%, transparent 50%)',
        'bio-mesh': 'radial-gradient(ellipse at top left, rgba(255, 107, 138, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0, 212, 170, 0.05) 0%, transparent 50%)',
      },
      
      backdropBlur: {
        'bio': '20px',
      },
      
      boxShadow: {
        'bio-glow-rose': '0 0 20px rgba(255, 107, 138, 0.3)',
        'bio-glow-teal': '0 0 20px rgba(0, 212, 170, 0.3)',
        'bio-glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',
        'bio-card': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-up-delayed': 'fadeUp 0.6s ease-out 0.1s forwards',
        'fade-up-delayed-2': 'fadeUp 0.6s ease-out 0.2s forwards',
        'particle-drift': 'particleDrift 20s linear infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        particleDrift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
          '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)' },
        },
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'bio': '1rem',
        'bio-lg': '1.5rem',
      },
      
      borderWidth: {
        'bio': '0.5px',
      },
    },
  },
  plugins: [],
}
