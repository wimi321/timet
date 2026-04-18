import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES } from './languages';
import { TranslationKey } from './messages';
import { resolveLocaleCode, translateMessage } from './translate';

interface I18nContextType {
  locale: LanguageCode;
  setLocale: (lang: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);
const LOCALE_STORAGE_KEY = 'timet_locale';
const LEGACY_LOCALE_STORAGE_KEY = 'beacon_locale';

function getInitialLocale(): LanguageCode {
  // 1. Check local storage
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) ?? localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.some((language) => language.code === saved)) {
    return saved as LanguageCode;
  }
  
  // 2. Check browser languages
  const browserLangs = navigator.languages || [navigator.language];
  for (const bLang of browserLangs) {
    const resolved = resolveLocaleCode(bLang);
    if (SUPPORTED_LANGUAGES.some((language) => language.code === resolved)) {
      return resolved;
    }
  }

  // 3. Fallback
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LanguageCode>(getInitialLocale);

  useEffect(() => {
    // Persist and update document dir for RTL
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === locale);
    if (langConfig) {
      document.documentElement.dir = langConfig.direction;
      document.documentElement.lang = langConfig.code;
    }
  }, [locale]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return translateMessage(locale, key, params);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
