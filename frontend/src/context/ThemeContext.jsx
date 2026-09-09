import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme options: 'light' | 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('prepnova_theme');
      if (saved) {
        const normalized = saved.toLowerCase();
        if (normalized === 'light' || normalized === 'dark') {
          return normalized;
        }
      }
    } catch (_) {}
    return 'dark';
  });

  const isDark = theme === 'dark';

  // Apply theme to DOM
  const applyTheme = (themeValue) => {
    const root = document.documentElement;
    const effectiveDark = themeValue === 'dark';

    if (effectiveDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');
    }
  };

  const setTheme = (newTheme) => {
    const normalized = (newTheme || 'dark').toLowerCase() === 'light' ? 'light' : 'dark';
    setThemeState(normalized);
    try {
      localStorage.setItem('prepnova_theme', normalized);
    } catch (_) {}
    applyTheme(normalized);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      setTheme: () => {},
      isDark: true,
      toggleTheme: () => {}
    };
  }
  return context;
}

