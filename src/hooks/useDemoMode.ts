/**
 * React Hook for Demo Mode
 * 
 * Provides easy access to demo mode functionality in React components
 */

import { useMemo } from 'react';
import {
	isDemoMode,
	shouldForceRenderChatMessages,
	shouldForceRenderAcceptButton,
	shouldForceRenderCalendarEvents,
	shouldShowDemoBadge,
	shouldAutoTriggerOnboarding,
	getOnboardingDelay,
	getDemoData,
	getDataOrDemo,
} from '@/config/demo_config';

export const useDemoMode = () => {
	const demoData = useMemo(() => getDemoData(), []);
	
	return {
		// Flags
		isEnabled: isDemoMode(),
		shouldForceRenderChatMessages: shouldForceRenderChatMessages(),
		shouldForceRenderAcceptButton: shouldForceRenderAcceptButton(),
		shouldForceRenderCalendarEvents: shouldForceRenderCalendarEvents(),
		shouldShowDemoBadge: shouldShowDemoBadge(),
		shouldAutoTriggerOnboarding: shouldAutoTriggerOnboarding(),
		
		// Delays
		onboardingDelay: getOnboardingDelay(),
		
		// Demo data
		demoData,
		
		// Helper functions
		getDataOrDemo,
	};
};

// Hook specifically for chat components
export const useDemoChatData = (realMessages: unknown[] = []) => {
	const { shouldForceRenderChatMessages, demoData, getDataOrDemo } = useDemoMode();
	
	const messages = useMemo(() => {
		return getDataOrDemo(
			realMessages.length > 0 ? realMessages : null,
			demoData.chatMessages
		);
	}, [realMessages, demoData.chatMessages, getDataOrDemo]);
	
	const hasMessages = messages && messages.length > 0;
	
	return {
		messages: messages,
		hasMessages,
		shouldForceRender: shouldForceRenderChatMessages,
	};
};

// Hook specifically for calendar components
export const useDemoCalendarData = (realEvents: unknown[] = []) => {
	const { shouldForceRenderCalendarEvents, demoData, getDataOrDemo } = useDemoMode();
	
	const events = useMemo(() => {
		return getDataOrDemo(
			realEvents.length > 0 ? realEvents : null,
			demoData.calendarEvents
		);
	}, [realEvents, demoData.calendarEvents, getDataOrDemo]);
	
	const hasEvents = events && events.length > 0;
	
	return {
		events: events,
		hasEvents,
		shouldForceRender: shouldForceRenderCalendarEvents,
	};
};

// Hook for components that need to check if they should render demo data
export const useShouldRenderDemo = () => {
	const { isEnabled } = useDemoMode();
	
	return {
		shouldRenderDemoChat: isEnabled && shouldForceRenderChatMessages(),
		shouldRenderDemoCalendar: isEnabled && shouldForceRenderCalendarEvents(),
		shouldRenderDemoAcceptButton: isEnabled && shouldForceRenderAcceptButton(),
	};
};

export default useDemoMode;
