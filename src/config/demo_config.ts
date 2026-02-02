/**
 * Onboarding Demo Data Configuration
 * 
 * This file contains mock data to render the UI appropriately for onboarding guide demonstrations.
 * This is NOT a separate mode - it's temporary data injection for the onboarding guide.
 */

import type { ChatContextType, UserInfo, PersonaSession } from '@/global_state';

export const ONBOARDING_DEMO_DATA_EVENT = 'onboarding-demo-data-change';

const dispatchOnboardingDemoEvent = () => {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent(ONBOARDING_DEMO_DATA_EVENT, {
				detail: {
					isActive: isOnboardingDemoActive,
					timestamp: Date.now(),
				},
			})
		);
	}
};

// Temporary flags for onboarding demo (can be toggled programmatically)
let isOnboardingDemoActive = false;

export const setOnboardingDemoActive = (active: boolean) => {
	isOnboardingDemoActive = active;
	dispatchOnboardingDemoEvent();
};

export const isOnboardingDemoMode = () => isOnboardingDemoActive;

// Demo Mode Flags (kept for backwards compatibility but controlled by setOnboardingDemoActive)
export const DEMO_FLAGS = {
	/** Enable demo mode - shows mock data and ensures all UI elements are rendered */
	get ENABLED() { return isOnboardingDemoActive; },
	
	/** Force render chat messages even if chat session is empty */
	FORCE_RENDER_CHAT_MESSAGES: true,
	
	/** Force render accept button in chat */
	FORCE_RENDER_ACCEPT_BUTTON: true,
	
	/** Force render calendar with events */
	FORCE_RENDER_CALENDAR_EVENTS: true,
	
	/** Show demo badge in UI */
	SHOW_DEMO_BADGE: true,
	
	/** Auto-trigger onboarding guide after persona expansion */
	AUTO_TRIGGER_ONBOARDING: true,
	
	/** Delay before triggering onboarding (ms) */
	ONBOARDING_DELAY: 2000,
} as const;

// Demo User Info
export const DEMO_USER_INFO: UserInfo = {
	id: 'TilerUser@@demo-user-123',
	username: 'DemoUser-ABC123',
	timeZoneDifference: 0,
	timeZone: 'UTC',
	email: 'demo@tiler.app',
	endOfDay: '2024-01-01T23:59:59+00:00',
	phoneNumber: null,
	fullName: 'Demo User',
	firstName: 'Demo',
	lastName: 'User',
	countryCode: '1',
	dateOfBirth: null,
};

// Demo Chat Context
export const DEMO_CHAT_CONTEXT: ChatContextType[] = [
	{
		EntityId: 'tile-001',
		Name: 'Morning Workout',
		Description: 'Daily exercise routine',
	},
	{
		EntityId: 'tile-002',
		Name: 'Team Standup',
		Description: 'Daily team sync meeting',
	},
];

// Demo Chat Messages (matching PromptWithActions structure)
import type { PromptWithActions } from '@/core/common/types/chat';
import { Status } from '@/core/constants/enums';

const getMessageTimestamp = (minutesAgo: number): number => {
	return Date.now() - (minutesAgo * 60 * 1000);
};

export const DEMO_CHAT_MESSAGES: PromptWithActions[] = [
	{
		id: `prompt-demo-${getMessageTimestamp(10)}`,
		origin: 'user',
		content: 'Schedule a morning workout for 7 AM tomorrow',
		actionId: '',
		requestId: 'request-demo-001',
		sessionId: 'session-demo-001',
		actions: [],
	},
	{
		id: `prompt-demo-${getMessageTimestamp(9)}`,
		origin: 'tiler',
		content: "I've scheduled your morning workout for 7:00 AM tomorrow. Would you like me to add a reminder?",
		actionId: 'action-demo-001',
		requestId: 'request-demo-001',
		sessionId: 'session-demo-001',
		actions: [
			{
				id: 'action-demo-001',
				descriptions: 'Schedule Morning Workout',
				type: 'add_new_task',
				creationTimeInMs: getMessageTimestamp(9),
				status: Status.Pending,
				prompts: [],
				beforeScheduleId: '',
				afterScheduleId: 'schedule-demo-after-001',
				vibeRequest: {
					id: 'request-demo-001',
					creationTimeInMs: getMessageTimestamp(10),
					activeAction: 'action-demo-001',
					isClosed: false,
					beforeScheduleId: null,
					afterScheduleId: 'schedule-demo-after-001',
					actions: [],
				},
			},
		],
	},
	{
		id: `prompt-demo-${getMessageTimestamp(8)}`,
		origin: 'user',
		content: 'Yes, remind me 15 minutes before',
		actionId: '',
		requestId: 'request-demo-002',
		sessionId: 'session-demo-001',
		actions: [],
	},
	{
		id: `prompt-demo-${getMessageTimestamp(7)}`,
		origin: 'tiler',
		content: "Perfect! I've added a 15-minute reminder before your workout. You're all set! 💪",
		actionId: 'action-demo-002',
		requestId: 'request-demo-002',
		sessionId: 'session-demo-001',
		actions: [
			{
				id: 'action-demo-002',
				descriptions: 'Add 15-minute reminder',
				type: 'update_existing_task',
				creationTimeInMs: getMessageTimestamp(7),
				status: Status.Executed,
				prompts: [],
				beforeScheduleId: 'schedule-demo-after-001',
				afterScheduleId: 'schedule-demo-after-002',
				vibeRequest: {
					id: 'request-demo-002',
					creationTimeInMs: getMessageTimestamp(8),
					activeAction: 'action-demo-002',
					isClosed: true,
					beforeScheduleId: 'schedule-demo-after-001',
					afterScheduleId: 'schedule-demo-after-002',
					actions: [],
				},
			},
		],
	},
];

