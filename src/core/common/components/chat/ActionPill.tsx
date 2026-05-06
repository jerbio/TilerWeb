import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import { ChevronRight } from 'lucide-react';
import Button from '@/core/common/components/button';
import ActionIcon from '@/core/common/components/chat/ActionIcon';
import StatusOverlay, { StatusOverlayVariant } from '@/core/common/components/chat/StatusOverlay';
import {
	SimulationActionDto,
	SimulationDto,
	VibeAction,
	VibeRequest,
} from '@/core/common/types/chat';
import { Status } from '@/core/constants/enums';
import { useCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestResult,
	CalendarRequestStatus,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import useAppStore from '@/global_state';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import { getActionScheduleState, ScheduleState } from '@/core/util/scheduleConsistency';
import { isRequestTerminal } from '@/core/util/simulationSelectors';

// Plan §5.3 — chip affordances for review mode. Brand indigo aligns with the
// per-tile primary tier accent in `calendar_event.tsx`.
const PILL_BRAND = 'rgba(99,102,241,0.95)';
const PILL_BRAND_SOFT = 'rgba(99,102,241,0.55)';
const PILL_BRAND_GLOW = 'rgba(99,102,241,0.45)';

const pillSelectionPulse = keyframes`
	0%   { box-shadow: 0 0 0 2px ${PILL_BRAND}, 0 0 0 6px rgba(99,102,241,0.45); }
	50%  { box-shadow: 0 0 0 2px ${PILL_BRAND}, 0 0 0 10px rgba(99,102,241,0.0); }
	100% { box-shadow: 0 0 0 2px ${PILL_BRAND}, 0 0 0 6px rgba(99,102,241,0.45); }
`;

const PillWrapper = styled.span<{
	$reviewable: boolean;
	$selected: boolean;
	$navigatable: boolean;
}>`
	display: inline-flex;
	border-radius: 999px;
	margin: 2px 4px 2px 0;
	transition:
		box-shadow 0.2s ease,
		transform 0.2s ease;
	${(p) =>
		p.$reviewable &&
		!p.$selected &&
		css`
			box-shadow:
				0 0 0 2px ${PILL_BRAND_SOFT},
				0 0 8px ${PILL_BRAND_GLOW};
		`}
	${(p) =>
		p.$selected &&
		css`
			animation: ${pillSelectionPulse} 1.6s ease-in-out infinite;
		`}
	${(p) =>
		p.$navigatable &&
		css`
			cursor: pointer;
		`}
`;

const NavGlyph = styled.span<{ $emphasized: boolean }>`
	display: inline-flex;
	align-items: center;
	margin-left: 0.25rem;
	color: ${(p) => (p.$emphasized ? PILL_BRAND : 'rgba(255,255,255,0.55)')};
	flex-shrink: 0;
`;

interface ActionPillProps {
	action: VibeAction;
	/** Active simulation for the request this action belongs to (if any). */
	simulation?: SimulationDto | null;
	/** Pre-resolved preview action (parent looks this up via byActionId). */
	simulationAction?: SimulationActionDto;
	/** Owning request — used for the terminal-fallback branch. */
	request?: VibeRequest | null;
	/**
	 * Called when the user clicks a pill that should enter simulation mode
	 * (Ready simulation with a matching SimulationActionDto). Parent decides
	 * how to react — typically: enter review, focus the simulated entity.
	 */
	onSelect?: (action: VibeAction, simulationAction?: SimulationActionDto) => void;
}

const ActionPill: React.FC<ActionPillProps> = ({
	action,
	simulation,
	simulationAction,
	request,
	onSelect,
}) => {
	const { t } = useTranslation();
	const calendarDispatch = useCalendarDispatch();
	const currentScheduleId = useAppStore((s) => s.getActivePersonaSession()?.scheduleId ?? null);

	// Plan §5.3 — when in review the pill should show:
	//   1. that a previewAction is available for this VibeAction
	//   2. that the entity is navigatable on the calendar grid
	//   3. whether this is the currently selected action (cross-cut highlight)
	// All three signals come from the simulation overlay store so chip,
	// tile, and stepper share one source of truth.
	const inReview = useSimulationOverlayStore((s) => s.inReview);
	const selectedActionId = useSimulationOverlayStore((s) => s.selectedActionId);

	const [isNavigating, setIsNavigating] = useState(false);
	const [isDemoLimited, setIsDemoLimited] = useState(false);
	const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
	const [overlayVariant, setOverlayVariant] = useState<StatusOverlayVariant>('info');

	const scheduleState = getActionScheduleState(action, currentScheduleId);

	const isRemoved = scheduleState === ScheduleState.Removed;
	const isStale = scheduleState === ScheduleState.Stale;
	const isPending = action.status === Status.Pending || action.status === Status.Parsed;
	const isNonFocusable =
		action.entityType === CalendarEntityType.None ||
		action.entityType === CalendarEntityType.RestrictionProfile;
	const isClickable =
		!isRemoved &&
		!isStale &&
		!isPending &&
		!isNonFocusable &&
		!!action.entityId &&
		!!action.entityType;

	/** Show status overlay for a brief duration */
	const [overlayLoading, setOverlayLoading] = useState(false);

	/** Show status overlay for a brief duration */
	const showOverlay = useCallback(
		(message: string, variant: StatusOverlayVariant = 'info', loading = false) => {
			setOverlayMessage(message);
			setOverlayVariant(variant);
			setOverlayLoading(loading);
		},
		[]
	);

	const dismissOverlay = useCallback(() => {
		setOverlayMessage(null);
	}, []);

	const handleClick = () => {
		// Branch 1 — action is on current schedule with a real entityId. Existing
		// focus path wins regardless of simulation state.
		if (!isClickable) {
			// Removed tiles — nothing to focus
			if (isRemoved) {
				showOverlay(t('home.expanded.chat.tileRemoved', 'Tile removed'), 'warning');
				return;
			}

			// Stale actions — tile may have moved or changed
			if (isStale) {
				showOverlay(
					t(
						'home.expanded.chat.tileStale',
						'This tile may have changed since a newer update was accepted'
					),
					'warning'
				);
				return;
			}

			// Branch 2 — Ready simulation with a resolved preview action.
			if (simulation?.state === 'Ready' && simulationAction && onSelect) {
				onSelect(action, simulationAction);
				return;
			}

			// Branch 3 — simulation in progress.
			if (simulation?.state === 'Queued' || simulation?.state === 'Processing') {
				showOverlay(
					t(
						'home.expanded.chat.simulationInProgress',
						'This change is still being simulated.'
					),
					'info'
				);
				return;
			}

			// Branch 4 — no simulation yet, but request is still alive.
			if (!simulation && request != null && !isRequestTerminal(request)) {
				showOverlay(
					t('home.expanded.chat.simulationStarting', 'Simulation starting…'),
					'info'
				);
				return;
			}

			// Branch 5 — simulation failed.
			if (simulation?.state === 'Failed') {
				showOverlay(
					t('home.expanded.chat.simulationFailed', 'Simulation unavailable'),
					'warning'
				);
				return;
			}

			// Branch 6 — simulation invalidated by a newer request.
			if (simulation?.state === 'Invalidated') {
				showOverlay(
					t('home.expanded.chat.simulationStale', 'Simulation is out of date'),
					'warning'
				);
				return;
			}

			// Branch 7 — fallback (terminal request, no simulation, pending action).
			if (isPending) {
				showOverlay(
					t('home.expanded.chat.acceptToSee', 'Accept changes to see this tile'),
					'info'
				);
				return;
			}

			// Non-focusable entity types (None, RestrictionProfile)
			if (isNonFocusable) return;

			// No entity to locate
			if (!action.entityId || !action.entityType) return;
		}

		// At this point either isClickable was true (entityId/entityType guaranteed)
		// or the branches above returned. Narrow for TypeScript.
		if (!action.entityId || !action.entityType) return;

		calendarDispatch(
			{
				type: CalendarRequestType.FocusEvent,
				entityId: action.entityId,
				entityType: action.entityType as CalendarEntityType,
				actionType: action.type,
				scheduleContext: {
					afterScheduleId: action.afterScheduleId,
					currentScheduleId: currentScheduleId,
				},
			},
			(result: CalendarRequestResult) => {
				if (result.status === CalendarRequestStatus.Navigating) {
					setIsNavigating(true);
					setIsDemoLimited(false);
					showOverlay(
						t('home.expanded.chat.navigating', 'Navigating to tile...'),
						'info',
						true
					);
				} else if (result.status === CalendarRequestStatus.DemoMode) {
					setIsDemoLimited(true);
					setIsNavigating(false);
					showOverlay(
						t(
							'home.expanded.chat.demoMode',
							'You are in demo mode with limited features. Sign up to unlock the full experience!'
						),
						'warning'
					);
				} else if (result.status === CalendarRequestStatus.Completed) {
					setIsNavigating(false);
					setIsDemoLimited(false);
					showOverlay(
						t('home.expanded.chat.tileCompleted', 'This event has been completed'),
						'info'
					);
				} else if (result.status === CalendarRequestStatus.Deleted) {
					setIsNavigating(false);
					setIsDemoLimited(false);
					showOverlay(
						t('home.expanded.chat.tileDeleted', 'This event has been deleted'),
						'warning'
					);
				} else {
					// Any terminal result (found, not_found, error) clears navigating state
					setIsNavigating(false);
					setIsDemoLimited(false);
					dismissOverlay();
					if (result.status === CalendarRequestStatus.NotFound) {
						console.warn(
							'[ActionPill] Calendar could not find entity:',
							action.entityId
						);
					}
				}
			}
		);
	};

	const isReviewable = inReview && !!simulationAction;
	const isSelectedChip =
		!!selectedActionId &&
		(selectedActionId === simulationAction?.actionId || selectedActionId === action.id);

	// Diagnostic logging — fires whenever any of the review-mode signals
	// flip. Lets us trace the side-panel → store → chip pipeline live in
	// the browser console without a debugger.
	useEffect(() => {
		if (!import.meta.env.DEV) return;
		// eslint-disable-next-line no-console
		console.debug('[ActionPill]', action.id, {
			inReview,
			selectedActionId,
			simulationProvided: !!simulation,
			simulationState: simulation?.state ?? null,
			previewActionsCount: simulation?.previewActions?.length ?? 0,
			simulationActionProvided: !!simulationAction,
			simulationActionId: simulationAction?.actionId ?? null,
			isReviewable,
			isSelectedChip,
			isClickable,
		});
	}, [
		action.id,
		inReview,
		selectedActionId,
		simulation,
		simulationAction,
		isReviewable,
		isSelectedChip,
		isClickable,
	]);

	return (
		<>
			<PillWrapper
				$reviewable={isReviewable}
				$selected={isSelectedChip}
				$navigatable={isClickable}
				data-testid="action-pill-wrapper"
				data-action-id={action.id}
				data-reviewable={isReviewable ? 'true' : 'false'}
				data-selected={isSelectedChip ? 'true' : 'false'}
				data-navigatable={isClickable ? 'true' : 'false'}
				data-in-review={inReview ? 'true' : 'false'}
				data-has-simulation-action={simulationAction ? 'true' : 'false'}
			>
				<Button
					variant="pill"
					dotstatus={action.status}
					onClick={handleClick}
					style={{
						cursor: isClickable ? 'pointer' : 'default',
						opacity:
							isRemoved || isStale
								? 0.6
								: isDemoLimited
									? 0.8
									: isNavigating
										? 0.75
										: 1,
					}}
				>
					<ActionIcon action={action} />
					<span style={{ marginLeft: '4px', marginRight: '4px' }}>-</span>
					<span className="action-description">{action.descriptions}</span>
					{isClickable && (
						<NavGlyph $emphasized={isReviewable || isSelectedChip} aria-hidden="true">
							<ChevronRight size={14} strokeWidth={2.25} />
						</NavGlyph>
					)}
				</Button>
			</PillWrapper>
			<StatusOverlay
				message={overlayMessage ?? ''}
				variant={overlayVariant}
				visible={overlayMessage !== null}
				loading={overlayLoading}
				autoDismissMs={overlayLoading ? 0 : 3000}
				onDismiss={dismissOverlay}
			/>
		</>
	);
};

export default ActionPill;
