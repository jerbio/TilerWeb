import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import ActionIcon from '@/core/common/components/chat/ActionIcon';
import { VibeAction } from '@/core/common/types/chat';
import { Status } from '@/core/constants/enums';
import { useCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import { CalendarEntityType, CalendarRequestResult } from '@/core/common/components/calendar/calendarRequestContext';
import useAppStore from '@/global_state';
import { getActionScheduleState, ScheduleState } from '@/core/util/scheduleConsistency';

interface ActionPillProps {
  action: VibeAction;
}

const ActionPill: React.FC<ActionPillProps> = ({ action }) => {
  const { t } = useTranslation();
  const calendarDispatch = useCalendarDispatch();
  const currentScheduleId = useAppStore(
    (s) => s.getActivePersonaSession()?.scheduleId ?? null
  );

  const [isNavigating, setIsNavigating] = useState(false);

  const scheduleState = getActionScheduleState(action, currentScheduleId);

  const isRemoved = scheduleState === ScheduleState.Removed;
  const isStale = scheduleState === ScheduleState.Stale;
  const isPending = action.status === Status.Pending || action.status === Status.Parsed;
  const isNonFocusable = action.entityType === CalendarEntityType.None || action.entityType === CalendarEntityType.RestrictionProfile;
  const isClickable = !isRemoved && !isStale && !isPending && !isNonFocusable && !!action.entityId && !!action.entityType;

  const handleClick = () => {
    // Removed tiles — nothing to focus
    if (isRemoved) return;

    // Stale actions — tile may have moved or changed
    if (isStale) return;

    // Pending actions (pre-accept) — tile doesn't exist on calendar yet
    if (isPending) return;

    // Non-focusable entity types (None, RestrictionProfile)
    if (isNonFocusable) return;

    // No entity to locate
    if (!action.entityId || !action.entityType) return;

    calendarDispatch(
      {
        type: 'focus_event',
        entityId: action.entityId,
        entityType: action.entityType as CalendarEntityType,
        actionType: action.type,
        scheduleContext: {
          afterScheduleId: action.afterScheduleId,
          currentScheduleId: currentScheduleId,
        },
      },
      (result: CalendarRequestResult) => {
        if (result.status === 'navigating') {
          setIsNavigating(true);
        } else {
          // Any terminal result (found, not_found, error) clears navigating state
          setIsNavigating(false);
          if (result.status === 'not_found') {
            console.warn('[ActionPill] Calendar could not find entity:', action.entityId);
          }
        }
      }
    );
  };

  const getTitle = (): string | undefined => {
    if (isNavigating) {
      return t('home.expanded.chat.navigating', 'Navigating to tile...');
    }
    if (isRemoved) {
      return t('home.expanded.chat.tileRemoved', 'Tile removed');
    }
    if (isPending) {
      return t('home.expanded.chat.acceptToSee', 'Accept changes to see this tile');
    }
    if (isStale) {
      return t('home.expanded.chat.tileStale', 'This tile may have changed since a newer update was accepted');
    }
    if (isClickable) {
      return t('home.expanded.chat.clickToFocus', 'Click to find on calendar');
    }
    return undefined;
  };

  return (
    <Button
      variant="pill"
      dotstatus={action.status}
      onClick={handleClick}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        opacity: isRemoved || isStale ? 0.6 : isNavigating ? 0.75 : 1,
      }}
      title={getTitle()}
    >
      <ActionIcon action={action} />
      <span style={{ marginLeft: '4px', marginRight: '4px' }}>-</span>
      <span className="action-description">{action.descriptions}</span>
    </Button>
  );
};

export default ActionPill;
