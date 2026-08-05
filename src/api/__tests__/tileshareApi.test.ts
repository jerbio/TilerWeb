import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TileshareApi } from '../tileshareApi';
import { InvitationStatus } from '@/core/common/types/tileshare';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

/** Build a 200 JSON Response for the standard Content envelope. */
function jsonResponse(content: unknown) {
	return new Response(
		JSON.stringify({
			Error: { Code: '0', Message: 'SUCCESS' },
			Content: content,
			ServerStatus: null,
		}),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
}

/** Extract the request URL string from a fetch mock call regardless of arg form. */
function urlOf(call: Parameters<typeof fetch>): string {
	const [urlArg] = call;
	return urlArg instanceof Request
		? urlArg.url
		: typeof urlArg === 'string'
			? urlArg
			: String(urlArg);
}

const mockTemplate = {
	id: 'TileShareTemplate+abc+def',
	name: 'Test Tilette',
	clusterId: 'TileShareCluster+abc+def',
	start: 1750755360000,
	end: 1751263140000,
	duration: 3600000,
	creator: null,
	designatedUsers: [],
	miscData: { id: 'misc-1', userNote: 'note' },
};

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
		it('appends provided params as query string', async () => {
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

			const result = await api.getClusters({ IsOutbox: true });

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

		it('omits query string when no params given', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: '0', Message: 'SUCCESS' },
						Content: { clusters: [] },
						ServerStatus: null,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				)
			);

			await api.getClusters();

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).not.toContain('?');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getClusters({ IsOutbox: true })).rejects.toThrow();
		});
	});

	describe('getInbox', () => {
		it('appends provided params as query string', async () => {
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

			const result = await api.getDesignatedTiles({
				InvitationStatus: InvitationStatus.Accepted,
			});

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

		it('omits query string when no params given', async () => {
			fetchSpy.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						Error: { Code: '0', Message: 'SUCCESS' },
						Content: { designatedTiles: [] },
						ServerStatus: null,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				)
			);

			await api.getDesignatedTiles();

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr =
				urlArg instanceof Request
					? urlArg.url
					: typeof urlArg === 'string'
						? urlArg
						: String(urlArg);
			expect(urlStr).not.toContain('?');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(
				api.getDesignatedTiles({ InvitationStatus: InvitationStatus.Accepted })
			).rejects.toThrow();
		});
	});

	describe('getClusterHeader', () => {
		it('requests the cluster route with ClusterId and no DataFormat', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse({ cluster: mockCluster }));

			await api.getClusterHeader('cluster-123');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const urlStr = urlOf(fetchSpy.mock.calls[0]);
			expect(urlStr).toContain('api/TileShareCluster');
			expect(urlStr).toContain('ClusterId=cluster-123');
			expect(urlStr).not.toContain('DataFormat');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getClusterHeader('cluster-123')).rejects.toThrow();
		});
	});

	describe('getClusterTilettes', () => {
		it('requests the template route with TileShareClusterId and Format=full', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse({ tileShareTemplates: [mockTemplate] }));

			const result = await api.getClusterTilettes('cluster-123');

			const urlStr = urlOf(fetchSpy.mock.calls[0]);
			expect(urlStr).toContain('api/TileshareTemplate');
			expect(urlStr).toContain('TileShareClusterId=cluster-123');
			expect(urlStr).toContain('Format=full');
			expect(result.Content.tileShareTemplates).toHaveLength(1);
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getClusterTilettes('cluster-123')).rejects.toThrow();
		});
	});

	describe('getTilette', () => {
		it('requests the template route with Id and Format=full', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse({ tileShareTemplate: mockTemplate }));

			await api.getTilette('tilette-1');

			const urlStr = urlOf(fetchSpy.mock.calls[0]);
			expect(urlStr).toContain('api/TileshareTemplate');
			expect(urlStr).toContain('Id=tilette-1');
			expect(urlStr).toContain('Format=full');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.getTilette('tilette-1')).rejects.toThrow();
		});
	});

	describe('updateCluster', () => {
		it('sends a PUT to api/TileShareCluster with the given body', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse({ cluster: mockCluster }));

			await api.updateCluster({
				Id: 'cluster-123',
				Name: 'Renamed',
				StartTime: 1,
				EndTime: 2,
			});

			const [urlArg, options] = fetchSpy.mock.calls[0];
			expect(urlOf(fetchSpy.mock.calls[0])).toContain('api/TileShareCluster');
			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method).toBe('PUT');
			const bodyStr =
				urlArg instanceof Request ? await urlArg.text() : (options?.body as string);
			// The PUT model binds `Id`; a `ClusterId` key binds nothing and 404s.
			expect(JSON.parse(bodyStr)).toEqual({
				Id: 'cluster-123',
				Name: 'Renamed',
				StartTime: 1,
				EndTime: 2,
			});
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(
				api.updateCluster({ Id: 'cluster-123', StartTime: 1, EndTime: 2 })
			).rejects.toThrow();
		});
	});

	describe('createTilette', () => {
		it('sends a POST to api/TileshareTemplate with the given body', async () => {
			// Create replies under `tileTemplate`, unlike the read/update routes.
			fetchSpy.mockResolvedValueOnce(jsonResponse({ tileTemplate: mockTemplate }));

			const params = {
				ClusterId: 'cluster-123',
				Name: 'New tilette',
				StartTime: 1,
				EndTime: 2,
				DurationInMs: 1,
			};
			const result = await api.createTilette(params);
			expect(result.Content.tileTemplate).toEqual(mockTemplate);

			const [urlArg, options] = fetchSpy.mock.calls[0];
			expect(urlOf(fetchSpy.mock.calls[0])).toContain('api/TileshareTemplate');
			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method).toBe('POST');
			const bodyStr =
				urlArg instanceof Request ? await urlArg.text() : (options?.body as string);
			expect(JSON.parse(bodyStr)).toEqual(params);
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(
				api.createTilette({
					ClusterId: 'cluster-123',
					StartTime: 1,
					EndTime: 2,
					DurationInMs: 1,
				})
			).rejects.toThrow();
		});
	});

	describe('updateTilette', () => {
		it('sends a PUT to api/TileshareTemplate with the given body', async () => {
			fetchSpy.mockResolvedValueOnce(jsonResponse({ tileShareTemplate: mockTemplate }));

			await api.updateTilette({ Id: 'tilette-1', Name: 'Renamed' });

			const [urlArg, options] = fetchSpy.mock.calls[0];
			expect(urlOf(fetchSpy.mock.calls[0])).toContain('api/TileshareTemplate');
			const method = urlArg instanceof Request ? urlArg.method : options?.method;
			expect(method).toBe('PUT');
			const bodyStr =
				urlArg instanceof Request ? await urlArg.text() : (options?.body as string);
			expect(JSON.parse(bodyStr)).toEqual({ Id: 'tilette-1', Name: 'Renamed' });
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.updateTilette({ Id: 'tilette-1' })).rejects.toThrow();
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

		it('sends DELETE request to api/TileShareCluster with params and no location', async () => {
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
			// The handler never reads location on this path, so nothing is sent and
			// the browser isn't prompted for a fix.
			expect(body).not.toHaveProperty('UserLongitude');
			expect(body).not.toHaveProperty('UserLatitude');
			expect(body).not.toHaveProperty('UserLocationVerified');
		});

		it('throws on network error', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));
			await expect(api.deleteCluster(deleteParams)).rejects.toThrow();
		});
	});
});
