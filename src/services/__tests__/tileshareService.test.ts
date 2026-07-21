import { vi } from 'vitest';
import TileshareService, { toCreateClusterParams } from '../tileshareService';
import type { TileshareApi } from '@/api/tileshareApi';
import { InvitationStatus, TileshareFormState, TileshareMode } from '@/core/common/types/tileshare';
import { dateTimeToUnix } from '@/core/util/eventTimeConversion';

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

	describe('toCreateClusterParams', () => {
		const ctx = {
			userName: 'test@example.com',
			timeZone: 'UTC',
			timeZoneOffset: 0,
			defaultCallingCode: '1',
		};
		const baseForm: TileshareFormState = {
			name: '  Finish taxes  ',
			deadline: '2026-08-01',
			location: '',
			note: '',
			recipients: [],
		};

		it('maps single-mode form to a flat payload with trimmed fields', () => {
			const params = toCreateClusterParams(baseForm, TileshareMode.Single, ctx);

			expect(params.Name).toBe('Finish taxes');
			expect(params.IsMultiTilette).toBe(false);
			expect(params.IncludeMe).toBe(true);
			expect(params.UserName).toBe('test@example.com');
			expect(params.TimeZone).toBe('UTC');
			expect(params.TimeZoneOffset).toBe(0);
			expect(params.DurationInMs).toBeGreaterThan(0);
		});

		it('sets IsMultiTilette true for multi mode', () => {
			const params = toCreateClusterParams(baseForm, TileshareMode.Multi, ctx);
			expect(params.IsMultiTilette).toBe(true);
		});

		it('converts the deadline to an end-of-day epoch-ms EndTime', () => {
			const params = toCreateClusterParams(baseForm, TileshareMode.Single, ctx);
			expect(params.EndTime).toBe(dateTimeToUnix('2026-08-01', '11:59 PM'));
		});

		it('leaves EndTime undefined when no deadline is provided', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, deadline: '' },
				TileshareMode.Single,
				ctx
			);
			expect(params.EndTime).toBeUndefined();
		});

		it('wraps a location string into an AddressData object', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, location: '123 Main St' },
				TileshareMode.Single,
				ctx
			);
			expect(params.AddressData).toEqual({
				Address: '123 Main St',
				AddressIsVerified: false,
			});
		});

		it('omits AddressData when location is empty', () => {
			const params = toCreateClusterParams(baseForm, TileshareMode.Single, ctx);
			expect(params.AddressData).toBeUndefined();
		});

		it('classifies an email recipient into Contacts', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, recipients: ['jane@example.com'] },
				TileshareMode.Single,
				ctx
			);
			expect(params.Contacts).toEqual([{ Email: 'jane@example.com' }]);
		});

		it('normalizes a bare phone number with the default calling code', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, recipients: ['3035551212'] },
				TileshareMode.Single,
				ctx
			);
			expect(params.Contacts).toEqual([{ PhoneNumber: '+13035551212' }]);
		});

		it('preserves a phone number that already has a + area code', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, recipients: ['+13035551212'] },
				TileshareMode.Single,
				ctx
			);
			expect(params.Contacts).toEqual([{ PhoneNumber: '+13035551212' }]);
		});

		it('maps multiple recipients into a mixed Contacts array', () => {
			const params = toCreateClusterParams(
				{ ...baseForm, recipients: ['jane@example.com', '3035551212'] },
				TileshareMode.Single,
				ctx
			);
			expect(params.Contacts).toEqual([
				{ Email: 'jane@example.com' },
				{ PhoneNumber: '+13035551212' },
			]);
		});

		it('sends an empty Contacts array (never null) when no recipient given', () => {
			const params = toCreateClusterParams(baseForm, TileshareMode.Single, ctx);
			expect(params.Contacts).toEqual([]);
		});
	});

	describe('createCluster', () => {
		const createParams = {
			UserName: 'test@example.com',
			TimeZone: 'UTC',
			TimeZoneOffset: 0,
			Name: 'Finish taxes',
			IsMultiTilette: false,
			IncludeMe: true,
			Contacts: [],
		};

		it('calls api with params and returns the cluster content on success', async () => {
			const apiMock = {
				createCluster: vi.fn().mockResolvedValue({
					Error: { Code: '0', Message: 'SUCCESS' },
					Content: mockCluster,
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			const result = await service.createCluster(createParams);

			expect(apiMock.createCluster).toHaveBeenCalledWith(createParams);
			expect(result).toEqual(mockCluster);
		});

		it('treats a null Error envelope as success', async () => {
			const apiMock = {
				createCluster: vi.fn().mockResolvedValue({
					Error: null,
					Content: mockCluster,
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.createCluster(createParams)).resolves.toEqual(mockCluster);
		});

		it('throws when the server returns a non-zero error code', async () => {
			const apiMock = {
				createCluster: vi.fn().mockResolvedValue({
					Error: { Code: '500', Message: 'FAILURE' },
					Content: null,
					ServerStatus: null,
				}),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.createCluster(createParams)).rejects.toThrow();
		});

		it('propagates network errors', async () => {
			const apiMock = {
				createCluster: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as TileshareApi;

			const service = new TileshareService(apiMock);
			await expect(service.createCluster(createParams)).rejects.toThrow();
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
