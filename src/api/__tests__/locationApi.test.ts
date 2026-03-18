import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationApi } from '../locationApi';
import {
	ScheduleSubCalendarEventLocation,
	LocationResponse,
	LocationSearchResponse,
} from '@/core/common/types/schedule';

// Mock config to provide a base URL
vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

// Spy on global fetch
const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('LocationApi', () => {
	let api: LocationApi;

	const mockLocation: ScheduleSubCalendarEventLocation = {
		id: '7147101b-b226-4bf0-95f5-b9a6959c4689',
		description: 'Downtown Office',
		address: '123 Main St, New York, NY 10001',
		longitude: -73.9857,
		latitude: 40.7484,
		isVerified: true,
		isDefault: false,
		isNull: false,
		thirdPartyId: null,
		userId: 'ee1d526c-6426-46c1-903f-bfa27d578c6d',
		source: 'none',
		nickname: 'Office',
	};

	const mockResponse: LocationResponse = {
		Error: { Code: '0', Message: 'SUCCESS' },
		Content: mockLocation,
		ServerStatus: null,
	};

	beforeEach(() => {
		api = new LocationApi();
		fetchSpy.mockReset();
	});

	describe('getLocation', () => {
		it('sends GET request to /api/Location with correct query params', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.getLocation('7147101b-b226-4bf0-95f5-b9a6959c4689');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/Location');
			expect(urlStr).toContain('id=7147101b-b226-4bf0-95f5-b9a6959c4689');
			expect(urlStr).toContain('version=v2');
		});

		it('returns parsed LocationResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.getLocation('7147101b-b226-4bf0-95f5-b9a6959c4689');

			expect(result.Content.id).toBe('7147101b-b226-4bf0-95f5-b9a6959c4689');
			expect(result.Content.address).toBe('123 Main St, New York, NY 10001');
			expect(result.Content.description).toBe('Downtown Office');
			expect(result.Content.source).toBe('none');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));

			await expect(api.getLocation('bad-id')).rejects.toThrow();
		});
	});

	describe('searchByName', () => {
		const mockSearchResponse: LocationSearchResponse = {
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: [
				{
					id: '59b9b29c-0678-476f-bea2-a187a9b0ced6',
					description: '59b9b29c-0678-476f-bea2-a187a9b0ced6',
					address: 'Walmart',
					longitude: 0,
					latitude: 0,
					isVerified: false,
					isDefault: false,
					isNull: false,
					thirdPartyId: '',
					userId: '6bc6992f-3222-4fd8-9e2b-b94eba2fb717',
					source: 'none',
					nickname: '59b9b29c-0678-476f-bea2-a187a9b0ced6',
				},
				{
					id: 'ChIJFUplA9D0a4cRF5dTgtb_osA',
					description: 'Walmart Supercenter',
					address: 'Walmart Supercenter 745 us-287, lafayette, co 80026, usa',
					longitude: -105.1050841,
					latitude: 40.0057769,
					isVerified: true,
					isDefault: false,
					isNull: false,
					thirdPartyId: 'ChIJFUplA9D0a4cRF5dTgtb_osA',
					userId: null as unknown as string,
					source: 'google',
					nickname: 'walmart supercenter',
				},
			],
			ServerStatus: null,
		};

		it('sends GET request to /api/Location/Name with correct query params', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			await api.searchByName('walmart');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/Location/Name');
			expect(urlStr).toContain('data=walmart');
			expect(urlStr).toContain('includeMapSearch=true');
			expect(urlStr).toContain('mobileApp=true');
		});

		it('returns parsed LocationSearchResponse on success', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(mockSearchResponse), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const result = await api.searchByName('walmart');

			expect(result.Content).toHaveLength(2);
			expect(result.Content[0].source).toBe('none');
			expect(result.Content[1].source).toBe('google');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));

			await expect(api.searchByName('walmart')).rejects.toThrow();
		});
	});
});
