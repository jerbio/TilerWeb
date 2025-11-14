import useAppStore from '@/global_state';

export const useAuth = () => {
	const isAuthenticated = useAppStore((state) => state.isAuthenticated);
	const isAuthLoading = useAppStore((state) => state.isAuthLoading);
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);
	const checkAuth = useAppStore((state) => state.checkAuth);
	const logout = useAppStore((state) => state.logout);
	const setAuthenticated = useAppStore((state) => state.setAuthenticated);

	return {
		isAuthenticated,
		isAuthLoading,
		user: authenticatedUser,
		checkAuth,
		logout,
		setAuthenticated,
	};
};
