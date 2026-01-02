import React from 'react';
import { usePersonaSession } from '@/core/common/hooks/usePersonaSessionManager';
import { CalendarWrapper } from '@/core/common/components/calendar/calendar_wrapper';

type PersonaCalendarProps = {
  userId: string | null;
  expandedWidth: number;
};

const PersonaCalendar: React.FC<PersonaCalendarProps> = ({ expandedWidth: width, userId }) => {
  // Use PersonaSessionManager hook for reactive session updates
  // This automatically re-renders when session changes (userId, dev override, etc.)
  const session = usePersonaSession(undefined, (updatedSession) => {
    console.log('[PersonaCalendar] Session updated, will re-fetch schedule:', updatedSession);
  });

  // Use the session's userId if available (includes dev override updates)
  // Fall back to the prop userId for backwards compatibility
  const effectiveUserId = session?.userId || userId;

  return <CalendarWrapper userId={effectiveUserId} width={width} />;
};

export default PersonaCalendar;
