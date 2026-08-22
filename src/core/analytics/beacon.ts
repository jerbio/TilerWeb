/**
 * Transport for server-side conversion events.
 *
 * `sendBeacon` first: a plain fetch issued immediately before a navigation is
 * cancelled by the browser, which silently loses exactly the CTA and signup
 * events that matter most.
 */

export type BeaconTransport = 'sendBeacon' | 'fetch';

export type BeaconResult = {
	status: 'sent' | 'error';
	transport: BeaconTransport;
	attempts: number;
};

export type BeaconOptions = {
	maxAttempts?: number;
	retryDelayMs?: number;
};

const delay = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

export const postBeacon = async (
	url: string,
	payload: unknown,
	options: BeaconOptions = {}
): Promise<BeaconResult> => {
	const { maxAttempts = 3, retryDelayMs = 500 } = options;
	const body = JSON.stringify(payload);

	try {
		if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
			const blob = new Blob([body], { type: 'application/json' });
			if (navigator.sendBeacon(url, blob)) {
				return { status: 'sent', transport: 'sendBeacon', attempts: 1 };
			}
		}
	} catch {
		// Fall through to fetch.
	}

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				keepalive: true,
				credentials: 'include',
			});
			if (response?.ok) {
				return { status: 'sent', transport: 'fetch', attempts: attempt };
			}
		} catch {
			// Retry below.
		}

		if (attempt < maxAttempts && retryDelayMs > 0) {
			await delay(retryDelayMs * attempt);
		}
	}

	return { status: 'error', transport: 'fetch', attempts: maxAttempts };
};
