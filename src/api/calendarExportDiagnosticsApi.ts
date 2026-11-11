import { AppApi } from './appApi';
import type { GoogleCalendarExportSettings } from './googleCalendarExportApi';

export interface CalendarExportDiagnostic extends GoogleCalendarExportSettings {
	provider: string;
	state: string;
	generation: number;
	coverageStart: string | null;
	coverageEnd: string | null;
	lastSuccessAt: string | null;
	nextAttemptAt: string;
	attempts: number;
	errorCode: string | null;
	conflictCount: number;
}

export interface CalendarExportRetryResult {
	userId: string;
	queued: true;
	generation: number;
	scheduledExports: number;
	activeExports: number;
	nativeAlreadyProcessing: boolean;
}

/** Engineering-only endpoint; the server independently enforces admin authorization. */
export class CalendarExportDiagnosticsApi extends AppApi {
	/** Explicit admin action; retry state is committed before acknowledgment. No automatic retry on uncertain responses. */
	async retry(userId: string): Promise<CalendarExportRetryResult> {
		const result = await this.apiRequest<CalendarExportRetryResult>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}/retry`,
			{ method: 'POST', cache: 'no-store' }
		);
		if (
			result.userId !== userId ||
			result.queued !== true ||
			!Number.isSafeInteger(result.generation) ||
			result.generation < 1 ||
			!Number.isInteger(result.scheduledExports) ||
			result.scheduledExports < 0 ||
			!Number.isInteger(result.activeExports) ||
			result.activeExports < 0 ||
			typeof result.nativeAlreadyProcessing !== 'boolean'
		)
			throw new Error('Invalid calendar retry acknowledgment.');
		return result;
	}

	async list(userId: string): Promise<CalendarExportDiagnostic[]> {
		const response = await this.apiRequest<{ exports: CalendarExportDiagnostic[] }>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}`,
			{ cache: 'no-store' }
		);
		if (!Array.isArray(response.exports)) throw new Error('Invalid export diagnostics.');
		return response.exports;
	}
}
