import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import TimeUtil from '@/core/util/time';

// Import translations
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';
import translationPL from './locales/pl.json';
import translationES from './locales/es.json';
import translationDE from './locales/de.json';
import translationRU from './locales/ru.json';
import translationIT from './locales/it.json';
import translationEL from './locales/el.json';
import translationZH from './locales/zh.json';
import translationJA from './locales/ja.json';
import translationKO from './locales/ko.json';
import translationHI from './locales/hi.json';

const resources = {
	en: {
		translation: translationEN,
	},
	fr: {
		translation: translationFR,
	},
	pl: {
		translation: translationPL,
	},
	es: {
		translation: translationES,
	},
	de: {
		translation: translationDE,
	},
	ru: {
		translation: translationRU,
	},
	it: {
		translation: translationIT,
	},
	el: {
		translation: translationEL,
	},
	zh: {
		translation: translationZH,
	},
	ja: {
		translation: translationJA,
	},
	ko: {
		translation: translationKO,
	},
	hi: {
		translation: translationHI,
	},
};

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: 'en',
		detection: {
			order: ['navigator', 'htmlTag', 'path', 'subdomain'],
			caches: ['localStorage'],
			lookupFromPathIndex: 0,
		},
		interpolation: {
			escapeValue: false, // React already escapes values
		},
	});

// Sync dayjs locale with i18n language on init and on change
TimeUtil.setLocale(i18n.language);
i18n.on('languageChanged', (lng: string) => {
	TimeUtil.setLocale(lng);
});

export default i18n;
