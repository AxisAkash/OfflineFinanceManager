import { en } from './en';
import { bn } from './bn';

export type LanguageCode = 'en' | 'bn';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bangla', nativeName: 'বাংলা' },
];

export const translations: Record<LanguageCode, typeof en> = {
  en: en as typeof en,
  bn: deepMerge(en, bn) as typeof en,
};

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key as keyof typeof source];
    const targetVal = target[key as keyof T];
    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key as keyof T] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key as keyof T] = sourceVal as T[keyof T];
    }
  }
  return result;
}

export function getTranslation(lang: LanguageCode): typeof en {
  return translations[lang] || translations.en;
}

export type TranslationKeys = typeof en;