// Demo Calendar Events (matching ScheduleSubCalendarEvent structure)
import type { ScheduleSubCalendarEvent } from '@/core/common/types/schedule';

// Helper to create a base event timestamp (tomorrow at various times)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const getTomorrowTimestamp = (hour: number, minute: number = 0): number => {
	const date = new Date(tomorrow);
	date.setHours(hour, minute, 0, 0);
	return date.valueOf();
};

// Helper to create empty travel detail
const getEmptyTravelDetail = (): ScheduleSubCalendarEvent['travelDetail'] => ({
	before: null,
	after: {
		start: 0,
		end: 0,
		startLocation: null,
		endLocation: null,
		isRigid: false,
		travelLegs: [] as [],
		travelMedium: '',
		isFailed: false,
		isDisabled: false,
		isDefault: true,
		duration: 0,
		calTimeLine: { start: 0, end: 0, duration: 0, occupiedSlots: null },
		projectionType: ['TravelSubCalendarEvent'] as ['TravelSubCalendarEvent'],
	}
});

export const DEMO_CALENDAR_EVENTS: ScheduleSubCalendarEvent[] = [
	{
		id: 'demo-event-001',
		start: getTomorrowTimestamp(7, 0),
		end: getTomorrowTimestamp(8, 0),
		name: 'Morning Workout',
		description: 'Daily exercise routine',
		address: 'Local Gym',
		addressDescription: 'Fitness Center',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: '',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 1,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		location: {
			id: 'loc-001',
			description: 'Gym',
			address: 'Local Gym',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: 'Gym',
		},
		searchdDescription: '',
		rangeStart: getTomorrowTimestamp(6, 0),
		rangeEnd: getTomorrowTimestamp(10, 0),
		colorOpacity: 1,
		colorRed: 59,
		colorGreen: 130,
		colorBlue: 246,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: {
			type: 0,
			note: '',
			id: '',
		},
		styleProperties: {
			id: '',
			color: {
				colorSelection: 0,
				r: 59,
				g: 130,
				b: 246,
				o: 1,
			},
		},
		split: 0,
		calendarEventStart: getTomorrowTimestamp(7, 0),
		calendarEventEnd: getTomorrowTimestamp(8, 0),
		SubCalCalEventStart: getTomorrowTimestamp(7, 0),
		SubCalCalEventEnd: getTomorrowTimestamp(8, 0),
		travelDetail: getEmptyTravelDetail(),
	},
	{
		id: 'demo-event-002',
		start: getTomorrowTimestamp(9, 0),
		end: getTomorrowTimestamp(9, 30),
		name: 'Team Standup',
		description: 'Daily team sync meeting',
		address: 'Office',
		addressDescription: 'Conference Room A',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: '',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 2,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		location: {
			id: 'loc-002',
			description: 'Office',
			address: 'Office',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: 'Office',
		},
		searchdDescription: '',
		rangeStart: getTomorrowTimestamp(8, 0),
		rangeEnd: getTomorrowTimestamp(11, 0),
		colorOpacity: 1,
		colorRed: 139,
		colorGreen: 92,
		colorBlue: 246,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: {
			type: 0,
			note: '',
			id: '',
		},
		styleProperties: {
			id: '',
			color: {
				colorSelection: 0,
				r: 139,
				g: 92,
				b: 246,
				o: 1,
			},
		},
		split: 0,
		calendarEventStart: getTomorrowTimestamp(9, 0),
		calendarEventEnd: getTomorrowTimestamp(9, 30),
		SubCalCalEventStart: getTomorrowTimestamp(9, 0),
		SubCalCalEventEnd: getTomorrowTimestamp(9, 30),
		travelDetail: getEmptyTravelDetail(),
	},
	{
		id: 'demo-event-003',
		start: getTomorrowTimestamp(12, 0),
		end: getTomorrowTimestamp(13, 0),
		name: 'Lunch Break',
		description: 'Time to recharge',
		address: 'Nearby Cafe',
		addressDescription: 'Favorite lunch spot',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: '',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 3,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		location: {
			id: 'loc-003',
			description: 'Cafe',
			address: 'Nearby Cafe',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: 'Cafe',
		},
		searchdDescription: '',
		rangeStart: getTomorrowTimestamp(11, 0),
		rangeEnd: getTomorrowTimestamp(14, 0),
		colorOpacity: 1,
		colorRed: 16,
		colorGreen: 185,
		colorBlue: 129,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: {
			type: 0,
			note: '',
			id: '',
		},
		styleProperties: {
			id: '',
			color: {
				colorSelection: 0,
				r: 16,
				g: 185,
				b: 129,
				o: 1,
			},
		},
		split: 0,
		calendarEventStart: getTomorrowTimestamp(12, 0),
		calendarEventEnd: getTomorrowTimestamp(13, 0),
		SubCalCalEventStart: getTomorrowTimestamp(12, 0),
		SubCalCalEventEnd: getTomorrowTimestamp(13, 0),
		travelDetail: getEmptyTravelDetail(),
	},
	{
		id: 'demo-event-004',
		start: getTomorrowTimestamp(14, 0),
		end: getTomorrowTimestamp(15, 30),
		name: 'Project Review',
		description: 'Review quarterly goals',
		address: 'Office',
		addressDescription: 'Main Conference Room',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: '',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 4,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		location: {
			id: 'loc-004',
			description: 'Office',
			address: 'Office',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: 'Office',
		},
		searchdDescription: '',
		rangeStart: getTomorrowTimestamp(13, 0),
		rangeEnd: getTomorrowTimestamp(17, 0),
		colorOpacity: 1,
		colorRed: 245,
		colorGreen: 158,
		colorBlue: 11,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: {
			type: 0,
			note: '',
			id: '',
		},
		styleProperties: {
			id: '',
			color: {
				colorSelection: 0,
				r: 245,
				g: 158,
				b: 11,
				o: 1,
			},
		},
		split: 0,
		calendarEventStart: getTomorrowTimestamp(14, 0),
		calendarEventEnd: getTomorrowTimestamp(15, 30),
		SubCalCalEventStart: getTomorrowTimestamp(14, 0),
		SubCalCalEventEnd: getTomorrowTimestamp(15, 30),
		travelDetail: getEmptyTravelDetail(),
	},
	{
		id: 'demo-event-005',
		start: getTomorrowTimestamp(18, 0),
		end: getTomorrowTimestamp(19, 0),
		name: 'Evening Yoga',
		description: 'Relaxation and stretching',
		address: 'Home Studio',
		addressDescription: 'Living Room',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: '',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 5,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		location: {
			id: 'loc-005',
			description: 'Home',
			address: 'Home Studio',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: 'Home',
		},
		searchdDescription: '',
		rangeStart: getTomorrowTimestamp(17, 0),
		rangeEnd: getTomorrowTimestamp(20, 0),
		colorOpacity: 1,
		colorRed: 236,
		colorGreen: 72,
		colorBlue: 153,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: {
			type: 0,
			note: '',
			id: '',
		},
		styleProperties: {
			id: '',
			color: {
				colorSelection: 0,
				r: 236,
				g: 72,
				b: 153,
				o: 1,
			},
		},
		split: 0,
		calendarEventStart: getTomorrowTimestamp(18, 0),
		calendarEventEnd: getTomorrowTimestamp(19, 0),
		SubCalCalEventStart: getTomorrowTimestamp(18, 0),
		SubCalCalEventEnd: getTomorrowTimestamp(19, 0),
		travelDetail: getEmptyTravelDetail(),
	},
];

