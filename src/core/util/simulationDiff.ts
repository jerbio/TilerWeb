import { SubCalendarEvent } from '@/core/common/types/schedule';
import { SimulationActionDto } from '@/core/common/types/chat';
import { CalendarEntityType } from '@/core/common/components/calendar/calendarRequestContext';

// ---------------------------------------------------------------------------
// Phase 5.2 — Simulation diff & tier classification
// ---------------------------------------------------------------------------
// Compares the live schedule against a simulation overlay schedule and the
// list of `PreviewAction`s that produced the overlay. Output is consumed by:
//   - the calendar grid (per-tile tier styling)
//   - the chat banner (counts)
//   - the chip list / review panel (ordering and badges)
//
// All lookups use a composite `${entityType}:${entityId}` key per plan §5.2.9
// to avoid id collisions across SubcalendarEvent / CalendarEvent / etc.
// ---------------------------------------------------------------------------

export type SimulatedChangeKind = 'new' | 'updated' | 'removed' | 'unchanged' | 'mapped';

export type SimulatedChangeTier = 'primary' | 'conflict' | 'cascade' | 'mapped' | 'unchanged';

export type ConflictReason = 'overlap' | 'restriction' | 'off_day' | 'not_viable';

export interface SimulatedTileClassification {
	kind: SimulatedChangeKind;
	tier: SimulatedChangeTier;
	/** Populated only for tier === 'conflict'. */
	conflictReasons?: ConflictReason[];
}

export interface SimulationDiffCounts {
	added: number;
	removed: number;
	edited: number;
	shifted: number;
	conflicts: number;
}

export interface SimulationDiffResult {
	/** Tiles to render in simulation mode. v1 omits ghosts for removed tiles. */
	events: SubCalendarEvent[];
	/** Per-tile classification keyed by composite `entityType:entityId`. */
	classification: Record<string, SimulatedTileClassification>;
	counts: SimulationDiffCounts;
}

export interface BuildSimulationDiffArgs {
	liveEvents: SubCalendarEvent[];
	overlayEvents: SubCalendarEvent[];
	actions: SimulationActionDto[];
	/** Visible time window in ms. Used for viewport-scoped count metrics. */
	window: { startMs: number; endMs: number };
}

/** Drift-filter floor — see plan §5.2.5. Configurable via this export. */
export const MIN_SHIFT_MS = 5 * 60 * 1000;

/** Hard cap on Primary visual weight on the calendar grid — see §5.2.5. */
export const PRIMARY_VISUAL_CAP = 8;

export function entityKey(entityType: string, entityId: string): string {
	return `${entityType}:${entityId}`;
}

export function entityKeyFromEvent(
	event: SubCalendarEvent,
	type: CalendarEntityType = CalendarEntityType.SubcalendarEvent
): string {
	return entityKey(type, event.id);
}

function inWindow(event: SubCalendarEvent, w: { startMs: number; endMs: number }): boolean {
	return event.start < w.endMs && event.end > w.startMs;
}

function timeShifted(a: SubCalendarEvent, b: SubCalendarEvent): boolean {
	return Math.abs(a.start - b.start) >= MIN_SHIFT_MS || Math.abs(a.end - b.end) >= MIN_SHIFT_MS;
}

function identityChanged(a: SubCalendarEvent, b: SubCalendarEvent): boolean {
	const aLoc = a.location?.address ?? a.address ?? null;
	const bLoc = b.location?.address ?? b.address ?? null;
	return (a.name ?? null) !== (b.name ?? null) || aLoc !== bLoc;
}

function viabilityFlipped(a: SubCalendarEvent, b: SubCalendarEvent): ConflictReason | null {
	if (a.isViable === true && b.isViable === false) return 'not_viable';
	return null;
}

/**
 * Compares overlay against live schedule and produces per-tile tier
 * classification plus counts. Intentionally pure — no React, no styling.
 */
