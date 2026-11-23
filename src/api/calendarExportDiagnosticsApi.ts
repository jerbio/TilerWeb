import { AppApi } from './appApi';
import type { GoogleCalendarExportSettings } from './googleCalendarExportApi';

export interface CalendarExportDiagnostic extends GoogleCalendarExportSettings {
	destinationLifecycle?: string;
	calendarId?: string | null;
	lastDestinationAuditAt?: string | null;
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

export type CalendarExportRepairResult = Pick<
	CalendarExportRetryResult,
	'userId' | 'queued' | 'scheduledExports' | 'activeExports'
>;

export interface CalendarExportAudit {
	destinations?: CalendarDestinationAudit[];
	nativeAuditComplete?: boolean;
	configurationId: string;
	revision: string;
	windowStart: string;
	windowEnd: string;
	repairStart: string;
	repairEnd: string;
	counts: Record<string, number>;
	discrepancies: {
		nativeEventId: string | null;
		providerEventId: string | null;
		reason: string;
		repairEligible: boolean;
	}[];
}

export interface CalendarDestinationAudit {
	calendarId: string;
	configurationId: string | null;
	authenticationId: string;
	classification: 'Current' | 'Reusable' | 'VerifiedExtra' | 'LegacyUnverified' | 'Conflicting';
	ownershipEvidence: string;
	eventCount: number | null;
	verifiedCopies: number;
	unresolvedEvents: number;
	cleanupEligible: boolean;
}

/** Engineering-only endpoint; the server independently enforces admin authorization. */
export class CalendarExportDiagnosticsApi extends AppApi {
	/** Queues destination recovery; a working destination remains authoritative. */
	async reuseDestination(
		userId: string,
		authenticationId: string,
		calendarId: string
	): Promise<void> {
		await this.destinationAction(userId, 'reuse', { authenticationId, calendarId });
	}

	/** Cleanup remains gated on the server and never queues native recalculation. */
	async cleanupDestinations(userId: string, authenticationId: string): Promise<void> {
		await this.destinationAction(userId, 'cleanup', { authenticationId });
	}

	private async destinationAction(
		userId: string,
		action: 'reuse' | 'cleanup',
		body: { authenticationId: string; calendarId?: string }
	): Promise<void> {
		const result = await this.apiRequest<{ userId: string; queued: boolean }>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}/destinations/${action}`,
			{ method: 'POST', cache: 'no-store', body: JSON.stringify(body) }
		);
		if (result.userId !== userId || result.queued !== true)
			throw new Error('Invalid destination action acknowledgment.');
	}
	/** Complete, read-only provider/native comparison. No automatic repair or retries. */
	async audit(userId: string): Promise<CalendarExportAudit[]> {
		const result = await this.apiRequest<{ userId: string; audits: CalendarExportAudit[] }>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}/audit`,
			{ method: 'POST', cache: 'no-store' }
		);
		if (
			result.userId !== userId ||
			!Array.isArray(result.audits) ||
			result.audits.some(
				(item) =>
					!item ||
					typeof item.configurationId !== 'string' ||
					typeof item.revision !== 'string' ||
					[item.windowStart, item.windowEnd, item.repairStart, item.repairEnd].some(
						(value) => typeof value !== 'string' || !Number.isFinite(Date.parse(value))
					) ||
					!item.counts ||
					Array.isArray(item.counts) ||
					typeof item.counts !== 'object' ||
					Object.values(item.counts).some((n) => !Number.isSafeInteger(n) || n < 0) ||
					!Array.isArray(item.discrepancies) ||
					item.discrepancies.some(
						(entry) =>
							!entry ||
							typeof entry.reason !== 'string' ||
							typeof entry.repairEligible !== 'boolean' ||
							(entry.nativeEventId !== null &&
								typeof entry.nativeEventId !== 'string') ||
							(entry.providerEventId !== null &&
								typeof entry.providerEventId !== 'string')
					)
			)
		)
			throw new Error('Invalid export audit.');
		for (const report of result.audits) {
			if (
				report.destinations !== undefined &&
				(!Array.isArray(report.destinations) ||
					report.destinations.some(
						(destination) =>
							!destination ||
							typeof destination.calendarId !== 'string' ||
							typeof destination.authenticationId !== 'string' ||
							(destination.configurationId !== null &&
								typeof destination.configurationId !== 'string') ||
							![
								'Current',
								'Reusable',
								'VerifiedExtra',
								'LegacyUnverified',
								'Conflicting',
							].includes(destination.classification) ||
							typeof destination.ownershipEvidence !== 'string' ||
							typeof destination.cleanupEligible !== 'boolean' ||
							[destination.verifiedCopies, destination.unresolvedEvents].some(
								(value) => !Number.isSafeInteger(value) || value < 0
							) ||
							(destination.eventCount !== null &&
								(!Number.isSafeInteger(destination.eventCount) ||
									destination.eventCount < 0))
					))
			)
				throw new Error('Invalid destination audit.');
		}
		return result.audits;
	}

	/** Queues reconciliation only; native calculation is requested by the worker only when required. */
	async repair(userId: string): Promise<CalendarExportRepairResult> {
		const result = await this.apiRequest<CalendarExportRepairResult>(
			`api/admin/CalendarExport/users/${encodeURIComponent(userId)}/repair`,
			{ method: 'POST', cache: 'no-store' }
		);
		if (
			result.userId !== userId ||
			result.queued !== true ||
			!Number.isSafeInteger(result.scheduledExports) ||
			result.scheduledExports < 0 ||
			!Number.isSafeInteger(result.activeExports) ||
			result.activeExports < 0
		)
			throw new Error('Invalid calendar repair acknowledgment.');
		return result;
	}

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
