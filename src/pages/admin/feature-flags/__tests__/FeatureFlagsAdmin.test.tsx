import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import FeatureFlagsAdmin from '@/pages/admin/feature-flags/FeatureFlagsAdmin';
import type { AdminFlagEntry } from '@/api/featureFlagApi';

const mocks = vi.hoisted(() => ({
	adminGetAllFlags: vi.fn(),
	adminUpdateFlag: vi.fn(),
	navigate: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/hooks/useNavigateHome', () => ({
	default: () => mocks.navigate,
}));

vi.mock('sonner', () => ({
	Toaster: () => null,
	toast: {
		error: mocks.toastError,
		success: mocks.toastSuccess,
	},
}));

vi.mock('@/api/featureFlagApi', () => ({
	featureFlagApi: {
		getFlags: vi.fn(),
		adminGetAllFlags: mocks.adminGetAllFlags,
		adminUpdateFlag: mocks.adminUpdateFlag,
	},
}));

const FLAGS: AdminFlagEntry[] = [
	{ name: 'autofill-tile-details', isEnabledGlobal: true, rolloutPercent: null },
	{ name: 'chat-suggestions', isEnabledGlobal: false, rolloutPercent: null },
	{ name: 'smart-scheduling', isEnabledGlobal: true, rolloutPercent: 50 },
];

const responseWithFlags = (flags: AdminFlagEntry[]) =>
	Promise.resolve({ Content: { flags }, Error: null, ServerStatus: 0 });

const getSwitch = async (name: string) => screen.findByRole('switch', { name: `Toggle ${name}` });

describe('FeatureFlagsAdmin', () => {
	beforeEach(() => {
		mocks.adminGetAllFlags.mockReset();
		mocks.adminUpdateFlag.mockReset();
		mocks.navigate.mockReset();
		mocks.toastError.mockReset();
		mocks.toastSuccess.mockReset();
		mocks.adminGetAllFlags.mockReturnValue(responseWithFlags(FLAGS));
		mocks.adminUpdateFlag.mockImplementation(
			(name: string, isEnabledGlobal: boolean, rolloutPercent: number | null) =>
				Promise.resolve({
					Content: { flag: { name, isEnabledGlobal, rolloutPercent } },
					Error: null,
					ServerStatus: 0,
				})
		);
	});

	it('loads admin flags from the API in production mode', async () => {
		render(<FeatureFlagsAdmin />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(await screen.findByText('Feature Flags')).toBeInTheDocument();

		for (const flag of FLAGS) {
			expect(await screen.findByText(flag.name)).toBeInTheDocument();
		}

		expect(mocks.adminGetAllFlags).toHaveBeenCalledTimes(1);
	});

	it('renders switch state and rollout metadata from the loaded flags', async () => {
		render(<FeatureFlagsAdmin />);

		expect(await getSwitch('autofill-tile-details')).toHaveAttribute('aria-checked', 'true');
		expect(await getSwitch('chat-suggestions')).toHaveAttribute('aria-checked', 'false');
		expect(await getSwitch('smart-scheduling')).toHaveAttribute('aria-checked', 'true');
		expect(await screen.findByText('50% rollout')).toBeInTheDocument();
	});

	it('shows an empty state when no flags are registered', async () => {
		mocks.adminGetAllFlags.mockReturnValue(responseWithFlags([]));

		render(<FeatureFlagsAdmin />);

		expect(await screen.findByText('No flags registered.')).toBeInTheDocument();
	});

	it('shows an error toast when loading flags fails', async () => {
		mocks.adminGetAllFlags.mockRejectedValue(new Error('boom'));

		render(<FeatureFlagsAdmin />);

		await waitFor(() => {
			expect(mocks.toastError).toHaveBeenCalledWith('Failed to load feature flags');
		});
		expect(await screen.findByText('No flags registered.')).toBeInTheDocument();
	});

	it('navigates back to the admin page when the back row is clicked', async () => {
		render(<FeatureFlagsAdmin />);

		fireEvent.click(await screen.findByRole('button', { name: /admin/i }));

		expect(mocks.navigate).toHaveBeenCalledWith('/admin');
	});

	it('optimistically toggles a flag and saves the new value', async () => {
		render(<FeatureFlagsAdmin />);

		const chatSuggestions = await getSwitch('chat-suggestions');
		expect(chatSuggestions).toHaveAttribute('aria-checked', 'false');

		fireEvent.click(chatSuggestions);

		expect(chatSuggestions).toHaveAttribute('aria-checked', 'true');
		await waitFor(() => {
			expect(mocks.adminUpdateFlag).toHaveBeenCalledWith('chat-suggestions', true, null);
		});
		expect(mocks.toastSuccess).toHaveBeenCalledWith('"chat-suggestions" turned on');
	});

	it('passes the existing rollout percent when saving a flag', async () => {
		render(<FeatureFlagsAdmin />);

		fireEvent.click(await getSwitch('smart-scheduling'));

		await waitFor(() => {
			expect(mocks.adminUpdateFlag).toHaveBeenCalledWith('smart-scheduling', false, 50);
		});
	});

	it('reverts the optimistic state and shows an error toast when saving fails', async () => {
		mocks.adminUpdateFlag.mockRejectedValue(new Error('save failed'));

		render(<FeatureFlagsAdmin />);

		const autofill = await getSwitch('autofill-tile-details');
		expect(autofill).toHaveAttribute('aria-checked', 'true');

		fireEvent.click(autofill);
		expect(autofill).toHaveAttribute('aria-checked', 'false');

		await waitFor(() => {
			expect(autofill).toHaveAttribute('aria-checked', 'true');
		});
		expect(mocks.toastError).toHaveBeenCalledWith('Failed to update "autofill-tile-details"');
	});
});
