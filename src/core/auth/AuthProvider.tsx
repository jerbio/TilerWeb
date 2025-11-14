import React, { useEffect } from 'react';
import useAppStore from '@/global_state';

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const checkAuth = useAppStore((state) => state.checkAuth);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	return <>{children}</>;
};
