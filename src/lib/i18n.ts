import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/translation.json';
import zh from '../locales/zh/translation.json';
import { installLegacyTextTranslator } from './legacyTextTranslator';

const SUPPORTED_LANGUAGES = new Set(['en', 'zh']);

function resolveInitialLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem('i18nextLng');
  const storedBase = stored?.toLowerCase().split('-')[0];
  if (storedBase && SUPPORTED_LANGUAGES.has(storedBase)) {
    return storedBase;
  }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Avoid suspense issues during initial load
    },
  });

if (typeof window !== 'undefined') {
  installLegacyTextTranslator(i18n);
}

export default i18n;
