import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { AdminRoute } from '@/core/auth/AdminRoute';
import useAppStore from '@/global_state';
import { darkTheme } from '@/core/theme/dark';

const mocks = vi.hoisted(() => ({
	getRoles: vi.fn(),
}));

vi.mock('@/api/adminApi', () => ({
	adminApi: {
		getRoles: mocks.getRoles,
	},
}));

const rolesResponse = (roles: string[]) => ({
	Error: {
		Code: '0',
		Message: 'SUCCESS',
	},
	Content: {
		roles,
	},
	ServerStatus: null,
});

const renderAdminRoute = () =>
	render(
		<ThemeProvider theme={darkTheme}>
			<MemoryRouter initialEntries={['/admin']}>
				<Routes>
					<Route path="/admin" element={<AdminRoute />}>
						<Route index element={<div>Admin Content</div>} />
					</Route>
					<Route path="/signin" element={<div>Sign In Page</div>} />
					<Route path="/timeline" element={<div>Timeline Page</div>} />
				</Routes>
			</MemoryRouter>
		</ThemeProvider>
	);

beforeEach(() => {
	mocks.getRoles.mockReset();
	mocks.getRoles.mockResolvedValue(rolesResponse([]));

	act(() => {
		useAppStore.setState({
			isAuthenticated: false,
			isAuthLoading: false,
			authenticatedUser: null,
		});
	});
});

describe('AdminRoute', () => {
	describe('when auth is loading', () => {
		it('renders a loader and not the protected content', () => {
			act(() => {
				useAppStore.setState({ isAuthLoading: true });
			});

			renderAdminRoute();

			expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
			expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
			expect(screen.queryByText('Timeline Page')).not.toBeInTheDocument();
		});
	});

	describe('when user is not authenticated', () => {
		it('redirects to /signin', async () => {
			renderAdminRoute();

			expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
			expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
		});
	});

	describe('when user is authenticated but not admin', () => {
		it('redirects away from admin content', async () => {
			act(() => {
				useAppStore.setState({
					isAuthenticated: true,
					isAuthLoading: false,
				});
			});

			renderAdminRoute();

			expect(await screen.findByText('Timeline Page')).toBeInTheDocument();
			expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
			expect(mocks.getRoles).toHaveBeenCalledTimes(1);
		});
	});

	describe('when user is authenticated and is admin', () => {
		it('renders the outlet protected content', async () => {
			mocks.getRoles.mockResolvedValue(rolesResponse(['Admin']));

			act(() => {
				useAppStore.setState({
					isAuthenticated: true,
					isAuthLoading: false,
				});
			});

			renderAdminRoute();

			expect(await screen.findByText('Admin Content')).toBeInTheDocument();
			expect(mocks.getRoles).toHaveBeenCalledTimes(1);
		});
	});

	describe('when the admin role check fails', () => {
		it('redirects away from admin content', async () => {
			mocks.getRoles.mockRejectedValue(new Error('forbidden'));

			act(() => {
				useAppStore.setState({
					isAuthenticated: true,
					isAuthLoading: false,
				});
			});

			renderAdminRoute();

			expect(await screen.findByText('Timeline Page')).toBeInTheDocument();
			expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
		});
	});
});
