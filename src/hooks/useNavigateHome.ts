import { useCallback } from 'react';
import { useNavigate, type NavigateOptions, type To } from 'react-router';
import useAppStore from '@/global_state';

/**
 * Auth-aware navigation hook. Drop-in replacement for useNavigate().
 *
 * Special route:
 *   navigate('home') → /timeline (authenticated) or / (unauthenticated)
 *
 * All other routes pass through to the standard router navigate.
 */
const useAuthNavigate = () => {
	const routerNavigate = useNavigate();
	const isAuthenticated = useAppStore((state) => state.isAuthenticated);

	const navigate = useCallback(
		(to: To | number, options?: NavigateOptions) => {
			if (typeof to === 'number') {
				routerNavigate(to);
				return;
			}

			const path = typeof to === 'string' ? to : to.pathname ?? '';

			if (path === 'home') {
				routerNavigate(isAuthenticated ? '/timeline' : '/', options);
			} else {
				routerNavigate(to, options);
			}
		},
		[routerNavigate, isAuthenticated],
	);

	return navigate;
};

export default useAuthNavigate;
