import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import SearchBar from '../search_bar';
import {
	CalendarEvent,
	CalendarSearchItem,
	CalendarSearchEnvelope,
} from '@/core/common/types/schedule';
import { CalendarSearchUnavailableError } from '@/core/common/types/errors';
import dayjs from 'dayjs';

// Feature flag is mutable per-test so we can exercise both on and off.
const flagState = vi.hoisted(() => ({ value: true }));
vi.mock('@/hooks/useFlag', () => ({
	useFlag: () => flagState.value,
}));

const mockSearchMultiSource = vi.fn();
const mockSearchByName = vi.fn();
const mockSetCalendarEventAsNow = vi.fn();
const mockMarkCalendarEventComplete = vi.fn();
const mockDeleteCalendarEvent = vi.fn();

vi.mock('@/services', () => ({
	scheduleService: {
		searchCalendarEventsMultiSource: (...args: unknown[]) => mockSearchMultiSource(...args),
		searchCalendarEventsByName: (...args: unknown[]) => mockSearchByName(...args),
		setCalendarEventAsNow: (...args: unknown[]) => mockSetCalendarEventAsNow(...args),
		markCalendarEventComplete: (...args: unknown[]) => mockMarkCalendarEventComplete(...args),
		deleteCalendarEvent: (...args: unknown[]) => mockDeleteCalendarEvent(...args),
	},
}));

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = { authenticatedUser: { id: 'user-id-123', username: 'testuser' } };
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({ authenticatedUser: { id: 'user-id-123', username: 'testuser' } }),
		}
	),
}));

const mockOpenEditTile = vi.fn();
vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
	useCalendarUI: (selector: (state: unknown) => unknown) => {
		const store = {
			demoMode: false,
			createSelection: {
				state: { isOpen: false },
				actions: { open: vi.fn(), close: vi.fn() },
			},
			editTile: {
				state: { isOpen: false, event: null },
				actions: { open: mockOpenEditTile, close: vi.fn() },
			},
			viewInfo: { startDay: dayjs(), daysInView: 7 },
			setViewInfo: vi.fn(),
		};
		return selector ? selector(store) : store;
	},
}));

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('@/core/util/colors', () => ({
	default: {
		setLightness: (rgb: { r: number; g: number; b: number }) => rgb,
	},
}));

vi.mock('@/core/util/time', () => ({
	default: { relativeTime: () => '2 days ago' },
}));

vi.mock('@/core/ui', () => ({
	useUiStore: (selector?: (state: unknown) => unknown) => {
		const state = {
			notification: {
				items: [],
				show: vi.fn(),
				update: vi.fn(),
				dismiss: vi.fn(),
				clear: vi.fn(),
			},
		};
		return selector ? selector(state) : state;
	},
	notificationId: (action: string, entityId: string) => `${action}-${entityId}`,
	NotificationAction: { SetAsNow: 'set-now', Complete: 'complete', Delete: 'delete' },
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) => {
			const translations: Record<string, string> = {
				'timeline.searchPlaceholder': 'Search for a tile/block...',
				'timeline.searchAriaLabel': 'Search for a tile or block',
				'timeline.clearSearch': 'Clear search',
				'timeline.multiSource.sourceTiler': 'Tiler',
				'timeline.multiSource.sourceGoogle': 'Google',
				'timeline.multiSource.sourceMicrosoft': 'Microsoft',
				'timeline.multiSource.connectedAccount': `Connected account: ${opts?.account ?? ''}`,
				'timeline.multiSource.partialFailure': `Some connected calendars failed to search: ${opts?.sources ?? ''}`,
				'timeline.multiSource.retrySearch': 'Retry',
				'timeline.multiSource.unavailable': 'Search is temporarily unavailable.',
				'timeline.multiSource.readOnly': 'Read-only',
				'timeline.notFoundMessage': `Oops, we couldn't find '${opts?.query ?? ''}'.`,
				'timeline.notFoundDismiss': 'No thanks',
				'timeline.notFoundCreate': 'Create',
				'timeline.editEvent': 'Edit',
				'timeline.setAsNow': 'Set as now',
				'timeline.markComplete': 'Complete',
				'timeline.markDeleted': 'Delete',
			};
			return translations[key] ?? key;
		},
		i18n: { language: 'en' },
	}),
	initReactI18next: () => {},
}));

// Mock the i18n config so errors.ts's top-level `i18n.init()` never runs (it would
// otherwise require a fully-wired react-i18next instance in the test env).
vi.mock('@/i18n/config', () => ({
	__esModule: true,
	default: { isInitialized: false, t: (key: string) => key },
}));

