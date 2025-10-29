'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Update resolved theme based on current theme setting
  const updateResolvedTheme = useCallback((currentTheme: Theme) => {
    const newResolvedTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;
    setResolvedTheme(newResolvedTheme);
    
    // Update document class and CSS variables
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Add new theme class
      root.classList.add(newResolvedTheme);
      
      // Update all CSS custom properties
      if (newResolvedTheme === 'dark') {
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ededed');
        root.style.setProperty('--card', '#171717');
        root.style.setProperty('--card-foreground', '#ededed');
        root.style.setProperty('--primary', '#ededed');
        root.style.setProperty('--primary-foreground', '#0a0a0a');
        root.style.setProperty('--secondary', '#262626');
        root.style.setProperty('--secondary-foreground', '#ededed');
        root.style.setProperty('--muted', '#262626');
        root.style.setProperty('--muted-foreground', '#a3a3a3');
        root.style.setProperty('--accent', '#262626');
        root.style.setProperty('--accent-foreground', '#ededed');
        root.style.setProperty('--border', '#404040');
        root.style.setProperty('--input', '#404040');
        root.style.setProperty('--ring', '#ededed');

        // Semantic colors - dark mode
        root.style.setProperty('--success', '#22c55e');
        root.style.setProperty('--success-foreground', '#0a0a0a');
        root.style.setProperty('--success-muted', '#052e16');
        root.style.setProperty('--success-muted-foreground', '#bbf7d0');
        root.style.setProperty('--error', '#ef4444');
        root.style.setProperty('--error-foreground', '#0a0a0a');
        root.style.setProperty('--error-muted', '#450a0a');
        root.style.setProperty('--error-muted-foreground', '#fecaca');
        root.style.setProperty('--warning', '#f97316');
        root.style.setProperty('--warning-foreground', '#0a0a0a');
        root.style.setProperty('--warning-muted', '#431407');
        root.style.setProperty('--warning-muted-foreground', '#fed7aa');
        root.style.setProperty('--info', '#3b82f6');
        root.style.setProperty('--info-foreground', '#0a0a0a');
        root.style.setProperty('--info-muted', '#1e3a8a');
        root.style.setProperty('--info-muted-foreground', '#dbeafe');
      } else {
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#171717');
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--card-foreground', '#171717');
        root.style.setProperty('--primary', '#171717');
        root.style.setProperty('--primary-foreground', '#ffffff');
        root.style.setProperty('--secondary', '#f5f5f5');
        root.style.setProperty('--secondary-foreground', '#171717');
        root.style.setProperty('--muted', '#f5f5f5');
        root.style.setProperty('--muted-foreground', '#737373');
        root.style.setProperty('--accent', '#f5f5f5');
        root.style.setProperty('--accent-foreground', '#171717');
        root.style.setProperty('--border', '#e5e5e5');
        root.style.setProperty('--input', '#e5e5e5');
        root.style.setProperty('--ring', '#171717');

        // Semantic colors - light mode
        root.style.setProperty('--success', '#16a34a');
        root.style.setProperty('--success-foreground', '#ffffff');
        root.style.setProperty('--success-muted', '#dcfce7');
        root.style.setProperty('--success-muted-foreground', '#166534');
        root.style.setProperty('--error', '#dc2626');
        root.style.setProperty('--error-foreground', '#ffffff');
        root.style.setProperty('--error-muted', '#fef2f2');
        root.style.setProperty('--error-muted-foreground', '#991b1b');
        root.style.setProperty('--warning', '#ea580c');
        root.style.setProperty('--warning-foreground', '#ffffff');
        root.style.setProperty('--warning-muted', '#fff7ed');
        root.style.setProperty('--warning-muted-foreground', '#9a3412');
        root.style.setProperty('--info', '#2563eb');
        root.style.setProperty('--info-foreground', '#ffffff');
        root.style.setProperty('--info-muted', '#eff6ff');
        root.style.setProperty('--info-muted-foreground', '#1d4ed8');
      }
    }
  }, [getSystemTheme]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || 'system';
    
    setThemeState(initialTheme);
    updateResolvedTheme(initialTheme);
  }, [updateResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateResolvedTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, updateResolvedTheme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    updateResolvedTheme(theme);
  }, [theme, updateResolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      setTheme(systemTheme === 'light' ? 'dark' : 'light');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
