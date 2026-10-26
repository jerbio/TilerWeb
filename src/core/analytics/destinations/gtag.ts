import { getWindow, injectScript } from './types';

export const GTAG_MARKER = 'googletagmanager.com/gtag/js';

type GtagFn = (...args: unknown[]) => void;

/**
 * Installs the standard gtag stub. The stub queues calls into `dataLayer` until
 * the real library loads and drains it, so events fired during script load are
 * never lost.
 */
export const ensureGtag = (): GtagFn => {
	const win = getWindow();

	if (!Array.isArray(win.dataLayer)) {
		win.dataLayer = [];
	}

	if (typeof win.gtag !== 'function') {
		win.gtag = function gtag() {
			// eslint-disable-next-line prefer-rest-params
			(win.dataLayer as unknown[]).push(arguments);
		} as GtagFn;
	}

	return win.gtag as GtagFn;
};

export const loadGtagFor = (measurementId: string): GtagFn => {
	const gtag = ensureGtag();
	const alreadyPresent =
		typeof document !== 'undefined' &&
		document.querySelector(`script[src*="${GTAG_MARKER}"]`) !== null;

	if (!alreadyPresent) {
		injectScript(
			`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
			GTAG_MARKER
		);
		gtag('js', new Date());
	}

	return gtag;
};

export const getGtag = (): GtagFn | null => {
	const win = getWindow();
	return typeof win.gtag === 'function' ? (win.gtag as GtagFn) : null;
};
