export enum LocationDecision {
	Confirmed = 'confirmed',
	WithoutLocation = 'withoutLocation',
	Cancelled = 'cancelled',
}

export const LocationSource = {
	Address: 'address',
	Device: 'device',
} as const;
export type LocationSource = (typeof LocationSource)[keyof typeof LocationSource];

export const LocationStage = {
	Idle: 'idle',
	Permission: 'permission',
	Locating: 'locating',
	Resolving: 'resolving',
} as const;
export type LocationStage = (typeof LocationStage)[keyof typeof LocationStage];

export const LocationPermission = {
	Granted: 'granted',
	Denied: 'denied',
	Prompt: 'prompt',
	Unknown: 'unknown',
	Unsupported: 'unsupported',
} as const;
export type LocationPermission = (typeof LocationPermission)[keyof typeof LocationPermission];

export const LocationIssue = {
	Blocked: 'blocked',
	Unavailable: 'unavailable',
	Timeout: 'timeout',
	AddressUnavailable: 'addressUnavailable',
	RefreshNeeded: 'refreshNeeded',
} as const;
export type LocationIssue = (typeof LocationIssue)[keyof typeof LocationIssue] | null;

export const LocationSearchState = {
	Idle: 'idle',
	Searching: 'searching',
	Empty: 'empty',
	Failed: 'failed',
	Ready: 'ready',
} as const;
export type LocationSearchState = (typeof LocationSearchState)[keyof typeof LocationSearchState];

export const LocationVerification = {
	Verified: 'true',
	Unverified: 'false',
} as const;

export enum GeolocationErrorCode {
	PermissionDenied = 1,
	PositionUnavailable = 2,
	Timeout = 3,
}

export const LOCATION_STORAGE_KEY = 'tiler-scheduling-location-v1';
export const LOCATION_STORAGE_VERSION = 1;
export const LOCATION_REFRESH_INTERVAL = 5 * 60 * 1000;
export const LOCATION_MIN_SEARCH_LENGTH = 4;
export const LOCATION_MAX_LATITUDE = 90;
export const LOCATION_MAX_LONGITUDE = 180;
export const LOCATION_PERMISSION_TIMEOUT_MS = 20_000;
export const LOCATION_POSITION_TIMEOUT_MS = 10_000;
export const LOCATION_ADDRESS_TIMEOUT_MS = 10_000;
export const LOCATION_SEARCH_DEBOUNCE_MS = 300;
export const LOCATION_NOTICE_DURATION_MS = 6_500;
