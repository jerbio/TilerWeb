import { describe, it, expect } from 'vitest';
import {
	buildSimulationDiff,
	entityKey,
	entityKeyFromEvent,
	MIN_SHIFT_MS,
	PRIMARY_VISUAL_CAP,
} from './simulationDiff';
import { SubCalendarEvent } from '@/core/common/types/schedule';
import { SimulationActionDto } from '@/core/common/types/chat';

const SUBCAL = 'SubcalendarEvent';

function ev(id: string, overrides: Partial<SubCalendarEvent> = {}): SubCalendarEvent {
	return {
		id,
		start: 1_000_000,
		end: 1_000_000 + 60 * 60 * 1000,
		name: id,
		...overrides,
	};
}

function pa(
	actionId: string,
	entityId: string,
	overrides: Partial<SimulationActionDto> = {}
): SimulationActionDto {
	return {
		actionId,
		entityId,
		entityType: SUBCAL,
		vibePreviewId: 'p1',
		...overrides,
	};
}

const FULL_WINDOW = { startMs: 0, endMs: Number.MAX_SAFE_INTEGER };

describe('entityKey', () => {
	it('joins entityType and entityId with a colon', () => {
		expect(entityKey('SubcalendarEvent', 'abc')).toBe('SubcalendarEvent:abc');
	});

	it('entityKeyFromEvent defaults to SubcalendarEvent', () => {
		expect(entityKeyFromEvent(ev('xyz'))).toBe('SubcalendarEvent:xyz');
	});
});

