import { describe, it, expect } from 'vitest';
import {
	buildSimulationActionLookups,
	entityKey,
	isRequestTerminal,
	isSimulationReviewable,
	isSimulationInProgress,
	isSimulationTerminal,
	primeSimulationFromRequest,
} from './simulationSelectors';
import {
	SimulationActionDto,
	SimulationDto,
	SimulationState,
	VibeRequest,
} from '@/core/common/types/chat';

function makePreviewAction(overrides: Partial<SimulationActionDto> = {}): SimulationActionDto {
	return {
		actionId: 'a1',
		entityId: 'e1',
		entityType: 'SubCalendarEvent',
		vibePreviewId: 'p1',
		...overrides,
	};
}

function makeSimulation(overrides: Partial<SimulationDto> = {}): SimulationDto {
	return {
		id: 'p1',
		vibeRequestId: 'r1',
		tilerUserId: 'u1',
		creationTimeInMs: 1,
		state: SimulationState.Ready,
		previewActions: [],
		...overrides,
	};
}

function makeRequest(overrides: Partial<VibeRequest> = {}): VibeRequest {
	return {
		id: 'r1',
		creationTimeInMs: 1,
		activeAction: null,
		isClosed: false,
		beforeScheduleId: null,
		afterScheduleId: null,
		actions: [],
		...overrides,
	};
}

describe('entityKey', () => {
	it('joins type and id with a colon', () => {
		expect(entityKey('SubCalendarEvent', 'abc')).toBe('SubCalendarEvent:abc');
	});

	it('treats null type/id as empty string segments', () => {
		expect(entityKey(null, 'abc')).toBe(':abc');
		expect(entityKey('SubCalendarEvent', null)).toBe('SubCalendarEvent:');
	});
});

describe('buildSimulationActionLookups', () => {
	it('returns empty lookups for null simulation', () => {
		const r = buildSimulationActionLookups(null);
		expect(r.byActionId).toEqual({});
		expect(r.byEntityKey).toEqual({});
	});

	it('indexes preview actions by actionId and composite entity key', () => {
		const a = makePreviewAction({ actionId: 'a1', entityId: 'e1', entityType: 'X' });
		const b = makePreviewAction({ actionId: 'a2', entityId: 'e2', entityType: 'Y' });
		const sim = makeSimulation({ previewActions: [a, b] });

		const r = buildSimulationActionLookups(sim);
		expect(r.byActionId.a1).toBe(a);
		expect(r.byActionId.a2).toBe(b);
		expect(r.byEntityKey['X:e1']).toBe(a);
		expect(r.byEntityKey['Y:e2']).toBe(b);
	});

	it('skips entries missing actionId or entityId without throwing', () => {
		const noAction = makePreviewAction({ actionId: '', entityId: 'e' });
		const noEntity = makePreviewAction({ actionId: 'aOnly', entityId: null });
		const sim = makeSimulation({ previewActions: [noAction, noEntity] });

		const r = buildSimulationActionLookups(sim);
		expect(r.byActionId.aOnly).toBe(noEntity);
		expect(Object.keys(r.byEntityKey)).toEqual(['SubCalendarEvent:e']);
	});
});

describe('isRequestTerminal', () => {
	it('is true when isClosed', () => {
		expect(isRequestTerminal(makeRequest({ isClosed: true }))).toBe(true);
	});

	it.each(['Executed', 'Superseded', 'Failed', 'executed', 'SUPERSEDED'])(
		'is true for terminal state "%s"',
		(state) => {
			expect(isRequestTerminal(makeRequest({ state }))).toBe(true);
		}
	);

	it('is false for in-flight states', () => {
		expect(isRequestTerminal(makeRequest({ state: 'Pending' }))).toBe(false);
		expect(isRequestTerminal(makeRequest())).toBe(false);
	});

	it('is false for null/undefined request', () => {
		expect(isRequestTerminal(null)).toBe(false);
		expect(isRequestTerminal(undefined)).toBe(false);
	});

	// Plan §6.6.3 — supersession marker treats a request as historical
	// even when its own `state` hasn't been re-stamped server-side yet.
	// Without this, a refresh into a session whose latest request was
	// replaced would surface a stale Ready preview.
	it('is true when supersededByRequestId is set', () => {
		expect(isRequestTerminal(makeRequest({ supersededByRequestId: 'r2' }))).toBe(true);
	});
});

describe('isSimulationReviewable / InProgress / Terminal', () => {
	it('reviewable only when state === Ready', () => {
		expect(isSimulationReviewable(makeSimulation({ state: SimulationState.Ready }))).toBe(true);
		expect(isSimulationReviewable(makeSimulation({ state: SimulationState.Processing }))).toBe(
			false
		);
		expect(isSimulationReviewable(null)).toBe(false);
	});

	it('inProgress for Queued/Processing only', () => {
		expect(isSimulationInProgress(makeSimulation({ state: SimulationState.Queued }))).toBe(
			true
		);
		expect(isSimulationInProgress(makeSimulation({ state: SimulationState.Processing }))).toBe(
			true
		);
		expect(isSimulationInProgress(makeSimulation({ state: SimulationState.Ready }))).toBe(
			false
		);
	});

	it('terminal for Ready/Failed/Invalidated', () => {
		expect(isSimulationTerminal(makeSimulation({ state: SimulationState.Ready }))).toBe(true);
		expect(isSimulationTerminal(makeSimulation({ state: SimulationState.Failed }))).toBe(true);
		expect(isSimulationTerminal(makeSimulation({ state: SimulationState.Invalidated }))).toBe(
			true
		);
		expect(isSimulationTerminal(makeSimulation({ state: SimulationState.Queued }))).toBe(false);
	});
});

describe('primeSimulationFromRequest', () => {
	it('prefers singular preview when present', () => {
		const sim = makeSimulation({ id: 'pSingular' });
		const req = makeRequest({ preview: sim });
		expect(primeSimulationFromRequest(req)?.id).toBe('pSingular');
	});

	it('falls back to first non-invalidated entry in previews[]', () => {
		const inv = makeSimulation({ id: 'pInv', state: SimulationState.Invalidated });
		const ready = makeSimulation({ id: 'pReady', state: SimulationState.Ready });
		const req = makeRequest({ previews: [inv, ready] });
		expect(primeSimulationFromRequest(req)?.id).toBe('pReady');
	});

	it('returns first entry if all are invalidated', () => {
		const inv1 = makeSimulation({ id: 'p1', state: SimulationState.Invalidated });
		const inv2 = makeSimulation({ id: 'p2', state: SimulationState.Invalidated });
		const req = makeRequest({ previews: [inv1, inv2] });
		expect(primeSimulationFromRequest(req)?.id).toBe('p1');
	});

	it('returns null for empty/missing previews', () => {
		expect(primeSimulationFromRequest(makeRequest())).toBeNull();
		expect(primeSimulationFromRequest(null)).toBeNull();
	});
});
