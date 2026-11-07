import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/test-utils';
import CalendarExportDiagnostics from './CalendarExportDiagnostics';

const api = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/api/calendarExportDiagnosticsApi', () => ({
	CalendarExportDiagnosticsApi: class {
		list = api.list;
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

describe('CalendarExportDiagnostics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.list.mockResolvedValue([record]);
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
