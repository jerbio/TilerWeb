import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { recordTouch, scrubInvalidClickIds } from './attribution';
import { initConversionDestinations, trackConversion } from './conversionTracker';
import { getSessionId, touchSession } from './identity';

/**
 * Captures attribution on entry and on every route change, then emits the
 * `landing` stage once per session.
 *
 * Attribution must be recorded before the first conversion fires, which is why
 * the capture effect is declared first — effects run in declaration order.
 */
export const useConversionTracking = (): void => {
	const location = useLocation();

	useEffect(() => {
		// Must precede destination init: the vendor pixels read the click id from the
		// URL themselves, and a fabricated one is reported as an invalid match key.
		scrubInvalidClickIds();
		recordTouch(window.location.href, document.referrer);
		touchSession();
	}, [location.pathname, location.search]);

	useEffect(() => {
		initConversionDestinations();
		trackConversion('landing', { once: true, dedupeKey: getSessionId() });
	}, []);
};

const ConversionTrackerMount: React.FC = () => {
	useConversionTracking();
	return null;
};

export default ConversionTrackerMount;
