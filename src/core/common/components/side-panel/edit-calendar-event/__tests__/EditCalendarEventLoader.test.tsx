import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import EditCalendarEventLoader from '../EditCalendarEventLoader';
import { CalendarEvent, ThirdPartyType } from '@/core/common/types/schedule';

// ── Mock EditCalendarEvent to isolate loader behaviour ──

vi.mock('../EditCalendarEvent', () => ({
	default: ({
		event,
		workProfileId,
		personalProfileId,
		isLocationVerified,
	}: {
		event: CalendarEvent;
		workProfileId: string | null;
		personalProfileId: string | null;
		isLocationVerified?: boolean;
		onClose: () => void;
	}) => (
		<div data-testid="edit-calendar-event">
			<span data-testid="event-name">{event.name}</span>
			<span data-testid="event-address">{event.address}</span>
			<span data-testid="event-address-desc">{event.addressDescription}</span>
			<span data-testid="work-profile-id">{workProfileId ?? 'null'}</span>
			<span data-testid="personal-profile-id">{personalProfileId ?? 'null'}</span>
			<span data-testid="is-location-verified">{String(isLocationVerified ?? false)}</span>
		</div>
	),
	isRepetitionConfigValid: vi.fn(() => true),
}));

// ── Service mocks ──

const mockLookupCalendarEventById = vi.fn();
const mockLookupLocationById = vi.fn();
const mockGetScheduleProfile = vi.fn();

