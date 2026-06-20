import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import useAppStore from '@/global_state';
import Loader from '@/core/common/components/loader';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

export const ProtectedRoute: React.FC = () => {
	const isAuthenticated = useAppStore((state) => state.isAuthenticated);
	const isAuthLoading = useAppStore((state) => state.isAuthLoading);
	const location = useLocation();

	if (isAuthLoading) {
		return (
			<LoadingContainer>
				<Loader />
			</LoadingContainer>
		);
	}

	if (!isAuthenticated) {
		// Redirect to signin, preserve the attempted URL
		return <Navigate to="/signin" state={{ from: location }} replace />;
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
