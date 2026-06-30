import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorScheme } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app_theme_mode';

interface ThemeContextType {
  colors: ColorScheme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  mode: 'system',
  isDark: false,
  setMode: () => {},
});

function getLocalItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setLocalItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function getSystemDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const nativeScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = () => {
    try {
      const stored = getLocalItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    } catch {
      // Default to system
    } finally {
      setLoaded(true);
    }
  };

  const setMode = useCallback(async (newMode: ThemeMode) => {
    try {
      setLocalItem(STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch {
      setModeState(newMode);
    }
  }, []);

  const isDark = mode === 'system'
    ? (nativeScheme === 'dark' || (nativeScheme == null && getSystemDark()))
    : mode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  if (!loaded) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
