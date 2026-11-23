import { fireEvent, render, screen, act } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarSyncNotice } from '../CalendarSyncNotice';
import NotificationToast from '@/core/ui/NotificationToast';
import useUiStore from '@/core/ui/uiStore';
import { syncStatus, syncUpdate } from '@/services/calendarSyncClient.fixtures';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
const retry = vi.fn();
const props = {
	ownerId: 'owner',
	status: null,
	activity: null,
	recoveryError: false,
	refreshError: false,
	retry,
};

beforeEach(() => {
	useUiStore.getState().notification.clear();
	retry.mockClear();
});

describe('calendar recalculation toast controller', () => {
	it('does not present a historical failed status as a new error on page load or remount', () => {
		const failed = syncStatus({
			state: 'failed',
			errorCode: 'CalculationFailed',
			willRetry: false,
			updatedAt: '2026-11-11T19:02:23Z',
		});
		const first = render(<CalendarSyncNotice {...props} status={failed} />);
		expect(useUiStore.getState().notification.items).toHaveLength(0);
		first.unmount();
		const next = render(<CalendarSyncNotice {...props} status={failed} />);
		expect(useUiStore.getState().notification.items).toHaveLength(0);
		next.unmount();
	});
	it('renders no inline content and ignores queued or merely started work', () => {
		const view = render(<CalendarSyncNotice {...props} status={syncUpdate('started')} />);
		expect(view.container).not.toHaveTextContent('Updating');
		expect(useUiStore.getState().notification.items).toHaveLength(0);
		view.rerender(<CalendarSyncNotice {...props} status={syncStatus({ state: 'queued' })} />);
		expect(useUiStore.getState().notification.items).toHaveLength(0);
	});
	it('shows one nondismissible toast and waits for the refreshed view', () => {
		const view = render(
			<>
				<CalendarSyncNotice {...props} activity="recalculating" />
				<NotificationToast />
			</>
		);
		expect(
			screen.getByText('Updating your schedule from Google Calendar\u2026')
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Dismiss notification' })
		).not.toBeInTheDocument();
		view.rerender(
			<>
				<CalendarSyncNotice {...props} activity="recalculating" status={syncUpdate()} />
				<NotificationToast />
			</>
		);
		expect(screen.getAllByTestId('notification-toast')).toHaveLength(1);
		view.rerender(
			<>
				<CalendarSyncNotice {...props} status={syncUpdate()} />
				<NotificationToast />
			</>
		);
		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
	});
	it('replaces loading with a dismissible read error and a retry action', () => {
		render(
			<>
				<CalendarSyncNotice {...props} activity="recalculating" refreshError />
				<NotificationToast />
			</>
		);
		expect(screen.getByText('Your calendar view could not refresh.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(retry).toHaveBeenCalledOnce();
	});
	it('shows reconnect guidance and expired activity without a spinner', () => {
		const view = render(
			<>
				<CalendarSyncNotice
					{...props}
					status={syncUpdate('failed', { errorCode: 'CredentialsRequired' })}
				/>
				<NotificationToast />
			</>
		);
		expect(
			screen.getByText('Reconnect your calendar in Settings to resume updates.')
		).toBeInTheDocument();
		view.rerender(
			<>
				<CalendarSyncNotice
					{...props}
					status={syncStatus({ state: 'processing', activityExpired: true })}
				/>
				<NotificationToast />
			</>
		);
		expect(
			screen.getByText('Calendar updating was interrupted. Checking for recovery.')
		).toBeInTheDocument();
		expect(screen.queryByTestId('notification-icon-loading')).not.toBeInTheDocument();
	});
	it('does not offer a display retry as if it could restart terminal backend work', () => {
		render(
			<>
				<CalendarSyncNotice
					{...props}
					status={syncUpdate('failed', {
						errorCode: 'CalculationFailed',
						willRetry: false,
					})}
					showFailure
				/>
				<NotificationToast />
			</>
		);
		expect(screen.getByText('Calendar updates could not be completed.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
	});

	it('keeps a dismissed failure hidden when the same attempt is recovered or callbacks change', () => {
		const failure = syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry: false });
		const view = render(
			<>
				<CalendarSyncNotice {...props} status={failure} showFailure retry={() => {}} />
				<NotificationToast />
			</>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
		view.rerender(
			<>
				<CalendarSyncNotice
					{...props}
					status={syncStatus({
						state: 'failed',
						errorCode: 'CalculationFailed',
						willRetry: false,
					})}
					retry={() => {}}
					showFailure
				/>
				<NotificationToast />
			</>
		);
		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
	});

	it('shows a new failed attempt even when its message matches the dismissed failure', () => {
		const failure = syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry: false });
		const view = render(
			<>
				<CalendarSyncNotice {...props} status={failure} showFailure />
				<NotificationToast />
			</>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
		view.rerender(
			<>
				<CalendarSyncNotice
					{...props}
					status={{ ...failure, attempt: failure.attempt + 1 }}
					showFailure
				/>
				<NotificationToast />
			</>
		);
		expect(screen.getByText('Calendar updates could not be completed.')).toBeInTheDocument();
	});

	it('uses the latest retry callback without replacing an existing read-error toast', () => {
		const first = vi.fn();
		const latest = vi.fn();
		const view = render(
			<>
				<CalendarSyncNotice {...props} refreshError retry={first} />
				<NotificationToast />
			</>
		);
		const item = useUiStore.getState().notification.items[0];
		view.rerender(
			<>
				<CalendarSyncNotice {...props} refreshError retry={latest} />
				<NotificationToast />
			</>
		);
		expect(useUiStore.getState().notification.items[0]).toBe(item);
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(first).not.toHaveBeenCalled();
		expect(latest).toHaveBeenCalledOnce();
	});

	it('cleans up on account changes, anonymous sessions and page unmount', () => {
		const view = render(<CalendarSyncNotice {...props} activity="recalculating" />);
		expect(useUiStore.getState().notification.items[0].id).toBe('calendar-sync-owner');
		view.rerender(<CalendarSyncNotice {...props} ownerId="other" activity="recalculating" />);
		expect(useUiStore.getState().notification.items.map((item) => item.id)).toEqual([
			'calendar-sync-other',
		]);
		view.rerender(<CalendarSyncNotice {...props} ownerId={null} activity="recalculating" />);
		expect(useUiStore.getState().notification.items).toHaveLength(0);
		view.rerender(<CalendarSyncNotice {...props} activity="recalculating" />);
		act(() => view.unmount());
		expect(useUiStore.getState().notification.items).toHaveLength(0);
	});
});