vi.mock('@/services', () => ({
	scheduleService: {
		lookupCalendarEventById: (...args: unknown[]) => mockLookupCalendarEventById(...args),
		lookupLocationById: (...args: unknown[]) => mockLookupLocationById(...args),
	},
	userService: {
		getScheduleProfile: (...args: unknown[]) => mockGetScheduleProfile(...args),
	},
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Test data ──

const mockPartialEvent: CalendarEvent = {
	id: 'evt-1',
	start: 1769925600000,
	end: 1770532200000,
	name: 'work out',
	address: '123 Main St',
	addressDescription: 'Near the park',
	searchdDescription: '',
	splitCount: 4,
	completeCount: 0,
	deletionCount: 0,
	thirdpartyType: ThirdPartyType.Tiler,
	thirdPartyId: null,
	thirdPartyUserId: null,
	colorOpacity: 1,
	colorRed: 52,
	colorGreen: 152,
	colorBlue: 219,
	isComplete: false,
	isEnabled: true,
	isRecurring: false,
	locationId: null,
	isReadOnly: false,
	isProcrastinateEvent: false,
	isRigid: false,
	uiConfig: { id: 'ui-1' } as CalendarEvent['uiConfig'],
	repetition: null,
	eachTileDuration: 5400000,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: false,
	entityName: 'CalendarEvent',
	blob: { type: 0, note: '', id: 'blob-1' },
	subEvents: null,
};

const mockFullEvent: CalendarEvent = {
	...mockPartialEvent,
	name: 'Full Event',
	address: '456 Oak Ave',
	addressDescription: 'By the river',
	locationId: null,
};

const mockScheduleProfile = {
	travelMedium: null,
	pinPreference: null,
	endTimeOfDay: null,
	sleepDuration: null,
	endOfDay: null,
	timeZone: null,
	timeZoneDifference: null,
	personalHoursRestrictionProfile: {
		id: 'personal-1',
		isEnabled: true,
		timeZone: null,
		daySelection: null,
	},
	workHoursRestrictionProfile: {
		id: 'work-1',
		isEnabled: true,
		timeZone: null,
		daySelection: null,
	},
};

const mockOnClose = vi.fn();

function renderLoader(event: CalendarEvent = mockPartialEvent) {
	return render(
		<ThemeProvider theme={lightTheme}>
			<EditCalendarEventLoader event={event} onClose={mockOnClose} />
		</ThemeProvider>
	);
}

// ── Tests ──

describe('EditCalendarEventLoader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLookupCalendarEventById.mockResolvedValue(mockFullEvent);
		mockLookupLocationById.mockResolvedValue({
			address: '456 Oak Ave',
			description: 'By the river',
			isVerified: false,
		});
		mockGetScheduleProfile.mockResolvedValue(mockScheduleProfile);
	});

	// ── Loading state ──

	it('shows loading state while fetch is pending', () => {
		mockLookupCalendarEventById.mockReturnValueOnce(new Promise(() => {}));
		renderLoader();
		expect(screen.getByTestId('edit-event-loading')).toBeInTheDocument();
	});

	it('does not render EditCalendarEvent while loading', () => {
		mockLookupCalendarEventById.mockReturnValueOnce(new Promise(() => {}));
		renderLoader();
		expect(screen.queryByTestId('edit-calendar-event')).not.toBeInTheDocument();
	});

	it('hides loading state after fetch completes', async () => {
		renderLoader();
		await waitFor(() => {
			expect(screen.queryByTestId('edit-event-loading')).not.toBeInTheDocument();
		});
	});

	it('hides loading state after fetch fails', async () => {
		mockLookupCalendarEventById.mockRejectedValueOnce(new Error('fail'));
		renderLoader();
		await waitFor(() => {
			expect(screen.queryByTestId('edit-event-loading')).not.toBeInTheDocument();
		});
	});

	// ── API calls ──

	it('calls lookupCalendarEventById with the root ID (no repetition suffix)', async () => {
		renderLoader();
		await waitFor(() => {
			expect(mockLookupCalendarEventById).toHaveBeenCalledWith('evt-1_7_0_0');
		});
	});

	it('strips repetition suffix from event ID before calling lookupCalendarEventById', async () => {
		renderLoader({ ...mockPartialEvent, id: 'evt-1_2_5_3' });
		await waitFor(() => {
			expect(mockLookupCalendarEventById).toHaveBeenCalledWith('evt-1_7_0_0');
		});
	});

	it('calls getScheduleProfile on mount', async () => {
		renderLoader();
		await waitFor(() => {
			expect(mockGetScheduleProfile).toHaveBeenCalled();
		});
	});

	// ── Successful fetch ──

	it('renders EditCalendarEvent with the fetched full event', async () => {
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('event-name')).toHaveTextContent('Full Event');
		});
	});

	it('passes workProfileId from schedule profile to EditCalendarEvent', async () => {
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('work-profile-id')).toHaveTextContent('work-1');
		});
	});

	it('passes personalProfileId from schedule profile to EditCalendarEvent', async () => {
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('personal-profile-id')).toHaveTextContent('personal-1');
		});
	});

	it('passes null workProfileId when schedule profile has no work profile', async () => {
		mockGetScheduleProfile.mockResolvedValueOnce({
			...mockScheduleProfile,
			workHoursRestrictionProfile: null,
		});
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('work-profile-id')).toHaveTextContent('null');
		});
	});

	it('passes null personalProfileId when schedule profile has no personal profile', async () => {
		mockGetScheduleProfile.mockResolvedValueOnce({
			...mockScheduleProfile,
			personalHoursRestrictionProfile: null,
		});
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('personal-profile-id')).toHaveTextContent('null');
		});
	});

	// ── Fetch failure fallback ──

	it('falls back to prop event when lookupCalendarEventById fails', async () => {
		mockLookupCalendarEventById.mockRejectedValueOnce(new Error('Network error'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('event-name')).toHaveTextContent('work out');
		});
	});

	it('passes null workProfileId when fetch fails', async () => {
		mockLookupCalendarEventById.mockRejectedValueOnce(new Error('Network error'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('work-profile-id')).toHaveTextContent('null');
		});
	});

	it('passes null personalProfileId when fetch fails', async () => {
		mockLookupCalendarEventById.mockRejectedValueOnce(new Error('Network error'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('personal-profile-id')).toHaveTextContent('null');
		});
	});

	it('passes null profileIds when getScheduleProfile fails', async () => {
		mockGetScheduleProfile.mockRejectedValueOnce(new Error('fail'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('work-profile-id')).toHaveTextContent('null');
			expect(screen.getByTestId('personal-profile-id')).toHaveTextContent('null');
		});
	});

	// ── Location resolution ──

	it('does not call lookupLocationById when fetched event has no locationId', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({ ...mockFullEvent, locationId: null });
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('edit-calendar-event')).toBeInTheDocument();
		});
		expect(mockLookupLocationById).not.toHaveBeenCalled();
	});

	it('calls lookupLocationById when fetched event has a locationId', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({
			...mockFullEvent,
			locationId: 'loc-1',
		});
		renderLoader();
		await waitFor(() => {
			expect(mockLookupLocationById).toHaveBeenCalledWith('loc-1');
		});
	});

	it('enriches event address fields from location fetch result', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({
			...mockFullEvent,
			locationId: 'loc-1',
			address: 'stale address',
			addressDescription: 'stale desc',
		});
		mockLookupLocationById.mockResolvedValueOnce({
			address: '789 Broadway',
			description: 'Corner office',
			isVerified: true,
		});
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('event-address')).toHaveTextContent('789 Broadway');
			expect(screen.getByTestId('event-address-desc')).toHaveTextContent('Corner office');
		});
	});

	it('passes isLocationVerified=true when location fetch returns isVerified=true', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({
			...mockFullEvent,
			locationId: 'loc-1',
		});
		mockLookupLocationById.mockResolvedValueOnce({
			address: '789 Broadway',
			description: 'Corner office',
			isVerified: true,
		});
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('is-location-verified')).toHaveTextContent('true');
		});
	});

	it('passes isLocationVerified=false when location fetch fails', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({
			...mockFullEvent,
			locationId: 'loc-1',
		});
		mockLookupLocationById.mockRejectedValueOnce(new Error('Location not found'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('is-location-verified')).toHaveTextContent('false');
		});
	});

	it('keeps fetched event address when location fetch fails', async () => {
		mockLookupCalendarEventById.mockResolvedValueOnce({
			...mockFullEvent,
			locationId: 'loc-1',
			address: 'fetched address',
			addressDescription: 'fetched desc',
		});
		mockLookupLocationById.mockRejectedValueOnce(new Error('fail'));
		renderLoader();
		await waitFor(() => {
			expect(screen.getByTestId('event-address')).toHaveTextContent('fetched address');
		});
	});
});
