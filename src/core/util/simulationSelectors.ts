import { Status } from '@/core/constants/enums';
import {
	SimulationActionDto,
	SimulationDto,
	SimulationState,
	VibeRequest,
} from '@/core/common/types/chat';

/**
 * Composite key matching the PRD `${entityType}:${entityId}` lookup contract.
 * Centralized here so chat state, the calendar overlay, and the diff helper
 * cannot drift apart on key shape.
 */
export function entityKey(
	entityType: string | null | undefined,
	entityId: string | null | undefined
): string {
	return `${entityType ?? ''}:${entityId ?? ''}`;
}

export type SimulationActionLookups = {
	byActionId: Record<string, SimulationActionDto>;
	byEntityKey: Record<string, SimulationActionDto>;
};

/**
 * Build the chip↔preview-action and tile↔preview-action lookup maps.
 * Skips entries with missing actionId or with no entity reference (the
 * lookup keys would be junk and silently mask bugs).
 */
export function buildSimulationActionLookups(
	simulation: SimulationDto | null | undefined
): SimulationActionLookups {
	const byActionId: Record<string, SimulationActionDto> = {};
	const byEntityKey: Record<string, SimulationActionDto> = {};
	const previewActions = simulation?.previewActions ?? [];
	for (const pa of previewActions) {
		// Backend `PreviewAction.ToJson` historically omitted `actionId`; the
		// owning `VibeAction.id` is the same value (FK relationship), so fall
		// back to it to keep the chip↔preview wiring resilient against older
		// payloads still in flight.
		const actionId = pa.actionId || pa.action?.id;
		if (actionId) {
			byActionId[actionId] = pa;
		}
		if (pa.entityId) {
			byEntityKey[entityKey(pa.entityType, pa.entityId)] = pa;
		}
	}
	return { byActionId, byEntityKey };
}

/**
 * A request is "terminal" when no further apply is possible. Drives the
 * Apply-button enable check and the late-arrival socket guard.
 *
 * Mirrors the resolution table in the execution plan:
 *   state ∈ { Executed, Superseded, Failed } OR isClosed === true OR
 *   supersededByRequestId is set (Plan §6.6.3 — a newer request has
 *   replaced this one, so the embedded preview is historical even when
 *   the row hasn't been re-stamped server-side yet).
 */
export function isRequestTerminal(request: VibeRequest | null | undefined): boolean {
	if (!request) return false;
	if (request.isClosed) return true;
	if (request.supersededByRequestId) return true;
	const state = request.state;
	if (!state) return false;
	const normalized = state.toLowerCase();
	return normalized === 'executed' || normalized === 'superseded' || normalized === 'failed';
}

export function isSimulationReviewable(
	sim: SimulationDto | null | undefined
): sim is SimulationDto {
	return !!sim && sim.state === SimulationState.Ready;
}

export function isSimulationInProgress(sim: SimulationDto | null | undefined): boolean {
	if (!sim) return false;
	return sim.state === SimulationState.Queued || sim.state === SimulationState.Processing;
}

export function isSimulationTerminal(sim: SimulationDto | null | undefined): boolean {
	if (!sim) return false;
	const s: SimulationState = sim.state;
	return (
		s === SimulationState.Ready ||
		s === SimulationState.Failed ||
		s === SimulationState.Invalidated
	);
}

/**
 * Pull the embedded simulation off a hydrated VibeRequest so the frontend
 * can render the status strip on first paint without an extra fetch.
 * Prefers the singular `preview` field; falls back to the most recent
 * non-invalidated entry in `previews`.
 */
export function primeSimulationFromRequest(
	request: VibeRequest | null | undefined
): SimulationDto | null {
	if (!request) return null;
	if (request.preview) return request.preview;
	const previews = request.previews ?? [];
	const active = previews.find((p) => p.state !== 'Invalidated');
	return active ?? previews[0] ?? null;
}

/**
 * The chip-list ordering hint used by the review panel and ranking layer.
 * Status drives terminal/in-progress separation; downstream code may
 * further bucket by tier (Phase 5.2.1).
 */
export function isActionExecuted(status: Status | undefined): boolean {
	if (!status) return false;
	return status === Status.Executed;
}