export function buildSimulationDiff(args: BuildSimulationDiffArgs): SimulationDiffResult {
	const { liveEvents, overlayEvents, actions, window } = args;

	// Index everything by composite entity key.
	const liveByKey = new Map<string, SubCalendarEvent>();
	for (const e of liveEvents) liveByKey.set(entityKeyFromEvent(e), e);

	const overlayByKey = new Map<string, SubCalendarEvent>();
	for (const e of overlayEvents) overlayByKey.set(entityKeyFromEvent(e), e);

	const actionEntityKeys = new Set<string>();
	for (const a of actions) {
		if (a.entityType && a.entityId) {
			actionEntityKeys.add(entityKey(a.entityType, a.entityId));
		}
	}

	const classification: Record<string, SimulatedTileClassification> = {};
	const counts: SimulationDiffCounts = {
		added: 0,
		removed: 0,
		edited: 0,
		shifted: 0,
		conflicts: 0,
	};

	// Walk overlay tiles first — these are what render.
	for (const overlayEv of overlayEvents) {
		const key = entityKeyFromEvent(overlayEv);
		const live = liveByKey.get(key);
		const visible = inWindow(overlayEv, window);

		if (!live) {
			// New tile (only in overlay).
			classification[key] = { kind: 'new', tier: 'primary' };
			if (visible) counts.added += 1;
			continue;
		}

		// Tile exists in both. Decide tier.
		const conflictFlip = viabilityFlipped(live, overlayEv);
		const idChanged = identityChanged(live, overlayEv);
		const shifted = timeShifted(live, overlayEv);

		if (conflictFlip) {
			classification[key] = {
				kind: 'updated',
				tier: 'conflict',
				conflictReasons: [conflictFlip],
			};
			if (visible) counts.conflicts += 1;
			continue;
		}

		if (idChanged) {
			classification[key] = { kind: 'updated', tier: 'primary' };
			if (visible) counts.edited += 1;
			continue;
		}

		if (shifted) {
			classification[key] = { kind: 'updated', tier: 'cascade' };
			if (visible) counts.shifted += 1;
			continue;
		}

		// Plan §5.2.8 drift-filter: a time-only change below MIN_SHIFT_MS
		// is dropped from the diff entirely — it does NOT become Mapped.
		const timesDiffer = live.start !== overlayEv.start || live.end !== overlayEv.end;
		if (timesDiffer) continue;

		// No meaningful field changed — but the action graph still touches it.
		if (actionEntityKeys.has(key)) {
			classification[key] = { kind: 'mapped', tier: 'mapped' };
		}
		// Otherwise leave classification unset → treated as unchanged downstream.
	}

	// Walk live-only tiles to surface removals.
	for (const liveEv of liveEvents) {
		const key = entityKeyFromEvent(liveEv);
		if (overlayByKey.has(key)) continue;
		classification[key] = { kind: 'removed', tier: 'primary' };
		if (inWindow(liveEv, window)) counts.removed += 1;
	}

	// Density safeguard: cap loud Primary tiles on the grid (§5.2.5).
	// Conflicts are exempt. Demotion ranks by overlay event index (a stable
	// proxy for `PreviewAction.position` until the server emits it).
	const primaryEntries: Array<{ key: string; orderIndex: number }> = [];
	overlayEvents.forEach((e, idx) => {
		const key = entityKeyFromEvent(e);
		const c = classification[key];
		if (c?.tier === 'primary') primaryEntries.push({ key, orderIndex: idx });
	});
	primaryEntries.sort((a, b) => a.orderIndex - b.orderIndex);
	for (let i = PRIMARY_VISUAL_CAP; i < primaryEntries.length; i++) {
		const c = classification[primaryEntries[i].key];
		if (c) classification[primaryEntries[i].key] = { ...c, tier: 'cascade' };
	}

	return {
		events: overlayEvents,
		classification,
		counts,
	};
}
