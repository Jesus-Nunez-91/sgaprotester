/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'uah-blue': {
                    DEFAULT: '#003366',
                    light: '#004c99',
                    dark: '#001a33',
                },
                'uah-orange': {
                    DEFAULT: '#F37021',
                    light: '#f58d4d',
                    dark: '#c25a1a',
                },
                'uah-gold': '#ffc107',
                'uah-dark': '#0f172a'
            },
            fontFamily: {
                sans: ['Inter', 'Montserrat', 'Segoe UI', 'sans-serif'],
                heading: ['Montserrat', 'Inter', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        }
    },
    plugins: [],
}
