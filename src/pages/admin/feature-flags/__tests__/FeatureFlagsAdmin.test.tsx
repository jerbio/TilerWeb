import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import FeatureFlagsAdmin from '@/pages/admin/feature-flags/FeatureFlagsAdmin';
import type { AdminUserFlagRow, AdminUserSummary } from '@/core/common/types/featureFlag';

const mocks = vi.hoisted(() => ({
	adminSearchUsers: vi.fn(),
	adminGetFlagsForUser: vi.fn(),
	adminSetOverride: vi.fn(),
	adminClearOverride: vi.fn(),
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
		selfToggle: vi.fn(),
		adminGetAllFlags: vi.fn(),
		adminSearchUsers: mocks.adminSearchUsers,
		adminGetFlagsForUser: mocks.adminGetFlagsForUser,
		adminSetOverride: mocks.adminSetOverride,
		adminClearOverride: mocks.adminClearOverride,
	},
}));

const USERS: AdminUserSummary[] = [
	{ id: 'u-1', userName: 'alice', email: 'alice@example.com' },
	{ id: 'u-2', userName: 'bob', email: 'bob@example.com' },
];

const FLAGS: AdminUserFlagRow[] = [
	{
		flagId: 'f-1',
		name: 'chat-suggestions',
		description: null,
		isEnabledGlobal: true,
		rolloutPercent: null,
		userToggleable: true,
		resolvedEnabled: false,
		override: {
			isEnabled: false,
			createdBySource: 'PPS',
			createdUtc: '2025-01-01T00:00:00Z',
			updatedUtc: '2025-01-01T00:00:00Z',
			expiresAtUtc: null,
		},
	},
	{
		flagId: 'f-2',
		name: 'smart-scheduling',
		description: null,
		isEnabledGlobal: true,
		rolloutPercent: 50,
		userToggleable: false,
		resolvedEnabled: true,
		override: null,
	},
];

const okUsers = (users: AdminUserSummary[]) =>
	Promise.resolve({
		Content: { users },
		Error: { Code: '0', Message: '' },
		ServerStatus: 0,
	});

const okFlagsForUser = (flags: AdminUserFlagRow[], user = USERS[0]) =>
	Promise.resolve({
		Content: { flagsForUser: { user, flags } },
		Error: { Code: '0', Message: '' },
		ServerStatus: 0,
	});

const okOverride = () =>
	Promise.resolve({
		Content: { override: {} },
		Error: { Code: '0', Message: '' },
		ServerStatus: 0,
	});

describe('FeatureFlagsAdmin', () => {
	beforeEach(() => {
		mocks.adminSearchUsers.mockReset();
		mocks.adminGetFlagsForUser.mockReset();
		mocks.adminSetOverride.mockReset();
		mocks.adminClearOverride.mockReset();
		mocks.navigate.mockReset();
		mocks.toastError.mockReset();
		mocks.toastSuccess.mockReset();

		mocks.adminSearchUsers.mockImplementation(() => okUsers(USERS));
		mocks.adminGetFlagsForUser.mockImplementation(() => okFlagsForUser(FLAGS));
		mocks.adminSetOverride.mockImplementation(() => okOverride());
		mocks.adminClearOverride.mockImplementation(() => okOverride());
	});

	const typeAndSearch = async (value: string) => {
		const input = screen.getByPlaceholderText(/search by username/i);
		fireEvent.change(input, { target: { value } });
		await waitFor(() => expect(mocks.adminSearchUsers).toHaveBeenCalled(), {
			timeout: 1500,
		});
	};

	it('shows search box and prompts for user before loading flags', () => {
		render(<FeatureFlagsAdmin />);
		expect(screen.getByText(/Search for a user/i)).toBeInTheDocument();
		expect(mocks.adminGetFlagsForUser).not.toHaveBeenCalled();
	});

	it('debounces user search and renders matched users', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');

		expect(mocks.adminSearchUsers).toHaveBeenCalledWith('al');
		await waitFor(() => {
			expect(screen.getByText('alice')).toBeInTheDocument();
			expect(screen.getByText('bob')).toBeInTheDocument();
		});
	});

	it('loads flags for the selected user and renders override + default pills', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');
		fireEvent.click(await screen.findByText('alice'));

		await waitFor(() => {
			expect(mocks.adminGetFlagsForUser).toHaveBeenCalledWith('u-1');
		});
		expect(await screen.findByText('chat-suggestions')).toBeInTheDocument();
		expect(screen.getByText(/Override: off/i)).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
		expect(screen.getByText('50% rollout')).toBeInTheDocument();
	});

	it('toggles an override and calls adminSetOverride optimistically', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');
		fireEvent.click(await screen.findByText('alice'));
		await screen.findByText('chat-suggestions');

		const sw = screen.getByRole('switch', { name: /Toggle chat-suggestions/i });
		expect(sw).toHaveAttribute('aria-checked', 'false');

		fireEvent.click(sw);
		expect(sw).toHaveAttribute('aria-checked', 'true');

		await waitFor(() => {
			expect(mocks.adminSetOverride).toHaveBeenCalledWith('f-1', 'u-1', true);
		});
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			expect.stringContaining('chat-suggestions')
		);
	});

	it('clears an override and refreshes the flag list', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');
		fireEvent.click(await screen.findByText('alice'));
		await screen.findByText('chat-suggestions');

		mocks.adminGetFlagsForUser.mockClear();
		mocks.adminGetFlagsForUser.mockImplementation(() =>
			okFlagsForUser([{ ...FLAGS[0], override: null, resolvedEnabled: true }, FLAGS[1]])
		);

		fireEvent.click(screen.getByText('Clear'));

		await waitFor(() => {
			expect(mocks.adminClearOverride).toHaveBeenCalledWith('f-1', 'u-1');
			expect(mocks.adminGetFlagsForUser).toHaveBeenCalledWith('u-1');
		});
	});

	it('reverts the optimistic toggle and shows an error toast when set fails', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');
		fireEvent.click(await screen.findByText('alice'));
		await screen.findByText('chat-suggestions');

		mocks.adminSetOverride.mockRejectedValueOnce(new Error('boom'));

		const sw = screen.getByRole('switch', { name: /Toggle chat-suggestions/i });
		fireEvent.click(sw);

		await waitFor(() => {
			expect(sw).toHaveAttribute('aria-checked', 'false');
		});
		expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('chat-suggestions'));
	});

	it('Change user button returns to the search view', async () => {
		render(<FeatureFlagsAdmin />);
		await typeAndSearch('al');
		fireEvent.click(await screen.findByText('alice'));
		await screen.findByText('chat-suggestions');

		fireEvent.click(screen.getByRole('button', { name: /Change user/i }));

		expect(screen.getByText(/Search for a user/i)).toBeInTheDocument();
	});

	it('navigates back to /admin when the back row is clicked', async () => {
		render(<FeatureFlagsAdmin />);
		fireEvent.click(screen.getByRole('button', { name: /admin/i }));
		expect(mocks.navigate).toHaveBeenCalledWith('/admin');
	});
});
