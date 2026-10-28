import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarSyncNotice } from '../CalendarSyncNotice';
import { syncStatus, syncUpdate } from '@/services/calendarSyncClient.fixtures';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

describe('calendar sync notice', () => {
	it('shows running work without replacing calendar or edit state', () => {
		render(
			<CalendarSyncNotice
				status={syncUpdate('started')}
				recoveryError={false}
				refreshError={false}
				retry={vi.fn()}
			/>
		);
		expect(screen.getByRole('status')).toHaveTextContent('Updating your calendar');
	});
	it('shows a recoverable retry message for queued failures', () => {
		render(
			<CalendarSyncNotice
				status={syncStatus({
					state: 'queued',
					errorCode: 'ProviderUnavailable',
					willRetry: true,
				})}
				recoveryError={false}
				refreshError={false}
				retry={vi.fn()}
			/>
		);
		expect(screen.getByRole('status')).toHaveTextContent('Trying again');
	});
	it('tells the user to reconnect an expired connection', () => {
		render(
			<CalendarSyncNotice
				status={syncUpdate('failed', {
					errorCode: 'CredentialsRequired',
					willRetry: false,
				})}
				recoveryError={false}
				refreshError={false}
				retry={vi.fn()}
			/>
		);
		expect(screen.getByRole('status')).toHaveTextContent('Reconnect your calendar');
	});
	it('reports a terminal failure without promising saved changes were rolled back', () => {
		render(
			<CalendarSyncNotice
				status={syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry: false })}
				recoveryError={false}
				refreshError={false}
				retry={vi.fn()}
			/>
		);
		expect(screen.getByRole('status')).toHaveTextContent(
			'Calendar updates could not be completed.'
		);
		expect(screen.getByRole('status')).not.toHaveTextContent('unchanged');
	});
	it('does not announce success after a failed display read and offers a read retry', () => {
		const retry = vi.fn();
		render(
			<CalendarSyncNotice
				status={syncUpdate()}
				recoveryError={false}
				refreshError
				retry={retry}
			/>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(retry).toHaveBeenCalledOnce();
		expect(screen.getByRole('status')).toHaveTextContent('could not refresh');
	});
	it('hides the notice after successful completion', () => {
		render(
			<CalendarSyncNotice
				status={syncUpdate()}
				recoveryError={false}
				refreshError={false}
				retry={vi.fn()}
			/>
		);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
});
