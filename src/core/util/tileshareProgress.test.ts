import {
	DesignatedUser,
	InvitationStatus,
	TileletteStatus,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import {
	computeClusterProgress,
	deriveMyTileletteStatus,
	deriveTileletteStatus,
	isMineAssignment,
	canAcceptByDrag,
} from './tileshareProgress';

function makeTilette(id: string, users: DesignatedUser[] | null = null): TileShareTemplate {
	return {
		id,
		name: `Tilette ${id}`,
		creator: null,
		designatedUsers: users,
		clusterId: 'cluster-1',
		duration: null,
		start: null,
		end: null,
		miscData: null,
	};
}

function assignee(
	rsvpStatus: string | null,
	completionPct: number | null,
	userId = 'user-1',
	designatedTileTemplateId: string | null = 'assignment-1'
): DesignatedUser {
	return {
		displayedIdentifier: null,
		userId,
		designatedTileTemplateId,
		userProfile: null,
		rsvpStatus,
		completionPct,
	};
}

const accepted = (completionPct: number, userId = 'user-1') =>
	assignee(InvitationStatus.Accepted, completionPct, userId);

describe('deriveTileletteStatus', () => {
	it('returns InProgress for a tilette without assignees', () => {
		expect(deriveTileletteStatus(makeTilette('a'))).toBe(TileletteStatus.InProgress);
	});

	it('returns InProgress when there are no designated users', () => {
		expect(deriveTileletteStatus(makeTilette('a', []))).toBe(TileletteStatus.InProgress);
	});

	it('returns Todo while every assignee has declined or not yet responded', () => {
		const tilette = makeTilette('a', [
			assignee(InvitationStatus.None, 100),
			assignee(InvitationStatus.Declined, null),
		]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.Todo);
	});

	it('returns Todo when one assignee has not accepted, even at 100% completion', () => {
		const tilette = makeTilette('a', [accepted(100), assignee(InvitationStatus.None, 100)]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.Todo);
	});

	it('returns InProgress when the assignee has accepted but work is unfinished', () => {
		const tilette = makeTilette('a', [accepted(40)]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.InProgress);
	});

	it('returns InProgress when the assignee accepted but completion is unknown', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, null)]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.InProgress);
	});

	it('returns Completed when every assignee accepted and reported 100%', () => {
		const tilette = makeTilette('a', [accepted(100), accepted(100)]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.Completed);
	});

	it('returns InProgress when one accepted assignee is short of 100%', () => {
		const tilette = makeTilette('a', [accepted(100), accepted(99)]);
		expect(deriveTileletteStatus(tilette)).toBe(TileletteStatus.InProgress);
	});
});

describe('deriveMyTileletteStatus', () => {
	it('returns InProgress when the viewer has no assignment on the tilette', () => {
		const tilette = makeTilette('a', [accepted(100, 'other')]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.InProgress);
	});

	it('returns InProgress for a tilette without assignees', () => {
		expect(deriveMyTileletteStatus(makeTilette('a'), 'user-1')).toBe(
			TileletteStatus.InProgress
		);
	});

	it('returns Todo while the viewer has not responded, even at 100% completion', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.None, 100)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.Todo);
	});

	it('returns Todo for a Tentative viewer response', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Tentative, 40)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.Todo);
	});

	it('returns Todo for a Declined viewer response', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Declined, 0)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.Todo);
	});

	it("ignores other assignees' completion once the viewer accepted", () => {
		const tilette = makeTilette('a', [
			accepted(0, 'other'),
			assignee(InvitationStatus.Accepted, 100),
		]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.Completed);
	});

	it('returns Completed when the viewer accepted and hit 100%', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, 100)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.Completed);
	});

	it('returns InProgress when the viewer accepted but the work is unfinished', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, 40)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.InProgress);
	});

	it('returns InProgress when the viewer accepted but completion is unknown', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, null)]);
		expect(deriveMyTileletteStatus(tilette, 'user-1')).toBe(TileletteStatus.InProgress);
	});
});

describe('isMineAssignment', () => {
	it('returns false when there are no designated users', () => {
		expect(isMineAssignment(makeTilette('a'), 'user-1')).toBe(false);
	});

	it('returns false for an empty designated user list', () => {
		expect(isMineAssignment(makeTilette('a', []), 'user-1')).toBe(false);
	});

	it('returns false when only other users are assigned', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, 100, 'other')]);
		expect(isMineAssignment(tilette, 'user-1')).toBe(false);
	});

	it('returns true when the viewer is among the assignees', () => {
		const tilette = makeTilette('a', [
			assignee(InvitationStatus.None, 0, 'other'),
			assignee(InvitationStatus.None, 0, 'user-1'),
		]);
		expect(isMineAssignment(tilette, 'user-1')).toBe(true);
	});
});

describe('canAcceptByDrag', () => {
	it('returns false when the viewer is not assigned to the tilette', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.None, 0, 'other')]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(false);
	});

	it("returns false when the viewer's assignment has no id to respond to", () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.None, 0, 'user-1', null)]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(false);
	});

	it('returns true for a None viewer response', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.None, 0)]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(true);
	});

	it('returns true for a Tentative viewer response', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Tentative, 0)]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(true);
	});

	it('returns false once the viewer has accepted', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Accepted, 40)]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(false);
	});

	it('returns false once the viewer has declined', () => {
		const tilette = makeTilette('a', [assignee(InvitationStatus.Declined, 0)]);
		expect(canAcceptByDrag(tilette, 'user-1')).toBe(false);
	});
});

describe('computeClusterProgress', () => {
	it('returns 0 for a null list', () => {
		expect(computeClusterProgress(null)).toBe(0);
	});

	it('returns 0 for an empty list', () => {
		expect(computeClusterProgress([])).toBe(0);
	});

	it('returns 0 when every tilette is unfinished (Todo or In progress)', () => {
		const tilettes = [makeTilette('a', [accepted(0)]), makeTilette('b', [accepted(50)])];
		expect(computeClusterProgress(tilettes)).toBe(0);
	});

	it('counts only Completed tilettes toward the total', () => {
		const tilettes = [makeTilette('a', [accepted(100)]), makeTilette('b', [accepted(100)])];
		expect(computeClusterProgress(tilettes)).toBe(100);
	});

	it('rounds a mixed set to the nearest whole percent', () => {
		const tilettes = [
			makeTilette('a', [accepted(100)]),
			makeTilette('b', [accepted(50)]),
			makeTilette('c', [accepted(0)]),
		];
		// 1 of 3 completed -> 33.33 -> 33
		expect(computeClusterProgress(tilettes)).toBe(33);
	});

	it('accepts an injected status resolver', () => {
		const tilettes = [makeTilette('a'), makeTilette('b')];
		expect(computeClusterProgress(tilettes, () => TileletteStatus.Completed)).toBe(100);
	});
});
