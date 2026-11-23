export type CalendarSyncActivity = 'recalculating';

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
	state: 'started' | 'progress' | 'completed' | 'failed';
	activity?: CalendarSyncActivity | null;
	sequence?: number;
	invalidateExternalData: boolean;
	errorCode: CalendarSyncFailure | null;
	willRetry: boolean;
}

export interface CalendarSyncStatus extends CalendarSyncResult {
	state: 'queued' | 'processing' | 'completed' | 'failed';
	activity?: CalendarSyncActivity | null;
	sequence?: number;
	activityExpired?: boolean;
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
	if (value.sequence != null && !integer(value.sequence)) return null;
	if (value.state !== 'progress' && value.activity != null) return null;
	if (value.state === 'progress') {
		if (
			!noResult(value) ||
			value.activity !== 'recalculating' ||
			!integer(value.sequence, 1) ||
			value.errorCode != null ||
			value.willRetry ||
			value.invalidateExternalData
		)
			return null;
	} else if (value.state === 'completed') {
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
	if (value.sequence != null && !integer(value.sequence)) return null;
	if (
		value.activity != null &&
		(value.activity !== 'recalculating' || value.state !== 'processing')
	)
		return null;
	if (value.activityExpired != null && typeof value.activityExpired !== 'boolean') return null;
	if (value.activityExpired && (value.activity != null || value.state !== 'processing'))
		return null;
	if (value.completedGeneration > 0 ? !result(value) : !noResult(value)) return null;
	return value as unknown as CalendarSyncStatus;
}

/** One owner/session's ordering state; terminal transitions cannot regress to started or an older attempt. */
export class CalendarSyncCursor {
	private generation = 0;
	private attempt = 0;
	private sequence = 0;
	private terminal = false;

	isOlder(value: { generation: number; attempt: number; sequence?: number }): boolean {
		return (
			value.generation < this.generation ||
			(value.generation === this.generation &&
				(value.attempt < this.attempt ||
					(value.attempt === this.attempt &&
						(value.sequence ?? 0) > 0 &&
						this.sequence > 0 &&
						(value.sequence ?? 0) < this.sequence)))
		);
	}

	accept(update: CalendarSyncUpdate): boolean {
		if (this.isOlder(update)) return false;
		const same = update.generation === this.generation && update.attempt === this.attempt;
		if (
			same &&
			(this.terminal ||
				update.state === 'started' ||
				((update.sequence ?? 0) > 0 && update.sequence === this.sequence))
		)
			return false;
		this.generation = update.generation;
		this.attempt = update.attempt;
		this.sequence = update.sequence ?? 0;
		this.terminal = update.state === 'completed' || update.state === 'failed';
		return true;
	}

	seed(status: CalendarSyncStatus): boolean {
		if (this.isOlder(status)) return false;
		if (
			status.generation === this.generation &&
			status.attempt === this.attempt &&
			this.terminal &&
			status.state === 'processing'
		)
			return false;
		this.generation = status.generation;
		this.attempt = status.attempt;
		this.sequence = status.sequence ?? 0;
		this.terminal = status.state !== 'processing';
		return true;
	}
}

interface CalendarSyncClientOptions {
	readStatus: () => Promise<CalendarSyncStatus | null>;
	/** false means this lookup was superseded and never reached the displayed calendar. */
	refresh: () => void | boolean | Promise<void | boolean>;
	status: (status: CalendarSyncState) => void;
	recoveryError: (failed: boolean) => void;
	refreshError: (failed: boolean) => void;
	activity?: (activity: CalendarSyncActivity | null) => void;
	/** Presentation only: a historical failed snapshot must remain status without becoming a new toast. */
	failureVisibility?: (visible: boolean) => void;
}

/** Coordinates user-scoped activity, ordered pushes, recovery and visible-range refreshes. */
export class CalendarSyncClient {
	private readonly cursor = new CalendarSyncCursor();
	private messageVersion = 0;
	private recoveryVersion = 0;
	private disposed = false;
	private dirty = false;
	private refreshing = false;
	private latest: CalendarSyncState | null = null;
	private failureIsCurrent = false;
	private currentActivity: CalendarSyncActivity | null = null;
	private activityGeneration = 0;
	private activityAttempt = 0;
	private awaitingDisplay = false;
	private pollTimer: ReturnType<typeof setTimeout> | null = null;
	private refreshRetryTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private readonly options: CalendarSyncClientOptions) {}

	private setActivity(activity: CalendarSyncActivity | null): void {
		if (activity === this.currentActivity) return;
		this.currentActivity = activity;
		this.options.activity?.(activity);
	}

