import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { FlaggedRoute } from '@/core/auth/FlaggedRoute';
import useAppStore from '@/global_state';
import { darkTheme } from '@/core/theme/dark';

const TEST_FLAG = 'test-feature-flag';

const renderFlaggedRoute = () =>
	render(
		<ThemeProvider theme={darkTheme}>
			<MemoryRouter initialEntries={['/feature']}>
				<Routes>
					<Route element={<FlaggedRoute flag={TEST_FLAG} />}>
						<Route path="/feature" element={<div>Feature Content</div>} />
					</Route>
					<Route path="/timeline" element={<div>Timeline Page</div>} />
				</Routes>
			</MemoryRouter>
		</ThemeProvider>
	);

beforeEach(() => {
	act(() => {
		useAppStore.setState({
			isAuthLoading: false,
			featureFlags: {},
		});
	});
});

describe('FlaggedRoute', () => {
	describe('when auth is loading', () => {
		it('renders a loader and not the protected content', () => {
			act(() => {
				useAppStore.setState({ isAuthLoading: true });
			});

			renderFlaggedRoute();

			expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
			expect(screen.queryByText('Timeline Page')).not.toBeInTheDocument();
		});
	});

	describe('when the flag is off', () => {
		it('redirects to /timeline', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { [TEST_FLAG]: false } });
			});

			renderFlaggedRoute();

			expect(screen.getByText('Timeline Page')).toBeInTheDocument();
			expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
		});
	});

	describe('when the flag is unknown', () => {
		it('redirects to /timeline', () => {
			act(() => {
				useAppStore.setState({ featureFlags: {} });
			});

			renderFlaggedRoute();

			expect(screen.getByText('Timeline Page')).toBeInTheDocument();
			expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
		});
	});

	describe('when the flag is on', () => {
		it('renders the outlet content', () => {
			act(() => {
				useAppStore.setState({ featureFlags: { [TEST_FLAG]: true } });
			});

			renderFlaggedRoute();

			expect(screen.getByText('Feature Content')).toBeInTheDocument();
			expect(screen.queryByText('Timeline Page')).not.toBeInTheDocument();
		});
	});

	describe('when a custom redirectTo is provided', () => {
		it('redirects to the custom path when the flag is off', () => {
			render(
				<ThemeProvider theme={darkTheme}>
					<MemoryRouter initialEntries={['/feature']}>
						<Routes>
							<Route element={<FlaggedRoute flag={TEST_FLAG} redirectTo="/signin" />}>
								<Route path="/feature" element={<div>Feature Content</div>} />
							</Route>
							<Route path="/signin" element={<div>Sign In Page</div>} />
						</Routes>
					</MemoryRouter>
				</ThemeProvider>
			);

			expect(screen.getByText('Sign In Page')).toBeInTheDocument();
			expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
		});
	});
});