describe('buildSimulationDiff', () => {
	it('classifies a tile that exists only in overlay as new/primary', () => {
		const live: SubCalendarEvent[] = [];
		const overlay = [ev('gym', { start: 5000, end: 9000 })];
		const actions = [pa('a1', 'gym')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'gym')];
		expect(c).toBeDefined();
		expect(c.kind).toBe('new');
		expect(c.tier).toBe('primary');
		expect(result.counts.added).toBe(1);
	});

	it('classifies a tile present live but not in overlay as removed/primary', () => {
		const live = [ev('old')];
		const overlay: SubCalendarEvent[] = [];
		const actions = [pa('a1', 'old')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'old')];
		expect(c.kind).toBe('removed');
		expect(c.tier).toBe('primary');
		expect(result.counts.removed).toBe(1);
	});

	it('classifies a name change as updated/primary (identity field changed)', () => {
		const live = [ev('m1', { name: 'Old name' })];
		const overlay = [ev('m1', { name: 'New name' })];
		const actions = [pa('a1', 'm1')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'm1')];
		expect(c.kind).toBe('updated');
		expect(c.tier).toBe('primary');
		expect(result.counts.edited).toBe(1);
	});

	it('classifies a pure time shift as updated/cascade', () => {
		const live = [ev('m1', { start: 0, end: 3_600_000 })];
		const overlay = [ev('m1', { start: 1_800_000, end: 5_400_000 })];
		const actions = [pa('a1', 'm1')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'm1')];
		expect(c.kind).toBe('updated');
		expect(c.tier).toBe('cascade');
		expect(result.counts.shifted).toBe(1);
	});

	it('drops time shifts below MIN_SHIFT_MS (returns unchanged classification)', () => {
		const tiny = MIN_SHIFT_MS - 1;
		const live = [ev('m1', { start: 0, end: 3_600_000 })];
		const overlay = [ev('m1', { start: tiny, end: 3_600_000 + tiny })];
		const actions = [pa('a1', 'm1')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		// Per 5.2.5: drift filter drops it entirely. PRD #2 acknowledges this gap.
		const c = result.classification[entityKey(SUBCAL, 'm1')];
		expect(c).toBeUndefined();
		expect(result.counts.shifted).toBe(0);
	});

	it('classifies an action-mapped tile with no field change as mapped', () => {
		const live = [ev('m1', { name: 'Same' })];
		const overlay = [ev('m1', { name: 'Same' })];
		const actions = [pa('a1', 'm1')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'm1')];
		expect(c.kind).toBe('mapped');
		expect(c.tier).toBe('mapped');
	});

	it('classifies isViable flip from true to false as conflict', () => {
		const live = [ev('m1', { isViable: true })];
		const overlay = [ev('m1', { isViable: false })];
		const actions = [pa('a1', 'm1')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const c = result.classification[entityKey(SUBCAL, 'm1')];
		expect(c.tier).toBe('conflict');
		expect(c.conflictReasons).toContain('not_viable');
		expect(result.counts.conflicts).toBe(1);
	});

	it('demotes Primary tiles past PRIMARY_VISUAL_CAP to cascade', () => {
		// Build PRIMARY_VISUAL_CAP + 2 newly added tiles.
		const overlay: SubCalendarEvent[] = [];
		const actions: SimulationActionDto[] = [];
		for (let i = 0; i < PRIMARY_VISUAL_CAP + 2; i++) {
			overlay.push(ev(`new${i}`, { start: i * 1000, end: i * 1000 + 1000 }));
			actions.push(pa(`a${i}`, `new${i}`));
		}
		const result = buildSimulationDiff({
			liveEvents: [],
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const tiers = overlay.map((e) => result.classification[entityKey(SUBCAL, e.id)]?.tier);
		const primaryCount = tiers.filter((t) => t === 'primary').length;
		const cascadeCount = tiers.filter((t) => t === 'cascade').length;
		expect(primaryCount).toBe(PRIMARY_VISUAL_CAP);
		expect(cascadeCount).toBe(2);
	});

	it('never demotes conflicts regardless of count', () => {
		const overlay: SubCalendarEvent[] = [];
		const live: SubCalendarEvent[] = [];
		const actions: SimulationActionDto[] = [];
		const conflictCount = PRIMARY_VISUAL_CAP + 5;
		for (let i = 0; i < conflictCount; i++) {
			live.push(ev(`m${i}`, { isViable: true }));
			overlay.push(ev(`m${i}`, { isViable: false }));
			actions.push(pa(`a${i}`, `m${i}`));
		}
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		const conflicts = overlay.filter(
			(e) => result.classification[entityKey(SUBCAL, e.id)]?.tier === 'conflict'
		);
		expect(conflicts).toHaveLength(conflictCount);
	});

	it('returns events array equal to overlayEvents (v1 defers ghost rendering)', () => {
		const overlay = [ev('a'), ev('b')];
		const result = buildSimulationDiff({
			liveEvents: [ev('removed')],
			overlayEvents: overlay,
			actions: [pa('act-r', 'removed')],
			window: FULL_WINDOW,
		});
		expect(result.events.map((e) => e.id)).toEqual(['a', 'b']);
	});

	it('counts.added/removed/edited/shifted/conflicts all populate correctly', () => {
		const live = [
			ev('shift1', { start: 0, end: 3_600_000 }),
			ev('rename1', { name: 'Old' }),
			ev('removed1'),
			ev('viable1', { isViable: true }),
		];
		const overlay = [
			ev('shift1', { start: 1_800_000, end: 5_400_000 }),
			ev('rename1', { name: 'New' }),
			ev('viable1', { isViable: false }),
			ev('new1'),
		];
		const actions = [
			pa('a-shift', 'shift1'),
			pa('a-rename', 'rename1'),
			pa('a-removed', 'removed1'),
			pa('a-viable', 'viable1'),
			pa('a-new', 'new1'),
		];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: FULL_WINDOW,
		});
		expect(result.counts.added).toBe(1);
		expect(result.counts.removed).toBe(1);
		expect(result.counts.edited).toBe(1);
		expect(result.counts.shifted).toBe(1);
		expect(result.counts.conflicts).toBe(1);
	});

	it('only counts mapped/cascade/conflict for tiles within the visible window', () => {
		const live = [
			ev('inside', { start: 5_000, end: 6_000 }),
			ev('outside', { start: 1_000_000_000, end: 1_000_000_001 }),
		];
		const overlay = [
			ev('inside', { start: 5_000 + MIN_SHIFT_MS * 2, end: 6_000 + MIN_SHIFT_MS * 2 }),
			ev('outside', {
				start: 1_000_000_000 + MIN_SHIFT_MS * 2,
				end: 1_000_000_001 + MIN_SHIFT_MS * 2,
			}),
		];
		const actions = [pa('a-in', 'inside'), pa('a-out', 'outside')];
		const result = buildSimulationDiff({
			liveEvents: live,
			overlayEvents: overlay,
			actions,
			window: { startMs: 0, endMs: 1_000_000 },
		});
		expect(result.counts.shifted).toBe(1);
	});
});
