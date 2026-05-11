import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import FeatureFlagsAdmin from '@/pages/admin/feature-flags/FeatureFlagsAdmin';
import type { AdminFlagEntry } from '@/api/featureFlagApi';

vi.mock('@/hooks/useNavigateHome', () => ({
	default: () => vi.fn(),
}));

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => '/',
		isDevelopment: () => false,
		isProduction: () => true,
	},
}));

const mockAdminGetAllFlags = vi.fn();
const mockAdminUpdateFlag = vi.fn();

vi.mock('@/api/featureFlagApi', () => ({
	featureFlagApi: {
		getFlags: vi.fn(),
		adminGetAllFlags: () => mockAdminGetAllFlags(),
		adminUpdateFlag: (...args: unknown[]) => mockAdminUpdateFlag(...args),
	},
}));

const MOCK_FLAGS: AdminFlagEntry[] = [
	{ name: 'autofill-tile-details', isEnabledGlobal: true, rolloutPercent: null },
	{ name: 'new-calendar-view', isEnabledGlobal: true, rolloutPercent: null },
	{ name: 'chat-suggestions', isEnabledGlobal: false, rolloutPercent: null },
	{ name: 'smart-scheduling', isEnabledGlobal: true, rolloutPercent: 50 },
];

const okFlags = () =>
	Promise.resolve({ Content: { flags: MOCK_FLAGS }, Error: null, ServerStatus: 0 });

const okUpdate = (flag: AdminFlagEntry) =>
	Promise.resolve({ Content: { flag }, Error: null, ServerStatus: 0 });

beforeEach(() => {
	mockAdminGetAllFlags.mockReset();
	mockAdminUpdateFlag.mockReset();
	mockAdminGetAllFlags.mockReturnValue(okFlags());
	mockAdminUpdateFlag.mockImplementation(
		(name: string, isEnabledGlobal: boolean, rolloutPercent: number | null) =>
			okUpdate({ name, isEnabledGlobal, rolloutPercent })
	);
});

describe('FeatureFlagsAdmin', () => {
	describe('rendering', () => {
		it('shows the page title', async () => {
			render(<FeatureFlagsAdmin />);
			expect(await screen.findByText('Feature Flags')).toBeInTheDocument();
		});

		it('renders a row for each flag returned by the API', async () => {
			render(<FeatureFlagsAdmin />);
			for (const flag of MOCK_FLAGS) {
				expect(await screen.findByText(flag.name)).toBeInTheDocument();
			}
		});

		it('renders toggles with correct initial aria-checked state', async () => {
			render(<FeatureFlagsAdmin />);
			const switches = await screen.findAllByRole('switch');
			expect(switches).toHaveLength(MOCK_FLAGS.length);
			MOCK_FLAGS.forEach((flag, i) => {
				expect(switches[i]).toHaveAttribute('aria-checked', String(flag.isEnabledGlobal));
			});
		});

		it('shows rollout pill for flags with a rolloutPercent', async () => {
			render(<FeatureFlagsAdmin />);
			expect(await screen.findByText('50% rollout')).toBeInTheDocument();
		});

		it('does not show rollout pill for flags with null rolloutPercent', async () => {
			render(<FeatureFlagsAdmin />);
			await screen.findAllByRole('switch');
			// Only one flag has a rollout percent, so only one pill should appear
			expect(screen.getAllByText(/% rollout/)).toHaveLength(1);
		});

		it('shows empty state when API returns no flags', async () => {
			mockAdminGetAllFlags.mockReturnValue(
				Promise.resolve({ Content: { flags: [] }, Error: null, ServerStatus: 0 })
			);
			render(<FeatureFlagsAdmin />);
			expect(await screen.findByText('No flags registered.')).toBeInTheDocument();
		});
	});

	describe('toggling', () => {
		it('calls adminUpdateFlag with the flipped value on click', async () => {
			render(<FeatureFlagsAdmin />);
			const switches = await screen.findAllByRole('switch');

			// First flag is enabled (true) — clicking should call with false
			fireEvent.click(switches[0]);

			await waitFor(() => {
				expect(mockAdminUpdateFlag).toHaveBeenCalledWith(
					MOCK_FLAGS[0].name,
					false,
					MOCK_FLAGS[0].rolloutPercent
				);
			});
		});

		it('optimistically flips aria-checked before API resolves', async () => {
			// Delay the API response so we can observe optimistic state
			mockAdminUpdateFlag.mockReturnValue(new Promise(() => {}));

			render(<FeatureFlagsAdmin />);
			const switches = await screen.findAllByRole('switch');
			const firstSwitch = switches[0];

			expect(firstSwitch).toHaveAttribute('aria-checked', 'true');
			fireEvent.click(firstSwitch);

			await waitFor(() => {
				expect(firstSwitch).toHaveAttribute('aria-checked', 'false');
			});
		});

		it('reverts aria-checked when the API call fails', async () => {
			mockAdminUpdateFlag.mockReturnValue(Promise.reject(new Error('Network error')));

			render(<FeatureFlagsAdmin />);
			const switches = await screen.findAllByRole('switch');
			const firstSwitch = switches[0];

			expect(firstSwitch).toHaveAttribute('aria-checked', 'true');
			fireEvent.click(firstSwitch);

			await waitFor(() => {
				expect(firstSwitch).toHaveAttribute('aria-checked', 'true');
			});
		});
	});
});
