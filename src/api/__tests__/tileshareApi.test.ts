import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TileshareApi } from '../tileshareApi';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

const mockCluster = {
	id: 'TileShareCluster+abc+def',
	name: 'Test Cluster',
	start: 1750755360000,
	end: 1751263140000,
	isCompleted: null,
	isDeleted: null,
	isDismissed: null,
	isMultiTilette: true,
	creator: {
		id: 'user-1',
		username: 'testuser',
		timeZoneDifference: 0,
		timeZone: 'UTC',
		email: 'test@example.com',
		endfOfDay: '2026-05-20T04:30:00+00:00',
		endOfDay: '2026-05-20T04:30:00+00:00',
		phoneNumber: '1234567890',
		fullName: 'Test User',
		firstName: 'Test',
		lastName: 'User',
		countryCode: '1',
	},
	tileShareTemplates: [],
	truncatedUser: 'other@example.com',
};

const mockDesignatedTile = {
	id: 'DesignatedTileTemplate+abc+def',
	name: 'Test Tile',
	template: null,
	displayedIdentifier: 'test@example.com',
	isViable: null,
	invitationStatus: 'accepted',
	tileTemplateId: 'TileShareTemplate+abc+def',
	status: 'accepted',
	isDisabled: false,
	user: mockCluster.creator,
	completionPercent: 100,
	tilerEvent: null,
	clusterOwner: mockCluster.creator,
};

describe('TileshareApi', () => {
	let api: TileshareApi;

	beforeEach(() => {
		api = new TileshareApi();
		fetchSpy.mockReset();
	});

	describe('getOutbox', () => {
		it('sends GET request to api/TileShareCluster?IsOutbox=true', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: '0', Message: 'SUCCESS' },
						Content: { clusters: [mockCluster] },
						ServerStatus: null,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				)
			);

			const result = await api.getOutbox();

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg, options] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).toContain('api/TileShareCluster');
			expect(urlStr).toContain('IsOutbox=true');
			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method ?? 'GET').toBe('GET');
			expect(result.Content.clusters).toHaveLength(1);
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getOutbox()).rejects.toThrow();
		});
	});

	describe('getInbox', () => {
		it('sends GET request to api/DesignatedTile/designated?InvitationStatus=accepted', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: '0', Message: 'SUCCESS' },
						Content: { designatedTiles: [mockDesignatedTile] },
						ServerStatus: null,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				)
			);

			const result = await api.getInbox();

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).toContain('api/DesignatedTile/designated');
			expect(urlStr).toContain('InvitationStatus=accepted');
			expect(result.Content.designatedTiles).toHaveLength(1);
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getInbox()).rejects.toThrow();
		});
	});

	describe('deleteCluster', () => {
		const deleteParams = {
			ClusterId: 'cluster-123',
			MobileApp: true,
			SocketId: null,
			TimeZoneOffset: -360,
			Version: 'v2',
			TimeZone: 'America/Denver',
			IsTimeZoneAdjusted: null,
			getTimeSpan: null,
			UserName: 'testuser',
			UserID: 'user-1',
		};

		it('sends DELETE request to api/TileShareCluster with params and injected location', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: '0', Message: 'SUCCESS' },
						Content: null,
						ServerStatus: null,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				)
			);

			await api.deleteCluster(deleteParams);

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg, options] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).toContain('api/TileShareCluster');
			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method).toBe('DELETE');
			const bodyStr =
				urlArg instanceof Request ? await urlArg.text() : (options?.body as string);
			const body = JSON.parse(bodyStr);
			expect(body.ClusterId).toBe('cluster-123');
			expect(body).toHaveProperty('UserLongitude');
			expect(body).toHaveProperty('UserLatitude');
			expect(body).toHaveProperty('UserLocationVerified');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.deleteCluster(deleteParams)).rejects.toThrow();
		});
	});
});
