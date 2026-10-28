import { AppApi } from './appApi';
import ServerError from '@/core/error/server';
import { parseCalendarSyncStatus, type CalendarSyncStatus } from '@/services/calendarSyncClient';

export class CalendarSyncApi extends AppApi {
	/** The server derives the user from authentication; there is no caller-supplied user ID. */
	async getStatus(): Promise<CalendarSyncStatus | null> {
		try {
			const response = await this.apiRequest<{ status: unknown }>('api/CalendarSync/Status', {
				cache: 'no-store',
			});
			if (response?.status === null) return null;
			const status = parseCalendarSyncStatus(response?.status);
			if (!status) throw new Error('Invalid calendar synchronization status.');
			return status;
		} catch (error) {
			if (error instanceof ServerError && error.status === 404) return null;
			throw error;
		}
	}
}
