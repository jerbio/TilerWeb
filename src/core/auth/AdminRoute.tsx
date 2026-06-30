import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import useAppStore from '@/global_state';
import Loader from '@/core/common/components/loader';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { adminApi } from '@/api/adminApi';

export const AdminRoute: React.FC = () => {
	const isAuthenticated = useAppStore((state) => state.isAuthenticated);
	const isAuthLoading = useAppStore((state) => state.isAuthLoading);
	const [isAdminLoading, setIsAdminLoading] = useState(false);
	const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
	const location = useLocation();

	useEffect(() => {
		let isMounted = true;

		if (isAuthLoading || !isAuthenticated) {
			setIsAdminLoading(false);
			setHasAdminAccess(null);
			return;
		}

		setIsAdminLoading(true);
		setHasAdminAccess(null);

		adminApi
			.getRoles()
			.then((response) => {
				if (!isMounted) return;

				const roles = response.Error.Code === '0' ? response.Content.roles : [];
				// Server only returns roles from the admin-tier allow-list ('Admin', 'god.user'),
				// so any non-empty array means the caller is allowed.
				setHasAdminAccess(roles.length > 0);
			})
			.catch(() => {
				if (!isMounted) return;

				setHasAdminAccess(false);
			})
			.finally(() => {
				if (!isMounted) return;

				setIsAdminLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [isAuthLoading, isAuthenticated]);

	if (isAuthLoading || isAdminLoading || (isAuthenticated && hasAdminAccess === null)) {
		return (
			<LoadingContainer>
				<Loader />
			</LoadingContainer>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/signin" state={{ from: location }} replace />;
	}

	if (!hasAdminAccess) {
		return <Navigate to="/timeline" replace />;
	}

	return <Outlet />;
};

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background-color: ${palette.colors.black};
`;
