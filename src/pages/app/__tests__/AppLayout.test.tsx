import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { RouterProvider } from 'react-router';
import { createMemoryRouter } from 'react-router';
import useAppStore from '@/global_state';
import type { UserInfo } from '@/global_state';
import appRoutes from '@/core/common/data/appRoutes';
import { featureFlags } from '@/core/constants/featureFlags';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey, components }: { i18nKey: string; components?: Array<React.ReactNode> }) => (
		<span>
			{i18nKey}
			{components && Object.values(components)}
		</span>
	),
}));

vi.mock('@/config/config_getter', () => ({
	Env: {
		isDevelopment: () => true,
		get: () => '',
	},
}));

vi.mock('@/core/common/components/icons/logo', () => ({
	default: ({ size }: { size: number }) => (
		<div data-testid="logo" style={{ width: size, height: size }} />
	),
}));

vi.mock('@/core/common/components/profile_sheet', () => ({
	default: React.forwardRef<HTMLDivElement, { open: boolean; user: UserInfo | null }>(
		function MockProfileSheet({ open, user }, ref) {
			return (
				<div
					ref={ref}
					data-testid="profile-sheet"
					style={{ display: open ? 'block' : 'none' }}
				>
					{user?.username}
				</div>
			);
		}
	),
}));

import AppLayout from '../AppLayout';

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/timeline']) {
	const router = createMemoryRouter(
		[
			{
				path: '/',
				element: ui,
				children: appRoutes.map((route) => ({
					path: route.path,
					element: <div data-testid={`route-${route.path.slice(1)}`}>{route.name}</div>,
				})),
			},
		],
		{ initialEntries }
	);

	const view = render(
		<ThemeProvider defaultTheme="dark">
			<RouterProvider router={router} />
		</ThemeProvider>
	);

	return { router, ...view };
}

const defaultLayoutUser: UserInfo = {
	id: 'test-user-id',
	username: 'testuser',
	email: 'test@example.com',
	timeZone: 'UTC',
	timeZoneDifference: 0,
	endOfDay: null,
	phoneNumber: null,
	fullName: 'Test User',
	firstName: 'Test',
	lastName: 'User',
	countryCode: null,
	dateOfBirth: null,
};

/** AppLayout reads `authenticatedUser` for the profile menu; auth gating lives in `ProtectedRoute`, not here. */
function seedLayoutUser(overrides: Partial<UserInfo> = {}) {
	useAppStore.setState({
		authenticatedUser: { ...defaultLayoutUser, ...overrides },
		isAuthenticated: true,
		featureFlags: { [featureFlags.TILESHARE_TAB]: true },
	});
}

describe('AppLayout', () => {
	afterEach(() => {
		vi.resetAllMocks();
		useAppStore.setState({
			authenticatedUser: null,
			isAuthenticated: false,
			featureFlags: {},
		});
	});

	it('renders header with logo and nav links', () => {
		seedLayoutUser();

		renderWithProviders(<AppLayout />);

		expect(screen.getByRole('banner')).toBeInTheDocument();
		expect(screen.getByTestId('logo')).toBeInTheDocument();

		appRoutes.forEach((route) => {
			const link = screen.getByRole('link', { name: new RegExp(route.name, 'i') });
			expect(link).toHaveAttribute('href', route.path);
		});
	});

	it('nav links go to the correct page', async () => {
		const user = userEvent.setup();
		seedLayoutUser();

		const { router } = renderWithProviders(<AppLayout />);

		for (const route of appRoutes) {
			const link = screen.getByRole('link', { name: new RegExp(route.name, 'i') });
			await user.click(link);

			const outletTestId = `route-${route.path.slice(1)}`;
			expect(screen.getByTestId(outletTestId)).toBeInTheDocument();
			expect(router.state.location.pathname).toBe(route.path);
		}
	});

	it('opens profile menu when avatar is clicked', async () => {
		const user = userEvent.setup();
		seedLayoutUser();

		renderWithProviders(<AppLayout />);

		const userIcon = document.querySelector('.lucide-user');
		expect(userIcon).toBeTruthy();
		await user.click(userIcon!.parentElement!);

		const sheet = screen.getByTestId('profile-sheet');
		expect(sheet).toHaveStyle({ display: 'block' });
		expect(screen.getByText('testuser')).toBeInTheDocument();
	});

	it('closes profile menu on outside click', async () => {
		const user = userEvent.setup();
		seedLayoutUser();

		renderWithProviders(<AppLayout />);

		const userIcon = document.querySelector('.lucide-user');
		expect(userIcon).toBeTruthy();
		await user.click(userIcon!.parentElement!);

		const sheet = screen.getByTestId('profile-sheet');
		expect(sheet).toHaveStyle({ display: 'block' });

		fireEvent.mouseDown(document.body);

		await waitFor(() => {
			expect(sheet).toHaveStyle({ display: 'none' });
		});
	});
});
