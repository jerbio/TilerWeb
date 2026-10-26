import { createStore } from 'zustand/vanilla';
import type { EventLocation } from '@/core/common/types/schedule';
import {
	GeolocationErrorCode,
	LocationDecision,
	LocationIssue,
	LocationPermission,
	LocationSource,
	LocationStage,
	LocationVerification,
	LOCATION_ADDRESS_TIMEOUT_MS,
	LOCATION_MAX_LATITUDE,
	LOCATION_MAX_LONGITUDE,
	LOCATION_MIN_SEARCH_LENGTH,
	LOCATION_PERMISSION_TIMEOUT_MS,
	LOCATION_POSITION_TIMEOUT_MS,
	LOCATION_REFRESH_INTERVAL,
	LOCATION_STORAGE_KEY,
	LOCATION_STORAGE_VERSION,
} from '@/core/constants/location';

export type { LocationIssue, LocationPermission, LocationStage } from '@/core/constants/location';
export {
	LOCATION_MIN_SEARCH_LENGTH,
	LOCATION_REFRESH_INTERVAL,
	LOCATION_STORAGE_KEY,
} from '@/core/constants/location';

export interface LocationData {
	location: string;
	longitude?: number;
	latitude?: number;
	verified: boolean;
}

export interface SelectedLocation extends LocationData {
	source: LocationSource;
	confirmedAt: number;
	checkedAt: number;
	accuracy?: number;
	id?: string;
}

export interface LocationState {
	active: SelectedLocation | null;
	withoutLocation: boolean;
	candidate: SelectedLocation | null;
	stage: LocationStage;
	permission: LocationPermission;
	issue: LocationIssue;
	pickerOpen: boolean;
	requestNeedsLocation: boolean;
	persistenceFailed: boolean;
}

const emptyLocation = (): LocationData => ({ location: '', verified: false });

export function hasUsableCoordinates(location: LocationData): boolean {
	return (
		location.verified === true &&
		typeof location.latitude === 'number' &&
		Number.isFinite(location.latitude) &&
		Math.abs(location.latitude) <= LOCATION_MAX_LATITUDE &&
		typeof location.longitude === 'number' &&
		Number.isFinite(location.longitude) &&
		Math.abs(location.longitude) <= LOCATION_MAX_LONGITUDE
	);
}

function isSelection(value: unknown): value is SelectedLocation {
	if (!value || typeof value !== 'object') return false;
	const location = value as SelectedLocation;
	return (
		typeof location.location === 'string' &&
		!!location.location.trim() &&
		hasUsableCoordinates(location) &&
		(location.source === LocationSource.Address || location.source === LocationSource.Device) &&
		Number.isFinite(location.confirmedAt) &&
		location.confirmedAt > 0 &&
		Number.isFinite(location.checkedAt) &&
		location.checkedAt > 0 &&
		(location.accuracy === undefined ||
			(Number.isFinite(location.accuracy) && location.accuracy >= 0))
	);
}

/** One confirmed scheduling location. Reading it never requests device permission. */
export class LocationService {
	readonly store = createStore<LocationState>(() => ({
		active: null,
		withoutLocation: false,
		candidate: null,
		stage: LocationStage.Idle,
		permission: LocationPermission.Unknown,
		issue: null,
		pickerOpen: false,
		requestNeedsLocation: false,
		persistenceFailed: false,
	}));
	private hydrated = false;
	private operation = 0;
	private lastAutomaticAttempt = 0;
	private cancelPendingPosition?: () => void;
	private reverseController?: AbortController;
	private pendingDecision?: (decision: LocationDecision) => void;

	initialize() {
		if (this.hydrated) return;
		this.hydrated = true;
		this.restore();
	}

	private restore() {
		try {
			const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
			if (!stored) {
				this.store.setState({ active: null, withoutLocation: false });
				return;
			}
			const parsed: unknown = JSON.parse(stored);
			if (!parsed || typeof parsed !== 'object') return;
			const record = parsed as {
				version?: number;
				active?: unknown;
				withoutLocation?: boolean;
			};
			if (record.version !== LOCATION_STORAGE_VERSION) return;
			const active = isSelection(record.active) ? record.active : null;
			this.store.setState({
				active,
				withoutLocation: !active && record.withoutLocation === true,
			});
		} catch {
			// A blocked or malformed cache must never prevent scheduling.
		}
	}

	private persist() {
		const { active, withoutLocation } = this.store.getState();
		try {
			localStorage.setItem(
				LOCATION_STORAGE_KEY,
				JSON.stringify({ version: LOCATION_STORAGE_VERSION, active, withoutLocation })
			);
			this.store.setState({ persistenceFailed: false });
		} catch {
			this.store.setState({ persistenceFailed: true });
		}
	}

	openPicker = (forRequest = false) => {
		this.initialize();
		this.store.setState({ pickerOpen: true, requestNeedsLocation: forRequest });
	};