const fullCaps = { canEdit: true, canDelete: true, canComplete: true, canSetAsNow: true };

const googleItem: CalendarSearchItem = {
	id: 'g-1',
	name: 'Golf',
	start: Date.now(),
	end: Date.now() + 3600000,
	source: 'google',
	thirdPartyEventId: 'gp-evt-99',
	thirdPartyUserId: 'golfer@gmail.com',
	isReadOnly: false,
	capabilities: { canEdit: true, canDelete: true, canComplete: false, canSetAsNow: false },
};

const tilerItem: CalendarSearchItem = {
	id: 't-1',
	name: 'Workout',
	start: Date.now(),
	end: Date.now() + 3600000,
	source: 'tiler',
	thirdPartyEventId: null,
	thirdPartyUserId: null,
	isReadOnly: false,
	capabilities: { ...fullCaps },
};

const legacyResults: CalendarEvent[] = [
	{
		id: 'cal-1',
		name: 'Buy Coffee today',
		start: Date.now() - 2 * 24 * 60 * 60 * 1000,
		end: Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000,
		address: null,
		addressDescription: null,
		searchdDescription: null,
		splitCount: 1,
		completeCount: 0,
		deletionCount: 0,
		thirdpartyType: null,
		thirdPartyId: null,
		thirdPartyUserId: null,
		colorOpacity: 1,
		colorRed: 100,
		colorGreen: 150,
		colorBlue: 200,
		isComplete: false,
		isEnabled: true,
		isRecurring: true,
		locationId: null,
		isReadOnly: false,
		isProcrastinateEvent: false,
		isRigid: false,
		uiConfig: null,
		repetition: null,
		eachTileDuration: 3600000,
		restrictionProfile: null,
		emojis: null,
		isWhatIf: false,
		entityName: null,
		blob: null,
		subEvents: null,
	},
];

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const input = () => screen.getByPlaceholderText('Search for a tile/block...');

