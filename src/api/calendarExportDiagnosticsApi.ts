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

/** Engineering-only endpoint; the server independently enforces admin authorization. */
export class CalendarExportDiagnosticsApi extends AppApi {
	async list(userId: string): Promise<CalendarExportDiagnostic[]> {
		const response = await this.apiRequest<{ exports: CalendarExportDiagnostic[] }>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}`,
			{ cache: 'no-store' }
		);
		if (!Array.isArray(response.exports)) throw new Error('Invalid export diagnostics.');
		return response.exports;
	}
}