// Demo Persona (to be injected into carousel)
export const DEMO_PERSONA: Partial<import('@/core/common/types/persona').Persona> = {
	id: 'demo-persona',
	name: 'Demo Persona',
	description: 'A demonstration persona with pre-loaded data for onboarding',
	personaType: 0,
	occupation: 'Professional',
	isActive: true,
	imageUrl: null,
	preferredSchedulePattern: 'flexible',
	timeZone: 'UTC',
	preferredStartHour: 7,
	preferredEndHour: 19,
	preferredWorkDurationMinutes: 60,
	preferredBreakDurationMinutes: 15,
	preferredLocations: ['Office', 'Home', 'Gym'],
	preferredTags: ['work', 'fitness', 'meetings'],
	tilePreferences: [
		{
			Id: 'tile-001',
			TileName: 'Morning Workout',
			Description: 'Daily exercise routine',
			Category: 'Fitness',
			Priority: 1,
			EstimatedDurationMinutes: 60,
			RecurrencePattern: 'daily',
			Tags: ['fitness', 'morning'],
			Location: 'Gym',
			IsActive: true,
		},
		{
			Id: 'tile-002',
			TileName: 'Team Standup',
			Description: 'Daily team sync meeting',
			Category: 'Work',
			Priority: 2,
			EstimatedDurationMinutes: 30,
			RecurrencePattern: 'weekdays',
			Tags: ['work', 'meetings'],
			Location: 'Office',
			IsActive: true,
		},
	],
};