describe('SearchBar multi-source (Phase 4)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		flagState.value = true;
	});

	it('renders a source badge and connected-account context per item (S4-3)', async () => {
		const envelope: CalendarSearchEnvelope = {
			items: [googleItem, tilerItem],
			sources: [
				{ source: 'google', status: 'success', queryMode: 'native-query' },
				{ source: 'tiler', status: 'success', queryMode: 'native-query' },
			],
			correlationId: 'c1',
		};
		mockSearchMultiSource.mockResolvedValue(envelope);

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'golf');

		await waitFor(() =>
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument()
		);

		const badges = screen.getAllByTestId('source-badge').map((b) => b.textContent);
		expect(badges).toEqual(expect.arrayContaining(['Google', 'Tiler']));

		// Only the google item exposes a connected account.
		expect(screen.getByTestId('connected-account')).toHaveTextContent('golfer@gmail.com');
		expect(screen.getAllByTestId('connected-account')).toHaveLength(1);

		// S4-4 — actions render from capabilities. googleItem disallows
		// canComplete/canSetAsNow, so those actions are absent for that row only.
		expect(screen.getAllByTestId('action-edit')).toHaveLength(2);
		expect(screen.getAllByTestId('action-delete')).toHaveLength(2);
		expect(screen.getAllByTestId('action-mark-complete')).toHaveLength(1);
		expect(screen.getAllByTestId('action-set-as-now')).toHaveLength(1);
	});

	it('discards stale / out-of-order responses (S4-2)', async () => {
		const itemA: CalendarSearchItem = { ...tilerItem, id: 'a', name: 'AAA' };
		const itemB: CalendarSearchItem = { ...tilerItem, id: 'b', name: 'BBB' };

		let resolveFirst: (v: unknown) => void;
		const firstPromise = new Promise((r) => {
			resolveFirst = r;
		});
		mockSearchMultiSource
			.mockReturnValueOnce(firstPromise) // first search "go" — stays pending
			.mockResolvedValueOnce({
				items: [itemB],
				sources: [],
				correlationId: 'cB',
			}); // second search "gof" — resolves immediately

		const user = setupUser();
		renderWithTheme(<SearchBar />);

		await user.type(input(), 'go');
		await sleep(400);
		expect(mockSearchMultiSource).toHaveBeenCalledTimes(1);

		await user.type(input(), 'f');
		await sleep(400);
		expect(mockSearchMultiSource).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(screen.getByText('BBB')).toBeInTheDocument());

		// Resolve the stale first search — it must be discarded.
		resolveFirst!({ items: [itemA], sources: [], correlationId: 'cA' });
		await sleep(50);

		expect(screen.queryByText('AAA')).not.toBeInTheDocument();
		expect(screen.getByText('BBB')).toBeInTheDocument();
	});

	it('shows a partial-failure warning with retry, not "no matches" (S4-5)', async () => {
		const envelope: CalendarSearchEnvelope = {
			items: [tilerItem],
			sources: [
				{ source: 'tiler', status: 'success', queryMode: 'native-query' },
				{
					source: 'google',
					status: 'partial',
					queryMode: 'native-query',
					category: 'timeout',
					retryable: true,
					failureCount: 2,
				},
			],
			correlationId: 'c1',
		};
		mockSearchMultiSource.mockResolvedValue(envelope);

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'golf');

		await waitFor(() => expect(screen.getByTestId('partial-warning')).toBeInTheDocument());
		expect(
			screen.getByText(/Some connected calendars failed to search: Google/)
		).toBeInTheDocument();
		expect(screen.getByTestId('retry-search')).toBeInTheDocument();
		expect(screen.getByText('Workout')).toBeInTheDocument();
		expect(screen.queryByTestId('search-not-found')).not.toBeInTheDocument();

		// Retry fires another multi-source search.
		await user.click(screen.getByTestId('retry-search'));
		expect(mockSearchMultiSource).toHaveBeenCalledTimes(2);
	});

	it('renders a typed unavailable state on 502, never "no matches" (S4-5)', async () => {
		mockSearchMultiSource.mockRejectedValueOnce(
			new CalendarSearchUnavailableError({
				error: 'search_unavailable',
				message: 'Search is temporarily unavailable.',
				correlationId: 'c9',
			})
		);

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'golf');

		await waitFor(() => expect(screen.getByTestId('search-unavailable')).toBeInTheDocument());
		expect(screen.getByText('Search is temporarily unavailable.')).toBeInTheDocument();
		expect(screen.queryByTestId('search-not-found')).not.toBeInTheDocument();
	});

	it('forwards third-party edit metadata and emits calendar_search_edit_opened (S4-6)', async () => {
		const envelope: CalendarSearchEnvelope = {
			items: [googleItem],
			sources: [{ source: 'google', status: 'success', queryMode: 'native-query' }],
			correlationId: 'c1',
		};
		mockSearchMultiSource.mockResolvedValue(envelope);

		let emitted: unknown = null;
		const onEditOpened = (e: Event) => {
			emitted = (e as CustomEvent).detail;
		};
		window.addEventListener('calendar_search_edit_opened', onEditOpened);

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'golf');

		await waitFor(() => expect(screen.getByTestId('action-edit')).toBeInTheDocument());
		await user.click(screen.getByTestId('action-edit'));

		expect(mockOpenEditTile).toHaveBeenCalledTimes(1);
		const passed = mockOpenEditTile.mock.calls[0][0] as CalendarEvent;
		expect(passed.thirdpartyType).toBe('google');
		expect(passed.thirdPartyId).toBe('gp-evt-99');
		expect(passed.thirdPartyUserId).toBe('golfer@gmail.com');

		expect(emitted).toMatchObject({ source: 'google', correlationId: 'c1' });

		window.removeEventListener('calendar_search_edit_opened', onEditOpened);
	});

	it('renders no Load More / pagination in multi-source mode', async () => {
		const many: CalendarSearchItem[] = Array.from({ length: 12 }, (_, i) => ({
			...tilerItem,
			id: `m-${i}`,
			name: `Result ${i}`,
		}));
		mockSearchMultiSource.mockResolvedValue({ items: many, sources: [], correlationId: 'c1' });

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'golf');

		await waitFor(() => expect(screen.getAllByTestId('search-result-item')).toHaveLength(12));
		expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
	});

	it('flag-off preserves the legacy name-search path', async () => {
		flagState.value = false;
		mockSearchByName.mockResolvedValue(legacyResults);

		const user = setupUser();
		renderWithTheme(<SearchBar />);
		await user.type(input(), 'coffee');

		await waitFor(() =>
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument()
		);
		expect(mockSearchByName).toHaveBeenCalled();
		expect(mockSearchMultiSource).not.toHaveBeenCalled();
		expect(screen.getAllByTestId('search-result-item')).toHaveLength(1);
	});
});
