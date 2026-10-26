import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { LOCATION_IGNORED_TOAST_ID, prepareRequestLocation } from '../requestLocation';

vi.mock('sonner', () => ({ toast: { warning: vi.fn(), dismiss: vi.fn() } }));
vi.mock('i18next', () => ({
	default: { t: (_key: string, options: { defaultValue: string }) => options.defaultValue },
}));

beforeEach(() => vi.clearAllMocks());

const verifiedLocation = {
	UserLatitude: '40.7484',
	UserLongitude: '-73.9857',
	UserLocationVerified: 'true',
};
const jsonRequest = (data: Record<string, unknown>, usesLocation = false) =>
	prepareRequestLocation(
		'/api/Schedule/Shuffle',
		{
			method: 'POST',
			body: JSON.stringify(data),
		},
		usesLocation
	);

describe('request location awareness', () => {
	it('leaves verified requests intact without warning', () => {
		const options = { method: 'POST', body: JSON.stringify(verifiedLocation) };
		expect(prepareRequestLocation('/api/Schedule/Shuffle', options)).toEqual({
			endpoint: '/api/Schedule/Shuffle',
			options,
		});
		expect(toast.warning).not.toHaveBeenCalled();
		expect(toast.dismiss).not.toHaveBeenCalled();
	});

	it('accepts zero coordinates and boolean verification', () => {
		jsonRequest({ UserLatitude: 0, UserLongitude: 0, UserLocationVerified: true });
		expect(toast.warning).not.toHaveBeenCalled();
	});

	it.each([
		{ UserLocationVerified: 'false' },
		{ UserLocationVerified: false },
		{ UserLatitude: '' },
		{ UserLatitude: null },
		{ UserLatitude: '91' },
		{ UserLongitude: '-181' },
		{ UserLatitude: 'NaN' },
		{ UserLongitude: 'Infinity' },
		{ UserLatitude: true },
	])('warns and excludes unusable coordinates from the final payload: %j', (overrides) => {
		const prepared = jsonRequest({ ...verifiedLocation, ...overrides, EventID: 'event-1' });
		expect(JSON.parse(prepared.options.body as string)).toEqual({
			EventID: 'event-1',
			UserLatitude: '',
			UserLongitude: '',
			UserLocationVerified:
				typeof overrides.UserLocationVerified === 'boolean' ? false : 'false',
		});
		expect(toast.warning).toHaveBeenCalledWith(
			'Location ignored for this request',
			expect.objectContaining({
				id: LOCATION_IGNORED_TOAST_ID,
				description: 'Travel times and nearby suggestions may be less accurate.',
			})
		);
	});

	it('treats coordinates without a verification flag as unusable', () => {
		const prepared = jsonRequest({ UserLatitude: '40', UserLongitude: '-73' });
		expect(JSON.parse(prepared.options.body as string)).toEqual({
			UserLatitude: '',
			UserLongitude: '',
		});
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it('handles the camel-case fields used for accepting chat changes', () => {
		const prepared = jsonRequest({
			userLatitude: '40',
			userLongitude: '-73',
			userLocationVerified: 'false',
			requestId: 'request-1',
		});
		expect(JSON.parse(prepared.options.body as string)).toEqual({
			userLatitude: '',
			userLongitude: '',
			userLocationVerified: 'false',
			requestId: 'request-1',
		});
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it('handles occurrence-update aliases without removing event venue data', () => {
		const venue = { address: 'Office', latitude: 40, longitude: -73, isVerified: true };
		const prepared = jsonRequest({
			Latitude: 40,
			Longitude: -73,
			LocationVerified: false,
			Location: venue,
			CalAddress: 'Office',
			IsCalAddressVerified: 'true',
		});
		expect(JSON.parse(prepared.options.body as string)).toEqual({
			LocationVerified: false,
			Location: venue,
			CalAddress: 'Office',
			IsCalAddressVerified: 'true',
		});
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it('clears unusable query coordinates while preserving other query parameters and the URL form', () => {
		const prepared = prepareRequestLocation(
			'/api/Schedule/NewTilePrediction?Name=Lunch+%26+coffee&UserLatitude=40&UserLongitude=-73&UserLocationVerified=false',
			{}
		);
		const url = new URL(prepared.endpoint, 'https://test.example.com');
		expect(prepared.endpoint.startsWith('/api/')).toBe(true);
		expect(url.searchParams.get('Name')).toBe('Lunch & coffee');
		expect(url.searchParams.get('UserLatitude')).toBe('');
		expect(url.searchParams.get('UserLongitude')).toBe('');
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it('clears invalid location fields in both query and body', () => {
		const prepared = prepareRequestLocation(
			'https://test.example.com/api/Test?UserLatitude=40&UserLongitude=-73&UserLocationVerified=true',
			{
				method: 'POST',
				body: JSON.stringify({ UserLocationVerified: 'false', CalAddress: 'Office' }),
			}
		);
		expect(new URL(prepared.endpoint).searchParams.get('UserLatitude')).toBe('');
		expect(new URL(prepared.endpoint).searchParams.get('UserLocationVerified')).toBe('false');
		expect(JSON.parse(prepared.options.body as string)).toEqual({
			UserLocationVerified: 'false',
			CalAddress: 'Office',
		});
	});

	it('supports multipart requests without mutating the caller or losing files', () => {
		const form = new FormData();
		form.append('UserLatitude', '40');
		form.append('UserLongitude', '-73');
		form.append('UserLocationVerified', 'false');
		form.append('attachment', new File(['notes'], 'notes.txt', { type: 'text/plain' }));
		const prepared = prepareRequestLocation('/api/Test', { method: 'POST', body: form });
		const sent = prepared.options.body as FormData;
		expect(sent.get('UserLatitude')).toBe('');
		expect((sent.get('attachment') as File).name).toBe('notes.txt');
		expect((sent.get('attachment') as File).size).toBe(5);
		expect(form.get('UserLatitude')).toBe('40');
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it.each([true, false])('supports URL-encoded request bodies (string=%s)', (asString) => {
		const form = new URLSearchParams({
			...verifiedLocation,
			UserLocationVerified: 'false',
			Name: 'Lunch & coffee',
		});
		const prepared = prepareRequestLocation('/api/Test', {
			method: 'POST',
			body: asString ? form.toString() : form,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
		const sent = new URLSearchParams(prepared.options.body as URLSearchParams);
		expect(sent.get('UserLatitude')).toBe('');
		expect(sent.get('Name')).toBe('Lunch & coffee');
		expect(form.get('UserLatitude')).toBe(verifiedLocation.UserLatitude);
	});

	it('warns for a request that tries to use location but has no location fields', () => {
		jsonRequest({ ChatMessage: 'Find lunch' }, true);
		expect(toast.warning).toHaveBeenCalledOnce();
	});

	it('does not warn for unrelated requests or an event venue alone', () => {
		jsonRequest({
			EventID: 'event-1',
			CalAddress: 'Office',
			IsCalAddressVerified: 'false',
			Location: { latitude: 1, longitude: 2, isVerified: false },
		});
		prepareRequestLocation('/api/User', {});
		prepareRequestLocation('/api/Test', { body: 'not JSON' });
		expect(toast.warning).not.toHaveBeenCalled();
	});

	it('does not warn or modify a request that was already cancelled', () => {
		const controller = new AbortController();
		controller.abort();
		const options = {
			method: 'POST',
			signal: controller.signal,
			body: JSON.stringify({ UserLocationVerified: 'false' }),
		};
		expect(prepareRequestLocation('/api/Test', options, true).options).toBe(options);
		expect(toast.warning).not.toHaveBeenCalled();
	});

	it('surfaces every unverified request using one toast ID instead of stacking notices', () => {
		jsonRequest({ UserLocationVerified: 'false' });
		jsonRequest({ UserLocationVerified: 'false' });
		expect(toast.warning).toHaveBeenCalledTimes(2);
		expect(vi.mocked(toast.warning).mock.calls.map((call) => call[1]?.id)).toEqual([
			LOCATION_IGNORED_TOAST_ID,
			LOCATION_IGNORED_TOAST_ID,
		]);
	});

	it('keeps an affected request notice visible when a concurrent request has verified location', () => {
		jsonRequest({ UserLocationVerified: 'false' });
		jsonRequest(verifiedLocation);
		expect(toast.warning).toHaveBeenCalledOnce();
		expect(toast.dismiss).not.toHaveBeenCalled();
	});
});
