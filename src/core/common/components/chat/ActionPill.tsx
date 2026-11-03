import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { ChevronRight } from 'lucide-react';
import Button from '@/core/common/components/button';
import ActionIcon from '@/core/common/components/chat/ActionIcon';
import StatusOverlay, { StatusOverlayVariant } from '@/core/common/components/chat/StatusOverlay';
import {
	SimulationActionDto,
	SimulationDto,
	SimulationState,
	VibeAction,
	VibeRequest,
} from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';
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

const PillWrapper = styled.span<{
	$reviewable: boolean;
	$selected: boolean;
	$navigatable: boolean;
}>`
	display: inline-flex;
	min-width: 0;
	max-width: 100%;
	align-items: stretch;
	border-radius: 999px;
	margin: 2px 4px 2px 0;
	${(p) =>
		p.$navigatable &&
		css`
			cursor: pointer;
		`}
`;

const NavigateButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	align-self: center;
	min-width: 32px;
	min-height: 32px;
	margin-top: 0.25rem;
	padding: 4px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 999px;
	background: ${({ theme }) => theme.colors.background.card};
	color: ${(p) => p.theme.colors.text.secondary};
	flex-shrink: 0;
	cursor: pointer;

	&:hover {
		background: ${({ theme }) => theme.colors.button.ghost.bgHover};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 2px;
	}
`;

// Chat-specific sizing leaves the shared button's appearance and behavior intact.
const ChatActionButton = styled(Button)`
	&& {
		min-width: 0;
		max-width: 100%;
		line-height: 1.4;

		.action-description,
		&:hover .action-description {
			overflow: hidden;
			white-space: normal;
			overflow-wrap: anywhere;
			text-align: left;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
		}

		&:hover {
			max-width: 100%;
			transform: none;
		}
	}
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
	 * Parent opens review (or waits for the preview) and focuses this action.
	 */
	onSelect?: (action: VibeAction, simulationAction?: SimulationActionDto) => void;
	/** Cancel a pending review entry before navigating the live calendar. */
	onNavigate?: () => void;
}

const ActionPill: React.FC<ActionPillProps> = ({
	action,
	simulation,
	simulationAction,
	request,
	onSelect,
	onNavigate,
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
	const isCreation =
		action.type === Actions.Add_New_Task ||
		action.type === Actions.Add_New_Appointment ||
		action.type === Actions.Add_New_Project ||
		action.type === Actions.WhatIf_AddedNewTask ||
		action.type === Actions.WhatIf_AddANewAppointment;
	// Pending edits/removals still reference an existing live tile. Pending
	// creations only have a proposed entity, which must be viewed in review.
	const canNavigate =
		!isStale &&
		(!isRemoved || isPending) &&
		!(isPending && isCreation) &&
		!isNonFocusable &&
		!!action.entityId &&
		!!action.entityType;
	const canReview =
		!!onSelect &&
		!isRequestTerminal(request) &&
		simulation?.state !== SimulationState.Failed &&
		simulation?.state !== SimulationState.Invalidated &&
		(!!simulationAction || (isPending && !!request));

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
		// The action opens the proposed change; the adjacent arrow always
		// locates the live entity independently of preview readiness.
		if (canReview) {
			onSelect?.(action, simulationAction);
			if (simulation?.state !== SimulationState.Ready) {
				showOverlay(
					t(
						'home.expanded.chat.reviewWhenReady',
						'Review will open when this preview is ready.'
					),
					'info'
				);
			}
			return;
		}

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

			// Branch 3 — simulation in progress.
			if (
				simulation?.state === SimulationState.Queued ||
				simulation?.state === SimulationState.Processing
			) {
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
			if (simulation?.state === SimulationState.Failed) {
				showOverlay(
					t('home.expanded.chat.simulationFailed', 'Simulation unavailable'),
					'warning'
				);
				return;
			}

			// Branch 6 — simulation invalidated by a newer request.
			if (simulation?.state === SimulationState.Invalidated) {
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

		handleNavigate();
	};

	const handleNavigate = () => {
		if (!canNavigate) return;
		if (!action.entityId || !action.entityType) return;
		onNavigate?.();

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
						// console.warn(
						// 	'[ActionPill] Calendar could not find entity:',
						// 	action.entityId
						// );
					}
				}
			}
		);
	};

	const isReviewable = inReview && !!simulationAction;
	const isSelectedChip =
		!!selectedActionId &&
		(selectedActionId === simulationAction?.actionId || selectedActionId === action.id);

	return (
		<>
			<PillWrapper
				$reviewable={isReviewable}
				$selected={isSelectedChip}
				$navigatable={canNavigate}
				data-testid="action-pill-wrapper"
				data-action-id={action.id}
				data-reviewable={isReviewable ? 'true' : 'false'}
				data-selected={isSelectedChip ? 'true' : 'false'}
				data-navigatable={canNavigate ? 'true' : 'false'}
				data-in-review={inReview ? 'true' : 'false'}
				data-has-simulation-action={simulationAction ? 'true' : 'false'}
			>
				<ChatActionButton
					type="button"
					variant="pill"
					aria-label={action.descriptions}
					title={action.descriptions}
					dotstatus={action.status}
					onClick={handleClick}
					style={{
						cursor: canReview || isClickable ? 'pointer' : 'default',
						opacity:
							!canReview && (isRemoved || isStale)
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
				</ChatActionButton>
				{canNavigate && (
					<NavigateButton
						type="button"
						onClick={handleNavigate}
						aria-label={t('home.expanded.chat.goToTileAction', {
							description: action.descriptions,
						})}
						title={t('home.expanded.chat.goToTile', 'Go to tile')}
						aria-busy={isNavigating || undefined}
					>
						<ChevronRight size={16} strokeWidth={2.25} aria-hidden="true" />
					</NavigateButton>
				)}
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
