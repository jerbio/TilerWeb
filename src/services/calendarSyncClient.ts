export type CalendarSyncFailure =
	| 'ProviderUnavailable'
	| 'CredentialsRequired'
	| 'CalculationFailed'
	| 'NativeChanged';

interface CalendarSyncResult {
	scheduleRevision: string | null;
	windowStart: string | null;
	windowEnd: string | null;
	scheduleChanged: boolean | null;
}

export interface CalendarSyncUpdate extends CalendarSyncResult {
	eventId: string;
	changeId: string;
	generation: number;
	attempt: number;
	providers: number;
	state: 'started' | 'completed' | 'failed';
	invalidateExternalData: boolean;
	errorCode: CalendarSyncFailure | null;
	willRetry: boolean;
}

export interface CalendarSyncStatus extends CalendarSyncResult {
	state: 'queued' | 'processing' | 'completed' | 'failed';
	requestedGeneration: number;
	generation: number;
	completedGeneration: number;
	attempt: number;
	changeId: string | null;
	providers: number;
	errorCode: CalendarSyncFailure | null;
	willRetry: boolean;
	updatedAt: string;
}

export type CalendarSyncState = CalendarSyncUpdate | CalendarSyncStatus;
const failures = new Set([
	'ProviderUnavailable',
	'CredentialsRequired',
	'CalculationFailed',
	'NativeChanged',
]);
const guid = /^[0-9a-f]{32}$/i;
const integer = (value: unknown, min = 0): value is number =>
	Number.isSafeInteger(value) && (value as number) >= min;
const record = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string =>
	typeof value === 'string' && Number.isFinite(Date.parse(value));
const failure = (value: unknown) =>
	value == null || (typeof value === 'string' && failures.has(value));
const providers = (value: unknown) => integer(value, 1) && value <= 3;
const result = (value: Record<string, unknown>) =>
	typeof value.scheduleRevision === 'string' &&
	value.scheduleRevision.trim().length > 0 &&
	value.scheduleRevision.length <= 400 &&
	date(value.windowStart) &&
	date(value.windowEnd) &&
	Date.parse(value.windowEnd) > Date.parse(value.windowStart) &&
	typeof value.scheduleChanged === 'boolean';
const noResult = (value: Record<string, unknown>) =>
	value.scheduleRevision == null &&
	value.windowStart == null &&
	value.windowEnd == null &&
	value.scheduleChanged == null;

/** Reject malformed messages before they can change presentation or trigger reads. */
export function parseCalendarSyncUpdate(value: unknown): CalendarSyncUpdate | null {
	if (
		!record(value) ||
		typeof value.eventId !== 'string' ||
		!guid.test(value.eventId) ||
		typeof value.changeId !== 'string' ||
		!guid.test(value.changeId) ||
		!integer(value.generation, 1) ||
		!integer(value.attempt, 1) ||
		!providers(value.providers) ||
		typeof value.willRetry !== 'boolean' ||
		typeof value.invalidateExternalData !== 'boolean' ||
		!failure(value.errorCode)
	)
		return null;
	if (value.state === 'completed') {
		if (
			!result(value) ||
			!value.invalidateExternalData ||
			value.errorCode != null ||
			value.willRetry
		)
			return null;
	} else if (value.state === 'started' || value.state === 'failed') {
		if (
			!noResult(value) ||
			value.invalidateExternalData ||
			(value.state === 'started'
				? value.errorCode != null || value.willRetry
				: value.errorCode == null)
		)
			return null;
	} else return null;
	return value as unknown as CalendarSyncUpdate;
}

/** The last committed result can belong to an older generation than the work now running. */
export function parseCalendarSyncStatus(value: unknown): CalendarSyncStatus | null {
	if (
		!record(value) ||
		!['queued', 'processing', 'completed', 'failed'].includes(value.state as string) ||
		!integer(value.requestedGeneration, 1) ||
		!integer(value.generation) ||
		!integer(value.completedGeneration) ||
		value.requestedGeneration < value.generation ||
		value.generation < value.completedGeneration ||
		!integer(value.attempt) ||
		!providers(value.providers) ||
		!failure(value.errorCode) ||
		typeof value.willRetry !== 'boolean' ||
		!date(value.updatedAt) ||
		(value.changeId != null &&
			(typeof value.changeId !== 'string' || !guid.test(value.changeId)))
	)
		return null;
	if (value.completedGeneration > 0 ? !result(value) : !noResult(value)) return null;
	return value as unknown as CalendarSyncStatus;
}

