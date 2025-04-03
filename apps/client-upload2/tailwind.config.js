const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      keyframes: {
        'delete-slide': {
          '0%': { 
            transform: 'translateX(0) rotate(0deg) scale(1)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateX(-150%) rotate(-20deg) scale(0.8)',
            opacity: '0'
          }
        }
      },
      animation: {
        'delete-slide': 'delete-slide 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }
    },
  },
  plugins: [],
};
