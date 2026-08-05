import { vi } from 'vitest';
import TileshareService from '../tileshareService';
import type { TileshareApi } from '@/api/tileshareApi';
import { InvitationStatus } from '@/core/common/types/tileshare';

const mockCreator = {
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
};

const mockTemplate = {
	id: 'TileShareTemplate+abc+def',
	name: 'Test Tilette',
	creator: mockCreator,
	designatedUsers: [],
	clusterId: 'TileShareCluster+abc+def',
	duration: 3600000,
	start: 1750755360000,
	end: 1751263140000,
	miscData: { id: 'misc-1', userNote: 'A note' },
};

const mockCluster = {
	id: 'TileShareCluster+abc+def',
	name: 'Test Cluster',
	notes: 'Cluster description',
	start: 1750755360000,
	end: 1751263140000,
	isCompleted: null,
	isDeleted: null,
	isDismissed: null,
	isMultiTilette: true,
	creator: mockCreator,
	tileShareTemplates: [mockTemplate],
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
	user: mockCreator,
	completionPercent: 100,
	tilerEvent: null,
	clusterOwner: mockCreator,
};

describe('TileshareService', () => {
	describe('getOutbox', () => {
		it('returns unwrapped clusters array and passes IsOutbox param', async () => {
			const apiMock = {
				getClusters: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { clusters: [mockCluster] },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getOutboxClusters();

			expect(result).toEqual([mockCluster]);
			expect(apiMock.getClusters).toHaveBeenCalledOnce();
			expect(apiMock.getClusters).toHaveBeenCalledWith({ IsOutbox: true });
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getClusters: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getOutboxClusters()).rejects.toThrow();
		});
	});

	describe('getInboxClusters', () => {
		it('returns unwrapped clusters array and passes IsOutbox false', async () => {
			const apiMock = {
				getClusters: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { clusters: [mockCluster] },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getInboxClusters();

			expect(result).toEqual([mockCluster]);
			expect(apiMock.getClusters).toHaveBeenCalledOnce();
			// The server has no IsInbox parameter; the received list is IsOutbox=false.
			expect(apiMock.getClusters).toHaveBeenCalledWith({ IsOutbox: false });
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getClusters: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getInboxClusters()).rejects.toThrow();
		});
	});

	describe('getInbox', () => {
		it('returns unwrapped designatedTiles array and passes InvitationStatus param', async () => {
			const apiMock = {
				getDesignatedTiles: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { designatedTiles: [mockDesignatedTile] },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getDesignatedTiles();

			expect(result).toEqual([mockDesignatedTile]);
			expect(apiMock.getDesignatedTiles).toHaveBeenCalledOnce();
			expect(apiMock.getDesignatedTiles).toHaveBeenCalledWith({
				InvitationStatus: InvitationStatus.Accepted,
			});
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getDesignatedTiles: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getDesignatedTiles()).rejects.toThrow();
		});
	});

	describe('getClusterDetail', () => {
		it('composes the header and tilette list from two calls', async () => {
			const apiMock = {
				getClusterHeader: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { cluster: mockCluster },
					ServerStatus: null,
				}),
				getClusterTilettes: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { tileShareTemplates: [mockTemplate] },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getClusterDetail('cluster-123');

			expect(result).toEqual({ cluster: mockCluster, tilettes: [mockTemplate] });
			expect(apiMock.getClusterHeader).toHaveBeenCalledWith('cluster-123');
			expect(apiMock.getClusterTilettes).toHaveBeenCalledWith('cluster-123');
		});

		it('propagates network errors from either call', async () => {
			const apiMock = {
				getClusterHeader: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { cluster: mockCluster },
					ServerStatus: null,
				}),
				getClusterTilettes: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getClusterDetail('cluster-123')).rejects.toThrow();
		});
	});

	describe('getClusterHeader', () => {
		it('returns the unwrapped cluster header', async () => {
			const apiMock = {
				getClusterHeader: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { cluster: mockCluster },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getClusterHeader('cluster-123');

			expect(result).toEqual(mockCluster);
			expect(apiMock.getClusterHeader).toHaveBeenCalledWith('cluster-123');
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getClusterHeader: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getClusterHeader('cluster-123')).rejects.toThrow();
		});
	});

	describe('getTileletteDetail', () => {
		it('returns the unwrapped tilette', async () => {
			const apiMock = {
				getTilette: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { tileShareTemplate: mockTemplate },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.getTileletteDetail('tilette-1');

			expect(result).toEqual(mockTemplate);
			expect(apiMock.getTilette).toHaveBeenCalledWith('tilette-1');
		});

		it('propagates network errors', async () => {
			const apiMock = {
				getTilette: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.getTileletteDetail('tilette-1')).rejects.toThrow();
		});
	});

	describe('updateCluster', () => {
		it('passes params and returns the unwrapped cluster', async () => {
			const params = { ClusterId: 'cluster-123', Name: 'Renamed' };
			const apiMock = {
				updateCluster: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { cluster: mockCluster },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.updateCluster(params);

			expect(result).toEqual(mockCluster);
			expect(apiMock.updateCluster).toHaveBeenCalledWith(params);
		});

		it('propagates network errors', async () => {
			const apiMock = {
				updateCluster: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.updateCluster({ ClusterId: 'cluster-123' })).rejects.toThrow();
		});
	});

	describe('createTilette', () => {
		it('passes params and returns the unwrapped tilette', async () => {
			const params = {
				TileShareClusterId: 'cluster-123',
				Name: 'New tilette',
				StartTime: 1750755360000,
				EndTime: 1751263140000,
				DurationInMs: 3600000,
			};
			const apiMock = {
				createTilette: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { tileShareTemplate: mockTemplate },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.createTilette(params);

			expect(result).toEqual(mockTemplate);
			expect(apiMock.createTilette).toHaveBeenCalledWith(params);
		});

		it('propagates network errors', async () => {
			const apiMock = {
				createTilette: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(
				service.createTilette({
					TileShareClusterId: 'cluster-123',
					StartTime: 1,
					EndTime: 2,
					DurationInMs: 1,
				})
			).rejects.toThrow();
		});
	});

	describe('updateTilette', () => {
		it('passes params and returns the unwrapped tilette', async () => {
			const params = { Id: 'tilette-1', Name: 'Renamed tilette' };
			const apiMock = {
				updateTilette: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: { tileShareTemplate: mockTemplate },
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.updateTilette(params);

			expect(result).toEqual(mockTemplate);
			expect(apiMock.updateTilette).toHaveBeenCalledWith(params);
		});

		it('propagates network errors', async () => {
			const apiMock = {
				updateTilette: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.updateTilette({ Id: 'tilette-1' })).rejects.toThrow();
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

		it('calls api with params and returns content', async () => {
			const apiMock = {
				deleteCluster: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: null,
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await service.deleteCluster(deleteParams);

			expect(apiMock.deleteCluster).toHaveBeenCalledWith(deleteParams);
		});

		it('propagates network errors', async () => {
			const apiMock = {
				deleteCluster: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.deleteCluster(deleteParams)).rejects.toThrow();
		});
	});
});
