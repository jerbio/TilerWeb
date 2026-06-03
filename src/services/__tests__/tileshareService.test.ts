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

const mockCluster = {
	id: 'TileShareCluster+abc+def',
	name: 'Test Cluster',
	start: 1750755360000,
	end: 1751263140000,
	isCompleted: null,
	isDeleted: null,
	isDismissed: null,
	isMultiTilette: true,
	creator: mockCreator,
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
			expect(apiMock.getClusters).toHaveBeenCalledWith({ IsInbox: true });
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
