import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import CalendarExportDiagnostics from './CalendarExportDiagnostics';

const api = vi.hoisted(() => ({ list: vi.fn(), retry: vi.fn() }));
vi.mock('@/api/calendarExportDiagnosticsApi', () => ({
	CalendarExportDiagnosticsApi: class {
		list = api.list;
		retry = api.retry;
	},
}));
const record = {
	id: 'configuration',
	authenticationId: 'account',
	enabled: true,
	horizonDays: 7,
	state: 'failed',
	generation: 3,
	coverageStart: null,
	coverageEnd: null,
	lastSuccessAt: null,
	nextAttemptAt: '2026-11-03T12:00:00Z',
	attempts: 2,
	errorCode: 'CredentialsRequired',
	conflictCount: 0,
};
const acknowledgment = {
	userId: 'user',
	queued: true,
	generation: 31,
	scheduledExports: 1,
	activeExports: 0,
	nativeAlreadyProcessing: false,
};

describe('CalendarExportDiagnostics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.list.mockResolvedValue([record]);
		api.retry.mockResolvedValue(acknowledgment);
	});
	it('queues the inspected user only after an explicit click and then refreshes diagnostics', async () => {
		render(<CalendarExportDiagnostics />);
		expect(
			screen.queryByRole('button', { name: 'Retry sync and export' })
		).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: ' user ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		const button = await screen.findByRole('button', { name: 'Retry sync and export' });
		expect(api.retry).not.toHaveBeenCalled();
		fireEvent.click(button);
		expect(await screen.findByRole('status')).toHaveTextContent(
			'Sync retry queued. Enabled exports made due: 1'
		);
		expect(api.retry).toHaveBeenCalledExactlyOnceWith('user');
		await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
	});
	it('prevents duplicate queue requests while a retry is pending', async () => {
		let finish!: (value: unknown) => void;
		api.retry.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			})
		);
		render(<CalendarExportDiagnostics />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'user' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		const button = await screen.findByRole('button', { name: 'Retry sync and export' });
		fireEvent.click(button);
		fireEvent.click(button);
		expect(screen.getByRole('button', { name: 'Queuing retry…' })).toBeDisabled();
		expect(screen.getByLabelText('Tiler user ID')).toBeDisabled();
		expect(api.retry).toHaveBeenCalledTimes(1);
		await act(async () => finish(acknowledgment));
	});
	it('does not automatically repeat an unconfirmed retry request', async () => {
		api.retry.mockRejectedValueOnce(new Error('unavailable'));
		render(<CalendarExportDiagnostics />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'user' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Retry sync and export' }));
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Could not confirm the retry request'
		);
		expect(api.retry).toHaveBeenCalledTimes(1);
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
	it('retains queue acknowledgment if refreshing diagnostics fails afterward', async () => {
		api.list.mockResolvedValueOnce([record]).mockRejectedValueOnce(new Error('refresh failed'));
		render(<CalendarExportDiagnostics />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'user' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Retry sync and export' }));
		expect(await screen.findByRole('status')).toHaveTextContent('Sync retry queued');
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Diagnostics could not be loaded'
		);
		expect(api.retry).toHaveBeenCalledTimes(1);
	});
	it('discards retry acknowledgment after navigating to inspect another user', async () => {
		let finish!: (value: unknown) => void;
		api.retry.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			})
		);
		const view = render(<CalendarExportDiagnostics key="old" />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'old' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Retry sync and export' }));
		view.rerender(<CalendarExportDiagnostics key="new" />);
		await act(async () => finish({ ...acknowledgment, userId: 'old' }));
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(api.retry).toHaveBeenCalledWith('old');
	});
	it('loads publishing details only after explicit engineering inspection', async () => {
		render(<CalendarExportDiagnostics />);
		expect(api.list).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: ' user ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		expect(
			await screen.findByRole('cell', { name: /CredentialsRequired/ })
		).toBeInTheDocument();
		expect(api.list).toHaveBeenCalledWith('user');
		expect(screen.getByText('Confirmed coverage')).toBeInTheDocument();
		expect(screen.getByRole('cell', { name: /Attempts: 2/ })).toBeInTheDocument();
	});
	it('displays authorization or transport failures without retrying automatically', async () => {
		api.list.mockRejectedValue(new Error('forbidden'));
		render(<CalendarExportDiagnostics />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'user' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Check admin access');
		expect(api.list).toHaveBeenCalledTimes(1);
	});
	it('discards a response after the target user changes', async () => {
		let finish!: (value: unknown) => void;
		api.list.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			})
		);
		render(<CalendarExportDiagnostics />);
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'old' } });
		fireEvent.click(screen.getByRole('button', { name: 'Inspect / refresh' }));
		await waitFor(() => expect(api.list).toHaveBeenCalledWith('old'));
		fireEvent.change(screen.getByLabelText('Tiler user ID'), { target: { value: 'new' } });
		await act(async () => finish([record]));
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});
});
