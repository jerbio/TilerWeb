import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditCalendarEvent, { isRepetitionConfigValid } from './EditCalendarEvent';
import { useCalendarUI } from '@/core/common/components/calendar/calendar-ui.provider';
import { useUiStore } from '@/core/ui';
import type { CalendarEvent } from '@/core/common/types/schedule';
import { ThemeProvider, ThemeMode } from '@/core/theme/ThemeProvider';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
	useCalendarUI: vi.fn(),
}));

vi.mock('@/core/ui', () => ({
	useUiStore: vi.fn(),
	notificationId: vi.fn(() => 'notif-id'),
	NotificationAction: { Update: 'Update' },
}));

vi.mock('@/services', () => ({
	scheduleService: {
		updateCalendarEvent: vi.fn().mockResolvedValue({}),
		lookupCalendarEventById: vi.fn().mockResolvedValue(null),
	},
	userService: {
		getScheduleProfile: vi.fn().mockResolvedValue(null),
		getRestrictionProfiles: vi
			.fn()
			.mockResolvedValue({ workProfile: null, personalProfile: null }),
	},
}));

vi.mock('@/core/common/components/restriction/RestrictionProfileEditor', () => ({
	default: () => null,
	RestrictionType: { Custom: 'Custom', Work: 'Work', Personal: 'Personal' },
	RESTRICTION_TYPE_KEYS: {},
}));

vi.mock('@/core/common/components/calendar/calendar_date_picker', () => ({
	default: () => null,
}));

vi.mock('@/core/common/components/TimeDropdown', () => ({
	default: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockOpenNotes = vi.fn();
const mockShowNotification = vi.fn();
const mockUpdateNotification = vi.fn();

const mockEvent = {
	id: 'event-1',
	name: 'Test Event',
	start: 1700000000,
	end: 1700003600,
	isViable: true,
	isRigid: false,
	colorRed: 237,
	colorGreen: 18,
	colorBlue: 59,
	colorOpacity: 1,
} as unknown as CalendarEvent;

function renderComponent(event: CalendarEvent = mockEvent, onClose = vi.fn()) {
	return render(
		<ThemeProvider defaultTheme={ThemeMode.Light}>
			<EditCalendarEvent event={event} onClose={onClose} />
		</ThemeProvider>
	);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
	vi.mocked(useCalendarUI).mockImplementation((selector: any) =>
		selector({ editNotes: { actions: { open: mockOpenNotes } } })
	);
	vi.mocked(useUiStore).mockImplementation((selector: any) =>
		selector({ notification: { show: mockShowNotification, update: mockUpdateNotification } })
	);
	mockOpenNotes.mockClear();
	mockShowNotification.mockClear();
	mockUpdateNotification.mockClear();
});

// ── isRepetitionConfigValid ───────────────────────────────────────────────────

describe('isRepetitionConfigValid', () => {
	it('returns true when frequency is empty (repetition disabled)', () => {
		expect(
			isRepetitionConfigValid({
				frequency: '',
				isForever: false,
				repStartDate: null,
				repEndDate: null,
			})
		).toBe(true);
	});

	it('returns true when isForever is set (no date range required)', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'daily',
				isForever: true,
				repStartDate: null,
				repEndDate: null,
			})
		).toBe(true);
	});

	it('returns true when frequency is set and both date bounds are provided', () => {
		const d = {} as any; // non-null date object
		expect(
			isRepetitionConfigValid({
				frequency: 'weekly',
				isForever: false,
				repStartDate: d,
				repEndDate: d,
			})
		).toBe(true);
	});

	it('returns false when frequency is set but repEndDate is missing', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'weekly',
				isForever: false,
				repStartDate: {} as any,
				repEndDate: null,
			})
		).toBe(false);
	});

	it('returns false when frequency is set but repStartDate is missing', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'monthly',
				isForever: false,
				repStartDate: null,
				repEndDate: {} as any,
			})
		).toBe(false);
	});

	it('returns false when both dates are missing and isForever is false', () => {
		expect(
			isRepetitionConfigValid({
				frequency: 'daily',
				isForever: false,
				repStartDate: null,
				repEndDate: null,
			})
		).toBe(false);
	});
});

// ── Notes button ──────────────────────────────────────────────────────────────

describe('EditCalendarEvent – notes button', () => {
	it('renders a button with the "Open notes" aria-label', () => {
		renderComponent();
		expect(screen.getByRole('button', { name: 'Open notes' })).toBeInTheDocument();
	});

	it('calls openNotes with the event when clicked', () => {
		renderComponent();
		fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));
		expect(mockOpenNotes).toHaveBeenCalledOnce();
		expect(mockOpenNotes).toHaveBeenCalledWith(mockEvent);
	});

	it('passes a different event object through to openNotes', () => {
		const other = { ...mockEvent, id: 'event-2', name: 'Other' } as unknown as CalendarEvent;
		renderComponent(other);
		fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));
		expect(mockOpenNotes).toHaveBeenCalledWith(other);
	});
});

// ── Back / close button ───────────────────────────────────────────────────────

describe('EditCalendarEvent – back button', () => {
	it('calls onClose when the back button is clicked', () => {
		const onClose = vi.fn();
		renderComponent(mockEvent, onClose);
		fireEvent.click(screen.getByRole('button', { name: /back/i }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
