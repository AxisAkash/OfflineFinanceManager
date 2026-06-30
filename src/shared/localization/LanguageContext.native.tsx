import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [t, setT] = useState<TranslationKeys>(getTranslation('en'));

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
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
      await SecureStore.setItemAsync(STORAGE_KEY, lang);
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