	/** Pause a request until the user confirms a choice; closing or aborting cancels it. */
	requestSelectionDecision(signal?: AbortSignal): Promise<LocationDecision> {
		if (signal?.aborted) return Promise.resolve(LocationDecision.Cancelled);
		if (this.hasSelectionDecision()) {
			return Promise.resolve(
				this.store.getState().withoutLocation
					? LocationDecision.WithoutLocation
					: LocationDecision.Confirmed
			);
		}
		this.pendingDecision?.(LocationDecision.Cancelled);
		return new Promise((resolve) => {
			const finish = (decision: LocationDecision) => {
				if (this.pendingDecision === finish) this.pendingDecision = undefined;
				signal?.removeEventListener('abort', cancel);
				resolve(decision);
			};
			const cancel = () => {
				if (this.pendingDecision === finish) this.closePicker();
			};
			this.pendingDecision = finish;
			signal?.addEventListener('abort', cancel, { once: true });
			this.openPicker(true);
		});
	}

	closePicker = () => {
		this.cancelDetection();
		this.store.setState({ pickerOpen: false, requestNeedsLocation: false, candidate: null });
		this.pendingDecision?.(LocationDecision.Cancelled);
	};

	hasSelectionDecision(): boolean {
		this.initialize();
		const { active, withoutLocation } = this.store.getState();
		return active !== null || withoutLocation;
	}

	async getCurrentLocation(): Promise<LocationData> {
		this.initialize();
		const { active } = this.store.getState();
		return active ? { ...active } : emptyLocation();
	}

	/** Results remain drafts until confirmCandidate is called. */
	async searchAddresses(query: string, signal?: AbortSignal): Promise<EventLocation[]> {
		if (query.trim().length < LOCATION_MIN_SEARCH_LENGTH) return [];
		// Lazy loading avoids the AppApi -> locationService -> LocationApi cycle.
		const { LocationApi } = await import('@/api/locationApi');
		const anchor = await this.getCurrentLocation();
		const response = await new LocationApi().searchAnonymousByName(
			query.trim(),
			anchor,
			signal
		);
		if (response.Error && String(response.Error.Code) !== '0')
			throw new Error('Location lookup failed');
		if (!Array.isArray(response.Content)) throw new Error('Invalid location lookup response');
		return response.Content;
	}

	previewAddress(result: EventLocation): boolean {
		this.initialize();
		this.cancelDetection();
		const candidate: SelectedLocation = {
			location: result.address,
			latitude: result.latitude,
			longitude: result.longitude,
			verified: result.isVerified && !result.isNull && !result.isDefault,
			source: LocationSource.Address,
			id: result.id,
			confirmedAt: Date.now(),
			checkedAt: Date.now(),
		};
		if (!isSelection(candidate)) return false;
		this.store.setState({ candidate, issue: null });
		return true;
	}

	confirmCandidate(): boolean {
		const { candidate } = this.store.getState();
		if (!isSelection(candidate)) return false;
		this.operation++;
		this.store.setState({
			active: { ...candidate, confirmedAt: Date.now() },
			withoutLocation: false,
			candidate: null,
			stage: LocationStage.Idle,
			issue: null,
			pickerOpen: false,
			requestNeedsLocation: false,
		});
		this.persist();
		this.pendingDecision?.(LocationDecision.Confirmed);
		return true;
	}

	continueWithoutLocation = () => {
		this.initialize();
		this.cancelDetection();
		this.store.setState({
			active: null,
			withoutLocation: true,
			candidate: null,
			issue: null,
			pickerOpen: false,
			requestNeedsLocation: false,
		});
		this.persist();
		this.pendingDecision?.(LocationDecision.WithoutLocation);
	};

	discardCandidate = () => {
		this.cancelDetection();
		this.store.setState({ candidate: null });
	};

	cancelDetection = () => {
		this.operation++;
		this.cancelPendingPosition?.();
		this.cancelPendingPosition = undefined;
		this.reverseController?.abort();
		this.reverseController = undefined;
		this.store.setState({ stage: LocationStage.Idle });
	};

	async readPermission(): Promise<LocationPermission> {
		if (
			typeof navigator === 'undefined' ||
			!navigator.geolocation ||
			(typeof window !== 'undefined' && window.isSecureContext === false)
		)
			return LocationPermission.Unsupported;
		try {
			if (navigator.permissions?.query) {
				return (await navigator.permissions.query({ name: 'geolocation' })).state;
			}
		} catch {
			/* Older browsers may not support querying geolocation permission. */
		}
		return LocationPermission.Unknown;
	}