/** One owner/session's ordering state; terminal transitions cannot regress to started or an older attempt. */
export class CalendarSyncCursor {
	private generation = 0;
	private attempt = 0;
	private terminal = false;

	accept(update: CalendarSyncUpdate): boolean {
		if (
			update.generation < this.generation ||
			(update.generation === this.generation && update.attempt < this.attempt)
		)
			return false;
		if (
			update.generation === this.generation &&
			update.attempt === this.attempt &&
			(this.terminal || update.state === 'started')
		)
			return false;
		this.generation = update.generation;
		this.attempt = update.attempt;
		this.terminal = update.state !== 'started';
		return true;
	}

	seed(status: CalendarSyncStatus): void {
		this.generation = status.generation;
		this.attempt = status.attempt;
		this.terminal = status.state !== 'processing';
	}
}

interface CalendarSyncClientOptions {
	readStatus: () => Promise<CalendarSyncStatus | null>;
	refresh: () => void | Promise<void>;
	status: (status: CalendarSyncState) => void;
	recoveryError: (failed: boolean) => void;
	refreshError: (failed: boolean) => void;
}

/** Coordinates pushes and reconnect reads without overlapping refreshes or accepting stale HTTP status. */
export class CalendarSyncClient {
	private readonly cursor = new CalendarSyncCursor();
	private messageVersion = 0;
	private recoveryVersion = 0;
	private disposed = false;
	private dirty = false;
	private refreshing = false;

	constructor(private readonly options: CalendarSyncClientOptions) {}

	receive(value: unknown): void {
		const update = parseCalendarSyncUpdate(value);
		if (this.disposed || !update || !this.cursor.accept(update)) return;
		this.messageVersion++;
		this.options.recoveryError(false);
		this.options.status(update);
		// Existing request persistence can commit before calculation/queue completion fails.
		// Read the saved view in that case while retaining the failed status and retry policy.
		if (
			update.state === 'completed' ||
			(update.state === 'failed' && update.errorCode === 'CalculationFailed')
		)
			this.refresh();
	}

	receiveRefresh(value: unknown): void {
		if (record(value) && 'calendarSync' in value) this.receive(value.calendarSync);
		else this.refresh(); // Existing non-sync schedule notifications retain their behavior.
	}

	async recover(): Promise<void> {
		if (this.disposed) return;
		const version = ++this.recoveryVersion;
		const messages = this.messageVersion;
		try {
			const status = await this.options.readStatus();
			if (this.disposed || version !== this.recoveryVersion) return;
			this.options.recoveryError(false);
			if (!status) return;
			if (messages === this.messageVersion) {
				this.cursor.seed(status);
				this.options.status(status);
			}
			// A missed completion still matters when a newer generation is now running or failed.
			this.refresh();
		} catch {
			if (
				!this.disposed &&
				version === this.recoveryVersion &&
				messages === this.messageVersion
			)
				this.options.recoveryError(true);
		}
	}

	refresh(): void {
		if (this.disposed) return;
		this.dirty = true;
		if (!this.refreshing) void this.drain();
	}

	private async drain(): Promise<void> {
		this.refreshing = true;
		// Combine synchronous bursts and the status/legacy pair into one visible-range read.
		await Promise.resolve();
		while (this.dirty && !this.disposed) {
			this.dirty = false;
			try {
				await this.options.refresh();
				if (!this.disposed) this.options.refreshError(false);
			} catch {
				if (!this.disposed) this.options.refreshError(true);
			}
		}
		this.refreshing = false;
	}

	dispose(): void {
		this.disposed = true;
		this.recoveryVersion++;
		this.dirty = false;
	}
}
