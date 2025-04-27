import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // Detect user language

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: (await import('./locales/en/translations.json')).default,
      },
      es: {
        translation: (await import('./locales/es/translations.json')).default,
      },
    }
  });

export default i18n;