	/** Only explicit=true may enter a browser permission flow. Never commits a result. */
	async detectCurrentLocation(explicit = true): Promise<void> {
		this.initialize();
		if (this.store.getState().stage !== LocationStage.Idle) return;
		const operation = ++this.operation;
		this.store.setState({ stage: LocationStage.Permission, issue: null, candidate: null });
		const permission = await this.readPermission();
		if (operation !== this.operation) return;
		this.store.setState({ permission });
		if (
			permission === LocationPermission.Unsupported ||
			permission === LocationPermission.Denied ||
			(!explicit && permission !== LocationPermission.Granted)
		) {
			this.store.setState({
				stage: LocationStage.Idle,
				issue:
					permission === LocationPermission.Denied
						? LocationIssue.Blocked
						: permission === LocationPermission.Unsupported
							? LocationIssue.Unavailable
							: LocationIssue.RefreshNeeded,
			});
			return;
		}
		this.store.setState({
			stage:
				permission === LocationPermission.Granted
					? LocationStage.Locating
					: LocationStage.Permission,
		});
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				// Bound a pending/dismissed permission prompt; late callbacks cannot commit anything.
				const timer = setTimeout(
					() => reject({ code: GeolocationErrorCode.Timeout }),
					LOCATION_PERMISSION_TIMEOUT_MS
				);
				this.cancelPendingPosition = () => {
					clearTimeout(timer);
					reject(new DOMException('Detection cancelled', 'AbortError'));
				};
				navigator.geolocation.getCurrentPosition(
					(value) => {
						clearTimeout(timer);
						resolve(value);
					},
					(error) => {
						clearTimeout(timer);
						reject(error);
					},
					{
						timeout: LOCATION_POSITION_TIMEOUT_MS,
						maximumAge: 0,
						enableHighAccuracy: true,
					}
				);
			});
			if (operation !== this.operation) return;
			this.cancelPendingPosition = undefined;
			const { latitude, longitude, accuracy } = position.coords;
			if (!hasUsableCoordinates({ location: '', latitude, longitude, verified: true }))
				throw { code: GeolocationErrorCode.PositionUnavailable };
			this.store.setState({
				stage: LocationStage.Resolving,
				permission: LocationPermission.Granted,
			});
			const address = await this.reverseGeocode(latitude, longitude);
			if (operation !== this.operation) return;
			this.store.setState({
				candidate: {
					location: address,
					latitude,
					longitude,
					verified: true,
					source: LocationSource.Device,
					accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined,
					confirmedAt: Date.now(),
					checkedAt: Date.now(),
				},
				stage: LocationStage.Idle,
			});
		} catch (error) {
			if (operation !== this.operation) return;
			this.cancelPendingPosition?.();
			this.cancelPendingPosition = undefined;
			const code = (error as { code?: number })?.code;
			const resolving = this.store.getState().stage === LocationStage.Resolving;
			this.store.setState({
				stage: LocationStage.Idle,
				issue: resolving
					? LocationIssue.AddressUnavailable
					: code === GeolocationErrorCode.PermissionDenied
						? LocationIssue.Blocked
						: code === GeolocationErrorCode.Timeout
							? LocationIssue.Timeout
							: LocationIssue.Unavailable,
				...(code === GeolocationErrorCode.PermissionDenied
					? { permission: LocationPermission.Denied }
					: {}),
			});
		}
	}

	async reverseGeocode(latitude: number, longitude: number): Promise<string> {
		// Keep the existing reverse-geocoding provider; name lookup is not reverse geocoding.
		const controller = new AbortController();
		this.reverseController = controller;
		const timer = setTimeout(() => controller.abort(), LOCATION_ADDRESS_TIMEOUT_MS);
		try {
			const params = new URLSearchParams({
				format: 'json',
				lat: String(latitude),
				lon: String(longitude),
				zoom: '18',
				addressdetails: '1',
			});
			const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
				signal: controller.signal,
			});
			if (!response.ok) throw new Error('Address lookup failed');
			const data: { display_name?: string } = await response.json();
			if (typeof data.display_name !== 'string' || !data.display_name.trim())
				throw new Error('No address found');
			return data.display_name;
		} finally {
			clearTimeout(timer);
			if (this.reverseController === controller) this.reverseController = undefined;
		}
	}

	async refreshIfStale(): Promise<void> {
		this.initialize();
		const { active, candidate, stage, pickerOpen } = this.store.getState();
		if (
			active?.source !== LocationSource.Device ||
			candidate ||
			stage !== LocationStage.Idle ||
			pickerOpen ||
			Date.now() - active.checkedAt < LOCATION_REFRESH_INTERVAL ||
			Date.now() - this.lastAutomaticAttempt < LOCATION_REFRESH_INTERVAL
		)
			return;
		this.lastAutomaticAttempt = Date.now();
		await this.detectCurrentLocation(false);
	}

	/** Keep committed choices in sync across tabs; drafts never enter storage. */
	restoreFromStorage = () => {
		this.cancelDetection();
		this.store.setState({ candidate: null, issue: null });
		this.restore();
	};

	toApiFormat(location: LocationData) {
		const usable = hasUsableCoordinates(location);
		return {
			userLongitude: usable ? String(location.longitude) : '',
			userLatitude: usable ? String(location.latitude) : '',
			userLocationVerified: usable
				? LocationVerification.Verified
				: LocationVerification.Unverified,
		};
	}
}

export const locationService = new LocationService();
export default locationService;
