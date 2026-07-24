import React from 'react';
import { Navigate, Outlet } from 'react-router';
import useAppStore from '@/global_state';
import { useFlag } from '@/hooks/useFlag';
import Loader from '@/core/common/components/loader';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

interface Props {
	flag: string;
	redirectTo?: string;
}

export const FlaggedRoute: React.FC<Props> = ({ flag, redirectTo = '/timeline' }) => {
	const isAuthLoading = useAppStore((state) => state.isAuthLoading);
	const isEnabled = useFlag(flag);

	if (isAuthLoading) {
		return (
			<LoadingContainer>
				<Loader />
			</LoadingContainer>
		);
	}

	return isEnabled ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background-color: ${palette.colors.black};
`;
