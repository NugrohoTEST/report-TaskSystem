    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#F0F9FF',
              100: '#E0F2FE',
              200: '#BAE6FD',
              500: '#0EA5E9',
              600: '#0284C7',
              700: '#0369A1',
              900: '#0C4A6E',
            },
            accent: {
              50: '#FFFBEB',
              100: '#FEF3C7',
              500: '#F59E0B',
              600: '#D97706',
            },
            obsidian: '#0F172A',
          },
          boxShadow: {
            'card': '0 2px 12px -2px rgba(15, 23, 42, 0.03), 0 1px 3px -1px rgba(15, 23, 42, 0.02)',
            'card-hover': '0 10px 24px -6px rgba(2, 132, 199, 0.08), 0 4px 10px -4px rgba(15, 23, 42, 0.04)',
            'pill': '0 2px 8px rgba(15, 23, 42, 0.04)',
          }
        }
      }
    };
