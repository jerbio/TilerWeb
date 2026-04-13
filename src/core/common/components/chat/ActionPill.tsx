import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import ActionIcon from '@/core/common/components/chat/ActionIcon';
import StatusOverlay, { StatusOverlayVariant } from '@/core/common/components/chat/StatusOverlay';
import { VibeAction } from '@/core/common/types/chat';
import { Status } from '@/core/constants/enums';
import { useCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestResult,
	CalendarRequestStatus,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import useAppStore from '@/global_state';
import { getActionScheduleState, ScheduleState } from '@/core/util/scheduleConsistency';

interface ActionPillProps {
	action: VibeAction;
}

const ActionPill: React.FC<ActionPillProps> = ({ action }) => {
	const { t } = useTranslation();
	const calendarDispatch = useCalendarDispatch();
	const currentScheduleId = useAppStore((s) => s.getActivePersonaSession()?.scheduleId ?? null);

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

		// Pending actions (pre-accept) — tile doesn't exist on calendar yet
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

	return (
		<>
			<Button
				variant="pill"
				dotstatus={action.status}
				onClick={handleClick}
				style={{
					cursor: isClickable ? 'pointer' : 'default',
					opacity:
						isRemoved || isStale ? 0.6 : isDemoLimited ? 0.8 : isNavigating ? 0.75 : 1,
				}}
			>
				<ActionIcon action={action} />
				<span style={{ marginLeft: '4px', marginRight: '4px' }}>-</span>
				<span className="action-description">{action.descriptions}</span>
			</Button>
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
