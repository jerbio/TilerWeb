import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleCalendarExportSettings } from './GoogleCalendarExportSettings';

const api = vi.hoisted(() => ({ list: vi.fn(), configure: vi.fn() }));
vi.mock('@/api/googleCalendarExportApi', () => ({
	GoogleCalendarExportApi: class {
		list = api.list;
		configure = api.configure;
	},
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_: string, fallback: string | { defaultValue: string; date: string }) =>
			typeof fallback === 'string'
				? fallback
				: fallback.defaultValue.replace('{{date}}', fallback.date),
	}),
}));
const status = (overrides = {}) => ({
	id: 'export',
	authenticationId: 'account',
	enabled: false,
	horizonDays: 7,
	state: 'disabled',
	coverageEnd: null,
	errorCode: null,
	...overrides,
});

describe('GoogleCalendarExportSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.list.mockResolvedValue([]);
		api.configure.mockResolvedValue(status({ enabled: true, state: 'pending' }));
	});
	it('requires explicit opt-in and persists the horizon on the selected linked account', async () => {
		render(<GoogleCalendarExportSettings authenticationId="account" />);
		const enabled = await screen.findByRole('checkbox');
		expect(enabled).not.toBeChecked();
		expect(screen.getByRole('spinbutton')).toHaveValue(7);
		expect(api.configure).not.toHaveBeenCalled();
		fireEvent.click(enabled);
		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '14' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save publishing settings' }));
		await waitFor(() => expect(api.configure).toHaveBeenCalledWith('account', true, 14));
	});
	it('hides the controls when the server rollout is disabled', async () => {
		api.list.mockResolvedValue(null);
		const view = render(<GoogleCalendarExportSettings authenticationId="account" />);
		await waitFor(() => expect(api.list).toHaveBeenCalled());
		expect(view.container).toBeEmptyDOMElement();
	});
	it('uses the persisted export horizon without showing publishing diagnostics', async () => {
		api.list.mockResolvedValue([
			status({
				enabled: true,
				horizonDays: 14,
				state: 'completed',
				coverageEnd: '2026-11-16T12:00:00Z',
			}),
		]);
		render(<GoogleCalendarExportSettings authenticationId="account" />);
		expect(await screen.findByRole('checkbox')).toBeChecked();
		expect(screen.getByRole('spinbutton')).toHaveValue(14);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(screen.queryByText(/Published through/)).not.toBeInTheDocument();
	});
	it('does not save out-of-range horizons and preserves a failed save for retry', async () => {
		api.configure.mockRejectedValue(new Error('unavailable'));
		render(<GoogleCalendarExportSettings authenticationId="account" />);
		await screen.findByRole('checkbox');
		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } });
		expect(screen.getByRole('button', { name: 'Save publishing settings' })).toBeDisabled();
		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save publishing settings' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded or saved');
		expect(screen.getByRole('spinbutton')).toHaveValue(10);
	});
	it('fences an old account response after navigation', async () => {
		let finish!: (value: unknown) => void;
		api.list
			.mockReturnValueOnce(
				new Promise((resolve) => {
					finish = resolve;
				})
			)
			.mockResolvedValueOnce([]);
		const view = render(<GoogleCalendarExportSettings key="old" authenticationId="old" />);
		view.rerender(<GoogleCalendarExportSettings key="new" authenticationId="new" />);
		await screen.findByRole('checkbox');
		await act(async () =>
			finish([status({ authenticationId: 'old', enabled: true, horizonDays: 30 })])
		);
		expect(screen.getByRole('checkbox')).not.toBeChecked();
		expect(screen.getByRole('spinbutton')).toHaveValue(7);
	});
	it('does not poll publication outcomes or refresh on visibility changes', async () => {
		render(<GoogleCalendarExportSettings authenticationId="account" />);
		await screen.findByRole('checkbox');
		vi.useFakeTimers();
		try {
			await act(async () => {
				vi.advanceTimersByTime(60000);
				document.dispatchEvent(new Event('visibilitychange'));
			});
			expect(api.list).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});
});
