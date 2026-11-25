import { AppApi } from './appApi';
import ServerError from '@/core/error/server';

export interface GoogleCalendarExportSettings {
	id: string;
	authenticationId: string;
	enabled: boolean;
	horizonDays: number;
}

function settings(value: unknown): GoogleCalendarExportSettings {
	if (!value || typeof value !== 'object') throw new Error('Invalid Google export settings.');
	const item = value as GoogleCalendarExportSettings;
	if (
		typeof item.id !== 'string' ||
		typeof item.authenticationId !== 'string' ||
		typeof item.enabled !== 'boolean' ||
		!Number.isInteger(item.horizonDays) ||
		item.horizonDays < 1 ||
		item.horizonDays > 30
	)
		throw new Error('Invalid Google export settings.');
	return item;
}

export class GoogleCalendarExportApi extends AppApi {
	/** Coalesces an export request into the signed-in user's existing scheduled work. Call after a successful native save; publication remains asynchronous. */
	async requestUpdate(): Promise<boolean> {
		const response = await this.apiRequest<{ queued: unknown }>(
			'api/CalendarSync/GoogleExport/Request',
			{ method: 'POST' }
		);
		if (typeof response?.queued !== 'boolean')
			throw new Error('Invalid Google export request response.');
		return response.queued;
	}

	/** Disabled rollouts return null; other failures remain visible and retryable. */
	async list(): Promise<GoogleCalendarExportSettings[] | null> {
		try {
			const response = await this.apiRequest<{ exports: unknown[] }>(
				'api/CalendarSync/GoogleExport',
				{ cache: 'no-store' }
			);
			if (!Array.isArray(response.exports))
				throw new Error('Invalid Google export settings.');
			return response.exports.map(settings);
		} catch (error) {
			if (error instanceof ServerError && error.status === 404) return null;
			throw error;
		}
	}

	async configure(
		authenticationId: string,
		enabled: boolean,
		horizonDays: number
	): Promise<GoogleCalendarExportSettings> {
		const response = await this.apiRequest<{ export: unknown }>(
			'api/CalendarSync/GoogleExport',
			{
				method: 'POST',
				body: JSON.stringify({ authenticationId, enabled, horizonDays }),
			}
		);
		const result = settings(response.export);
		if (result.authenticationId !== authenticationId)
			throw new Error('Invalid Google export destination.');
		return result;
	}
}