// Demo Persona Session (for active persona state)
export const DEMO_PERSONA_SESSION: PersonaSession = {
	personaId: 'demo-persona',
	personaName: 'Demo Persona',
	userId: DEMO_USER_INFO.id,
	scheduleId: 'schedule-demo-001',
	chatSessionId: 'chat-session-demo-001',
	chatContext: DEMO_CHAT_CONTEXT,
	userInfo: DEMO_USER_INFO,
	scheduleLastUpdatedBy: 'demo',
};

// Helper Functions
export const isDemoMode = (): boolean => {
	return isOnboardingDemoActive;
};

/**
 * Activate onboarding demo mode
 * Injects demo data into the active persona for onboarding guide demonstration
 */
export const activateOnboardingDemo = (personaId: string) => {
	setOnboardingDemoActive(true);
	
	// Store temporary flag in sessionStorage (clears on tab close)
	sessionStorage.setItem('onboarding_demo_active', 'true');
	sessionStorage.setItem('onboarding_demo_persona', personaId);
};

/**
 * Deactivate onboarding demo mode
 * Returns to normal operation
 */
export const deactivateOnboardingDemo = () => {
	setOnboardingDemoActive(false);
	
	// Clear temporary flags
	sessionStorage.removeItem('onboarding_demo_active');
	sessionStorage.removeItem('onboarding_demo_persona');
};

/**
 * Check if onboarding demo is active on page load
 */
export const restoreOnboardingDemoState = () => {
	const wasActive = sessionStorage.getItem('onboarding_demo_active') === 'true';
	if (wasActive) {
		setOnboardingDemoActive(true);
	}
	return wasActive;
};

export const shouldForceRenderChatMessages = (): boolean => {
	return isDemoMode() && DEMO_FLAGS.FORCE_RENDER_CHAT_MESSAGES;
};

export const shouldForceRenderAcceptButton = (): boolean => {
	return isDemoMode() && DEMO_FLAGS.FORCE_RENDER_ACCEPT_BUTTON;
};

export const shouldForceRenderCalendarEvents = (): boolean => {
	return isDemoMode() && DEMO_FLAGS.FORCE_RENDER_CALENDAR_EVENTS;
};

export const shouldShowDemoBadge = (): boolean => {
	return isDemoMode() && DEMO_FLAGS.SHOW_DEMO_BADGE;
};

export const shouldAutoTriggerOnboarding = (): boolean => {
	return isDemoMode() && DEMO_FLAGS.AUTO_TRIGGER_ONBOARDING;
};

export const getOnboardingDelay = (): number => {
	return DEMO_FLAGS.ONBOARDING_DELAY;
};

// Get demo data based on current context
export const getDemoData = () => {
	return {
		userInfo: DEMO_USER_INFO,
		chatContext: DEMO_CHAT_CONTEXT,
		chatMessages: DEMO_CHAT_MESSAGES,
		calendarEvents: DEMO_CALENDAR_EVENTS,
		personaSession: DEMO_PERSONA_SESSION,
	};
};

// Check if we should use demo data or real data
export const getDataOrDemo = <T>(realData: T | null | undefined, demoData: T): T => {
	if (isDemoMode() && (!realData || (Array.isArray(realData) && realData.length === 0))) {
		return demoData;
	}
	return realData ?? demoData;
};

export default {
	DEMO_FLAGS,
	DEMO_PERSONA,
	isDemoMode,
	isOnboardingDemoMode,
	setOnboardingDemoActive,
	activateOnboardingDemo,
	deactivateOnboardingDemo,
	restoreOnboardingDemoState,
	shouldForceRenderChatMessages,
	shouldForceRenderAcceptButton,
	shouldForceRenderCalendarEvents,
	shouldShowDemoBadge,
	shouldAutoTriggerOnboarding,
	getOnboardingDelay,
	getDemoData,
	getDataOrDemo,
};