	private applyState(state: CalendarSyncState, liveNotification: boolean): void {
		const previous = this.latest;
		const sameAttempt =
			previous != null &&
			previous.generation === state.generation &&
			previous.attempt === state.attempt &&
			previous.changeId === state.changeId;
		const failed = state.state === 'failed' || state.errorCode != null;
		let showFailure = false;
		if (failed) {
			if (sameAttempt && (previous.state === 'failed' || previous.errorCode != null)) {
				// Reconnects and delayed duplicate pushes cannot promote historical failure to a new one.
				showFailure = this.failureIsCurrent;
			} else if (!(sameAttempt && previous.state === 'completed')) {
				const newerAttempt =
					previous != null &&
					(state.generation > previous.generation ||
						(state.generation === previous.generation &&
							state.attempt > previous.attempt));
				const wasPending =
					sameAttempt &&
					previous.errorCode == null &&
					['started', 'progress', 'queued', 'processing'].includes(previous.state);
				showFailure = liveNotification || newerAttempt || wasPending;
			}
		}
		this.failureIsCurrent = showFailure;
		this.options.status(state);
		this.options.failureVisibility?.(showFailure);
		this.applyActivity(state);
	}

	private applyActivity(state: CalendarSyncState): void {
		this.latest = state;
		if (state.activity) {
			this.activityGeneration = state.generation;
			this.activityAttempt = state.attempt;
			this.awaitingDisplay = false;
			this.setActivity(state.activity);
		} else if (
			state.state === 'failed' ||
			state.errorCode ||
			('activityExpired' in state && state.activityExpired)
		) {
			this.awaitingDisplay = false;
			this.setActivity(null);
		} else if (this.currentActivity) {
			const completed =
				state.state === 'completed' ||
				('completedGeneration' in state &&
					state.completedGeneration >= this.activityGeneration);
			if (completed) this.awaitingDisplay = true;
			else if (
				state.generation > this.activityGeneration ||
				(state.generation === this.activityGeneration &&
					state.attempt > this.activityAttempt)
			) {
				this.awaitingDisplay = false;
				this.setActivity(null);
			}
		}
		this.schedulePoll();
	}

	receive(value: unknown): void {
		const update = parseCalendarSyncUpdate(value);
		if (this.disposed || !update || !this.cursor.accept(update)) return;
		this.messageVersion++;
		this.options.recoveryError(false);
		this.applyState(update, true);
		if (
			update.state === 'completed' ||
			(update.state === 'failed' && update.errorCode === 'CalculationFailed')
		)
			this.refresh();
	}

	receiveRefresh(value: unknown): void {
		if (record(value) && 'calendarSync' in value) this.receive(value.calendarSync);
		else this.refresh();
	}

	async recover({
		refresh = true,
		seedCursor = true,
	}: { refresh?: boolean; seedCursor?: boolean } = {}): Promise<void> {
		if (this.disposed) return;
		const version = ++this.recoveryVersion;
		const messages = this.messageVersion;
		try {
			const status = await this.options.readStatus();
			if (this.disposed || version !== this.recoveryVersion) return;
			this.options.recoveryError(false);
			if (!status) {
				if (messages === this.messageVersion) {
					this.latest = null;
					this.failureIsCurrent = false;
					this.options.failureVisibility?.(false);
					this.awaitingDisplay = false;
					this.setActivity(null);
					this.schedulePoll();
				}
				return;
			}
			if (
				messages === this.messageVersion &&
				!this.cursor.isOlder(status) &&
				(!seedCursor || this.cursor.seed(status))
			) {
				this.applyState(status, false);
			}
			if (refresh || this.awaitingDisplay) this.refresh();
		} catch {
			if (
				!this.disposed &&
				version === this.recoveryVersion &&
				messages === this.messageVersion
			)
				this.options.recoveryError(true);
		} finally {
			if (!this.disposed) this.schedulePoll();
		}
	}

	private schedulePoll(): void {
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = null;
		if (
			this.disposed ||
			!this.latest ||
			!['started', 'progress', 'queued', 'processing'].includes(this.latest.state)
		)
			return;
		this.pollTimer = setTimeout(() => {
			this.pollTimer = null;
			void this.recover({ refresh: false });
		}, 5000);
	}

	refresh(): void {
		if (this.disposed) return;
		if (this.refreshRetryTimer) clearTimeout(this.refreshRetryTimer);
		this.refreshRetryTimer = null;
		this.dirty = true;
		if (!this.refreshing) void this.drain();
	}

	private async drain(): Promise<void> {
		this.refreshing = true;
		await Promise.resolve();
		while (this.dirty && !this.disposed) {
			this.dirty = false;
			const generation = this.activityGeneration;
			const attempt = this.activityAttempt;
			try {
				const applied = await this.options.refresh();
				if (!this.disposed) {
					if (applied === false) {
						// Yield to React so navigation/readiness can install the new range callback.
						// Immediate microtask retries can otherwise starve that render forever.
						if (this.awaitingDisplay || this.dirty) {
							if (this.refreshRetryTimer) clearTimeout(this.refreshRetryTimer);
							this.refreshRetryTimer = setTimeout(() => {
								this.refreshRetryTimer = null;
								this.refresh();
							}, 100);
						}
						break;
					}
					this.options.refreshError(false);
					if (
						!this.dirty &&
						this.awaitingDisplay &&
						generation === this.activityGeneration &&
						attempt === this.activityAttempt
					) {
						this.awaitingDisplay = false;
						this.setActivity(null);
					}
				}
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
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.refreshRetryTimer) clearTimeout(this.refreshRetryTimer);
		this.pollTimer = null;
		this.refreshRetryTimer = null;
	}
}
