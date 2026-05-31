import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useTheme } from '@heroui/react';

type AppThemeContextValue = {
  theme: string;
  setTheme: (theme: string) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme('light');

  useEffect(() => {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  return <AppThemeContext.Provider value={{ theme, setTheme }}>{children}</AppThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
};
