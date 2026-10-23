import i18n from 'i18next';
import { toast } from 'sonner';
import locationService from '@/services/locationService';
import {
	LocationVerification,
	LOCATION_MAX_LATITUDE,
	LOCATION_MAX_LONGITUDE,
	LOCATION_NOTICE_DURATION_MS,
} from '@/core/constants/location';

export const LOCATION_IGNORED_TOAST_ID = 'request-location-ignored';
const LOCATION_IGNORED_TOAST_CLASS = 'location-ignored-toast';
const REQUEST_URL_BASE = 'https://tiler.invalid';

const UserLocationFields = {
	Latitude: 'userlatitude',
	Longitude: 'userlongitude',
	Verified: 'userlocationverified',
} as const;
const OccurrenceLocationFields = {
	Latitude: 'latitude',
	Longitude: 'longitude',
	Verified: 'locationverified',
} as const;

type Entry = [string, unknown];
type Payload = { entries: Entry[]; encode: (entries: Entry[]) => BodyInit };
const userFields = new Set<string>(Object.values(UserLocationFields));

function readBody(options: RequestInit): Payload | undefined {
	const { body } = options;
	if (body instanceof FormData) {
		return {
			entries: Array.from(body.entries()),
			encode: (entries) => {
				const form = new FormData();
				for (const [key, value] of entries)
					form.append(key, value instanceof Blob ? value : String(value));
				return form;
			},
		};
	}
	if (
		body instanceof URLSearchParams ||
		(typeof body === 'string' &&
			new Headers(options.headers)
				.get('Content-Type')
				?.includes('application/x-www-form-urlencoded'))
	) {
		return {
			entries: Array.from(new URLSearchParams(body).entries()),
			encode: (entries) =>
				new URLSearchParams(entries.map(([key, value]) => [key, String(value)])),
		};
	}
	if (typeof body !== 'string') return;
	try {
		const data: unknown = JSON.parse(body);
		if (data && typeof data === 'object' && !Array.isArray(data)) {
			return {
				entries: Object.entries(data),
				encode: (entries) => JSON.stringify(Object.fromEntries(entries)),
			};
		}
	} catch {
		/* Other body formats do not carry the application's location fields. */
	}
}

function coordinateIsValid(value: unknown, limit: number): boolean {
	return (
		(typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
		Number.isFinite(Number(value)) &&
		Math.abs(Number(value)) <= limit
	);
}

function withoutUnverifiedCoordinates(entries: Entry[], hasAliases: boolean) {
	let changed = false;
	const sanitized: Entry[] = [];
	for (const [key, value] of entries) {
		const name = key.toLowerCase();
		if (
			hasAliases &&
			(name === OccurrenceLocationFields.Latitude ||
				name === OccurrenceLocationFields.Longitude)
		) {
			changed = true;
			continue;
		}
		let next = value;
		if (name === UserLocationFields.Latitude || name === UserLocationFields.Longitude)
			next = '';
		if (
			name === UserLocationFields.Verified ||
			(hasAliases && name === OccurrenceLocationFields.Verified)
		) {
			next = typeof value === 'boolean' ? false : LocationVerification.Unverified;
		}
		if (next !== value) changed = true;
		sanitized.push([key, next]);
	}
	return { entries: sanitized, changed };
}

/** Inspect the final request, not the cached selection. Never touches event venue fields. */
export function prepareRequestLocation(
	endpoint: string,
	options: RequestInit,
	usesUserLocation = false
) {
	if (options.signal?.aborted) return { endpoint, options };
	const url = new URL(endpoint, REQUEST_URL_BASE);
	const query: Entry[] = Array.from(url.searchParams.entries());
	const body = readBody(options);
	const fields = Object.fromEntries(
		[...query, ...(body?.entries ?? [])].map(([key, value]) => [key.toLowerCase(), value])
	);
	const hasUserFields = Object.keys(fields).some((key) => userFields.has(key));
	// Calendar occurrence updates use these aliases for the user's starting point.
	const hasAliases = Object.prototype.hasOwnProperty.call(
		fields,
		OccurrenceLocationFields.Verified
	);
	if (!usesUserLocation && !hasUserFields && !hasAliases) return { endpoint, options };
	const locationFields = hasUserFields ? UserLocationFields : OccurrenceLocationFields;
	const verified = fields[locationFields.Verified];
	const usable =
		(verified === true ||
			(typeof verified === 'string' &&
				verified.toLowerCase() === LocationVerification.Verified)) &&
		coordinateIsValid(fields[locationFields.Latitude], LOCATION_MAX_LATITUDE) &&
		coordinateIsValid(fields[locationFields.Longitude], LOCATION_MAX_LONGITUDE);
	if (usable) return { endpoint, options };

	const safeQuery = withoutUnverifiedCoordinates(query, hasAliases);
	const safeBody = body && withoutUnverifiedCoordinates(body.entries, hasAliases);
	if (safeQuery.changed) {
		url.search = new URLSearchParams(
			safeQuery.entries.map(([key, value]) => [key, String(value)])
		).toString();
		endpoint = endpoint.split(/[?#]/, 1)[0] + url.search + url.hash;
	}
	if (safeBody?.changed && body) options = { ...options, body: body.encode(safeBody.entries) };

	// A single ID updates the visible notice for concurrent requests rather than stacking toasts.
	toast.warning(
		i18n.t('schedulingLocation.requestNotice.title', {
			defaultValue: 'Location ignored for this request',
		}) || 'Location ignored for this request',
		{
			id: LOCATION_IGNORED_TOAST_ID,
			className: LOCATION_IGNORED_TOAST_CLASS,
			description:
				i18n.t('schedulingLocation.requestNotice.description', {
					defaultValue: 'Travel times and nearby suggestions may be less accurate.',
				}) || 'Travel times and nearby suggestions may be less accurate.',
			action: {
				label:
					i18n.t('schedulingLocation.setLocation', { defaultValue: 'Set location' }) ||
					'Set location',
				onClick: () => {
					locationService.openPicker();
					toast.dismiss(LOCATION_IGNORED_TOAST_ID);
				},
			},
			duration: LOCATION_NOTICE_DURATION_MS,
			closeButton: true,
			richColors: true,
		}
	);
	return { endpoint, options };
}
