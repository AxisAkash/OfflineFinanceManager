import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode, getTranslation, TranslationKeys } from './index';

const STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: LanguageCode;
  t: TranslationKeys;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  translate: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: getTranslation('en'),
  setLanguage: async () => {},
  translate: () => '',
});

function getLocalItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setLocalItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [t, setT] = useState<TranslationKeys>(getTranslation('en'));

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = () => {
    try {
      const stored = getLocalItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'bn') {
        setLanguageState(stored);
        setT(getTranslation(stored));
      }
    } catch {
      // Default to English
    }
  };

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    try {
      setLocalItem(STORAGE_KEY, lang);
      setLanguageState(lang);
      setT(getTranslation(lang));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
      return params[param] !== undefined ? String(params[param]) : `{{${param}}}`;
    });
  }, [t]);

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
