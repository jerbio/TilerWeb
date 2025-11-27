import React from 'react';
import { Navigate, Outlet } from 'react-router';
import useAppStore from '@/global_state';
import Spinner from '@/core/common/components/loader';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

/**
 * PublicRoute - Redirects authenticated users away from public pages (like signin/signup)
 * Use this for pages that should only be accessible to non-authenticated users
 */
export const PublicRoute: React.FC = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);

  if (isAuthLoading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (isAuthenticated) {
    // If user is already authenticated, redirect to timeline
    return <Navigate to="/timeline" replace />;
  }

  // User is not authenticated, render the public page
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
