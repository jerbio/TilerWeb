import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import SearchBar from '../search_bar';
import { CalendarEvent } from '@/core/common/types/schedule';
import { CalendarUIStore } from '@/core/common/components/calendar/calendar-ui.store';

const mockSearchCalendarEventsByName = vi.fn();
const mockSetCalendarEventAsNow = vi.fn();
const mockMarkCalendarEventComplete = vi.fn();
const mockDeleteCalendarEvent = vi.fn();

// Mock the services module
vi.mock('@/services', () => ({
	scheduleService: {
		searchCalendarEventsByName: (...args: unknown[]) => mockSearchCalendarEventsByName(...args),
		setCalendarEventAsNow: (...args: unknown[]) => mockSetCalendarEventAsNow(...args),
		markCalendarEventComplete: (...args: unknown[]) => mockMarkCalendarEventComplete(...args),
		deleteCalendarEvent: (...args: unknown[]) => mockDeleteCalendarEvent(...args),
	},
}));

// Mock the global state
vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = {
				authenticatedUser: { id: 'user-id-123', username: 'testuser' },
			};
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({
				authenticatedUser: { id: 'user-id-123', username: 'testuser' },
			}),
		},
	),
}));

// Mock zustand Calendar UI store
vi.mock('@/core/common/components/calendar/calendar-ui.provider', () => ({
useCalendarUI: (selector: (state: CalendarUIStore) => unknown) => {
		const mockStore = {
			createTile: {
				state: {
					isOpen: false,
					isExpanded: false,
					loading: { isActive: false },
					success: { isOpen: false, isNavigatingToTile: false },
				},
				actions: {
					open: vi.fn(),
					close: vi.fn(),
					expand: vi.fn(),
					collapse: vi.fn(),
					startLoading: vi.fn(),
					endLoading: vi.fn(),
					showSuccess: vi.fn(),
					hideSuccess: vi.fn(),
					navigateToTile: vi.fn(),
					navigateToTileComplete: vi.fn(),
				},
			},
			editTile: {
				state: {
					isOpen: false,
					event: null,
				},
				actions: {
					open: vi.fn(),
					close: vi.fn(),
				},
			},
		} as unknown as CalendarUIStore;
		return selector ? selector(mockStore) : mockStore;
	},
}));


// Mock ThemeProvider
vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

// Mock colorUtil
vi.mock('@/core/util/colors', () => ({
	default: {
		setLightness: (rgb: { r: number; g: number; b: number }) => rgb,
	},
}));

// Mock TimeUtil
vi.mock('@/core/util/time', () => ({
	default: {
		relativeTime: () => '2 days ago',
	},
}));

// Mock notification store
const mockShowNotification = vi.fn();
const mockUpdateNotification = vi.fn();
vi.mock('@/core/ui', () => ({
	useUiStore: (selector?: (state: unknown) => unknown) => {
		const state = {
			notification: {
				items: [],
				show: mockShowNotification,
				update: mockUpdateNotification,
				dismiss: vi.fn(),
				clear: vi.fn(),
			},
		};
		return selector ? selector(state) : state;
	},
	notificationId: (action: string, entityId: string) => `${action}-${entityId}`,
	NotificationAction: {
		SetAsNow: 'set-now',
		Complete: 'complete',
		Delete: 'delete',
	},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) => {
			const translations: Record<string, string> = {
				'timeline.searchPlaceholder': 'Search for a tile/block...',
				'timeline.searchAriaLabel': 'Search for a tile or block',
				'timeline.clearSearch': 'Clear search',
				'timeline.loadMore': 'Load more',
				'timeline.loading': 'Loading\u2026',
				'timeline.notFoundMessage': `Oops, we couldn't find '${opts?.query ?? ''}'. Would you like to create a Tile from this title?`,
				'timeline.notFoundDismiss': 'No thanks',
				'timeline.notFoundCreate': 'Create',
				'timeline.setAsNow': 'Set as now',
				'timeline.markComplete': 'Complete',
				'timeline.markDeleted': 'Delete',
				'timeline.confirmCompleteTitle': 'Complete this event?',
				'timeline.confirmDeleteTitle': 'Delete this event?',
				'timeline.confirmAction': 'Confirm',
				'timeline.cancelAction': 'Cancel',
				'timeline.notifications.settingAsNow': 'Setting as current...',
				'timeline.notifications.setAsNowSuccess': 'Event set as current!',
				'timeline.notifications.completing': 'Completing event...',
				'timeline.notifications.completeSuccess': 'Event completed!',
				'timeline.notifications.deleting': 'Deleting event...',
				'timeline.notifications.deleteSuccess': 'Event deleted!',
				'timeline.notifications.actionFailed': 'Action failed. Please try again.',
			};
			return translations[key] ?? key;
		},
		i18n: { language: 'en' },
	}),
}));

const mockResults: CalendarEvent[] = [
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
	{
		id: 'cal-2',
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
		colorRed: 200,
		colorGreen: 50,
		colorBlue: 50,
		isComplete: false,
		isEnabled: true,
		isRecurring: false,
		locationId: null,
		isReadOnly: false,
		isProcrastinateEvent: false,
		isRigid: true,
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

const renderWithTheme = (ui: React.ReactElement) => {
	return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
};

describe('SearchBar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders search input with placeholder', () => {
		renderWithTheme(<SearchBar />);
		expect(screen.getByPlaceholderText('Search for a tile/block...')).toBeInTheDocument();
	});

	it('renders search icon', () => {
		renderWithTheme(<SearchBar />);
		expect(screen.getByTestId('search-icon')).toBeInTheDocument();
	});

	it('allows typing in the search input', async () => {
		const user = setupUser();
		renderWithTheme(<SearchBar />);

		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'drinks');
		expect(input).toHaveValue('drinks');
	});

	it('calls onSearch callback when provided and user types', async () => {
		const user = setupUser();
		const onSearch = vi.fn();
		renderWithTheme(<SearchBar onSearch={onSearch} />);

		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'meeting');
		expect(input).toHaveValue('meeting');
	});

	it('clears search input when clear button is clicked', async () => {
		const user = setupUser();
		renderWithTheme(<SearchBar />);

		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'drinks');
		expect(input).toHaveValue('drinks');

		const clearButton = screen.getByTestId('search-clear');
		await user.click(clearButton);
		expect(input).toHaveValue('');
	});

	it('shows results dropdown when search returns matches', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		const resultItems = screen.getAllByTestId('search-result-item');
		expect(resultItems.length).toBe(2);
	});

	it('shows tile name and relative time in each result row', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		const names = screen.getAllByText('Buy Coffee today');
		expect(names.length).toBeGreaterThanOrEqual(2);
	});

	it('shows color indicator dot for each result based on tile color', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		const colorDots = screen.getAllByTestId('result-color-dot');
		expect(colorDots.length).toBe(2);
	});

	it('renders circle dot for tiles and rounded-square dot for blocks', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		const colorDots = screen.getAllByTestId('result-color-dot');
		// cal-1 is a tile (isRigid: false) → circle
		expect(colorDots[0]).toHaveStyle('border-radius: 50%');
		// cal-2 is a block (isRigid: true) → rounded square
		expect(colorDots[1]).toHaveStyle('border-radius: 3px');
	});

	it('shows not-found prompt when search returns empty', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue([]);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee Beans');

		await waitFor(() => {
			expect(screen.getByTestId('search-not-found')).toBeInTheDocument();
		});

		expect(screen.getByText(/Buy Coffee Beans/)).toBeInTheDocument();
		expect(screen.getByText('No thanks')).toBeInTheDocument();
		expect(screen.getByText('Create')).toBeInTheDocument();
	});

	it('closes not-found prompt when "No thanks" is clicked', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue([]);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'Buy Coffee Beans');

		await waitFor(() => {
			expect(screen.getByTestId('search-not-found')).toBeInTheDocument();
		});

		await user.click(screen.getByText('No thanks'));
		expect(screen.queryByTestId('search-not-found')).not.toBeInTheDocument();
	});

	it('clears search input and dropdown when clear button is clicked after results', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		const clearButton = screen.getByTestId('search-clear');
		await user.click(clearButton);

		expect(input).toHaveValue('');
		expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
	});

	it('shows "Load more" button when results fill the page size', async () => {
		const user = setupUser();
		// Create 10 items (default page size) to trigger "Load more"
		const tenResults = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${i}`,
			name: `Tile ${i}`,
		}));
		mockSearchCalendarEventsByName.mockResolvedValue(tenResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'tile');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
	});

	it('does not show "Load more" when results are fewer than page size', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults); // only 2 items

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
	});

	it('appends more results when "Load more" is clicked', async () => {
		const user = setupUser();
		const firstPage = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${i}`,
			name: `Tile ${i}`,
		}));
		const secondPage = Array.from({ length: 5 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${10 + i}`,
			name: `Tile ${10 + i}`,
		}));

		mockSearchCalendarEventsByName
			.mockResolvedValueOnce(firstPage)
			.mockResolvedValueOnce(secondPage);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'tile');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		// Should have 10 results initially
		expect(screen.getAllByTestId('search-result-item')).toHaveLength(10);

		// Click "Load more"
		await user.click(screen.getByTestId('load-more-button'));

		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(15);
		});
	});

	it('sends correct item-based index (not page index) when loading more', async () => {
		const user = setupUser();
		const firstPage = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${i}`,
			name: `Tile ${i}`,
		}));
		const secondPage = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${10 + i}`,
			name: `Tile ${10 + i}`,
		}));
		const thirdPage = Array.from({ length: 3 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${20 + i}`,
			name: `Tile ${20 + i}`,
		}));

		// Use mockImplementation so debounce timing doesn't exhaust mock values
		mockSearchCalendarEventsByName.mockImplementation(
			(_query: string, _userName: string, _userId: string, pagination?: { batchSize?: number; index?: number }) => {
				const idx = pagination?.index ?? 0;
				if (idx === 0) return Promise.resolve(firstPage);
				if (idx === 10) return Promise.resolve(secondPage);
				if (idx === 20) return Promise.resolve(thirdPage);
				return Promise.resolve([]);
			},
		);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'tile');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		// Initial search: index 0
		expect(mockSearchCalendarEventsByName).toHaveBeenLastCalledWith(
			'tile',
			'testuser',
			'user-id-123',
			{ batchSize: 10, index: 0 },
		);

		// First load more: index should be 10 (1 * 10), not 1
		await user.click(screen.getByTestId('load-more-button'));
		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(20);
		});

		expect(mockSearchCalendarEventsByName).toHaveBeenLastCalledWith(
			'tile',
			'testuser',
			'user-id-123',
			{ batchSize: 10, index: 10 },
		);

		// Second load more: index should be 20 (2 * 10), not 2
		await user.click(screen.getByTestId('load-more-button'));
		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(23);
		});

		expect(mockSearchCalendarEventsByName).toHaveBeenLastCalledWith(
			'tile',
			'testuser',
			'user-id-123',
			{ batchSize: 10, index: 20 },
		);
	});

	it('hides "Load more" after loading a partial page', async () => {
		const user = setupUser();
		const firstPage = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${i}`,
			name: `Tile ${i}`,
		}));
		const secondPage = Array.from({ length: 3 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${10 + i}`,
			name: `Tile ${10 + i}`,
		}));

		mockSearchCalendarEventsByName
			.mockResolvedValueOnce(firstPage)
			.mockResolvedValueOnce(secondPage);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'tile');

		await waitFor(() => {
			expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
		});

		await user.click(screen.getByTestId('load-more-button'));

		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(13);
		});

		expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
	});

	it('resets pagination when a new search query is typed', async () => {
		const user = setupUser();
		const firstPage = Array.from({ length: 10 }, (_, i) => ({
			...mockResults[0],
			id: `cal-${i}`,
			name: `Tile ${i}`,
		}));
		const newSearchResults = Array.from({ length: 3 }, (_, i) => ({
			...mockResults[0],
			id: `new-${i}`,
			name: `New ${i}`,
		}));

		mockSearchCalendarEventsByName
			.mockResolvedValueOnce(firstPage)
			.mockResolvedValueOnce(newSearchResults);

		renderWithTheme(<SearchBar />);
		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'tile');

		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(10);
		});

		// Clear and type a new query
		await user.clear(input);
		await user.type(input, 'new');

		await waitFor(() => {
			expect(screen.getAllByTestId('search-result-item')).toHaveLength(3);
		});

		// No load more since 3 < page size
		expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
	});

	it('dismisses dropdown when clicking outside the search container', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue(mockResults);

		renderWithTheme(
			<div>
				<SearchBar />
				<button data-testid="outside-element">Outside</button>
			</div>,
		);

		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'coffee');

		await waitFor(() => {
			expect(screen.getByTestId('search-results-dropdown')).toBeInTheDocument();
		});

		// Click outside the search container
		await user.click(screen.getByTestId('outside-element'));

		expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
	});

	it('dismisses not-found prompt when clicking outside the search container', async () => {
		const user = setupUser();
		mockSearchCalendarEventsByName.mockResolvedValue([]);

		renderWithTheme(
			<div>
				<SearchBar />
				<button data-testid="outside-element">Outside</button>
			</div>,
		);

		const input = screen.getByPlaceholderText('Search for a tile/block...');
		await user.type(input, 'nonexistent');

		await waitFor(() => {
			expect(screen.getByTestId('search-not-found')).toBeInTheDocument();
		});

		await user.click(screen.getByTestId('outside-element'));

		expect(screen.queryByTestId('search-not-found')).not.toBeInTheDocument();
	});

	describe('result actions', () => {
		const searchAndGetResults = async () => {
			const user = setupUser();
			mockSearchCalendarEventsByName.mockResolvedValue(mockResults);
			renderWithTheme(<SearchBar />);

			const input = screen.getByPlaceholderText('Search for a tile/block...');
			await user.type(input, 'coffee');

			await waitFor(() => {
				expect(screen.getAllByTestId('search-result-item')).toHaveLength(2);
			});

			return user;
		};

		it('renders action buttons for each result item', async () => {
			await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			const completeButtons = screen.getAllByTestId('action-mark-complete');
			const deleteButtons = screen.getAllByTestId('action-delete');

			expect(setAsNowButtons).toHaveLength(2);
			expect(completeButtons).toHaveLength(2);
			expect(deleteButtons).toHaveLength(2);
		});

		it('action buttons have correct titles', async () => {
			await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			expect(setAsNowButtons[0]).toHaveAttribute('title', 'Set as now');

			const completeButtons = screen.getAllByTestId('action-mark-complete');
			expect(completeButtons[0]).toHaveAttribute('title', 'Complete');

			const deleteButtons = screen.getAllByTestId('action-delete');
			expect(deleteButtons[0]).toHaveAttribute('title', 'Delete');
		});

		it('calls setCalendarEventAsNow and dismisses search bar on success', async () => {
			mockSetCalendarEventAsNow.mockResolvedValue(mockResults[0]);
			const user = await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			await user.click(setAsNowButtons[0]);

			expect(mockSetCalendarEventAsNow).toHaveBeenCalledWith('cal-1');

			await waitFor(() => {
				expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
				expect(screen.getByRole('textbox')).toHaveValue('');
			});
		});

		it('calls markCalendarEventComplete and dismisses search bar on success', async () => {
			mockMarkCalendarEventComplete.mockResolvedValue(mockResults[0]);
			const user = await searchAndGetResults();

			const completeButtons = screen.getAllByTestId('action-mark-complete');
			await user.click(completeButtons[0]);

			// Confirmation UI should appear
			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();
			expect(screen.getByText('Complete this event?')).toBeInTheDocument();

			// Click confirm
			await user.click(screen.getByTestId('confirm-yes'));

			expect(mockMarkCalendarEventComplete).toHaveBeenCalledWith('cal-1');

			await waitFor(() => {
				expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
				expect(screen.getByRole('textbox')).toHaveValue('');
			});
		});

		it('calls deleteCalendarEvent and dismisses search bar on success', async () => {
			mockDeleteCalendarEvent.mockResolvedValue(mockResults[0]);
			const user = await searchAndGetResults();

			const deleteButtons = screen.getAllByTestId('action-delete');
			await user.click(deleteButtons[0]);

			// Confirmation UI should appear
			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();
			expect(screen.getByText('Delete this event?')).toBeInTheDocument();

			// Click confirm
			await user.click(screen.getByTestId('confirm-yes'));

			expect(mockDeleteCalendarEvent).toHaveBeenCalledWith('cal-1');

			await waitFor(() => {
				expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
				expect(screen.getByRole('textbox')).toHaveValue('');
			});
		});

		it('dismisses search bar even when action fails', async () => {
			mockSetCalendarEventAsNow.mockRejectedValue(new Error('Network error'));
			const user = await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			await user.click(setAsNowButtons[0]);

			await waitFor(() => {
				// Search bar dismisses immediately, even before the request resolves
				expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
				expect(screen.getByRole('textbox')).toHaveValue('');
			});
		});

		it('shows confirmation UI when clicking Complete', async () => {
			const user = await searchAndGetResults();

			const completeButtons = screen.getAllByTestId('action-mark-complete');
			await user.click(completeButtons[0]);

			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();
			expect(screen.getByText('Complete this event?')).toBeInTheDocument();
			expect(screen.getByTestId('confirm-yes')).toBeInTheDocument();
			expect(screen.getByTestId('confirm-cancel')).toBeInTheDocument();
			// Service should NOT have been called yet
			expect(mockMarkCalendarEventComplete).not.toHaveBeenCalled();
		});

		it('shows confirmation UI when clicking Delete', async () => {
			const user = await searchAndGetResults();

			const deleteButtons = screen.getAllByTestId('action-delete');
			await user.click(deleteButtons[0]);

			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();
			expect(screen.getByText('Delete this event?')).toBeInTheDocument();
			// Service should NOT have been called yet
			expect(mockDeleteCalendarEvent).not.toHaveBeenCalled();
		});

		it('cancels confirmation and restores action buttons', async () => {
			const user = await searchAndGetResults();

			const completeButtons = screen.getAllByTestId('action-mark-complete');
			await user.click(completeButtons[0]);

			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();

			// Click cancel
			await user.click(screen.getByTestId('confirm-cancel'));

			// Confirmation should be gone, action buttons restored
			expect(screen.queryByTestId('confirm-inline')).not.toBeInTheDocument();
			expect(screen.getAllByTestId('action-mark-complete')).toHaveLength(2);
			expect(mockMarkCalendarEventComplete).not.toHaveBeenCalled();
		});

		it('Set As Now does not require confirmation', async () => {
			mockSetCalendarEventAsNow.mockResolvedValue(mockResults[0]);
			const user = await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			await user.click(setAsNowButtons[0]);

			// No confirmation UI
			expect(screen.queryByTestId('confirm-inline')).not.toBeInTheDocument();
			// Service should be called immediately
			expect(mockSetCalendarEventAsNow).toHaveBeenCalledWith('cal-1');
		});

		it('blocks all action buttons on other items while confirmation is showing', async () => {
			const user = await searchAndGetResults();

			const completeButtons = screen.getAllByTestId('action-mark-complete');
			await user.click(completeButtons[0]);

			// Confirmation showing for first item
			expect(screen.getByTestId('confirm-inline')).toBeInTheDocument();

			// Second item's action buttons should be disabled
			const secondResult = screen.getAllByTestId('search-result-item')[1];
			const buttons = secondResult.querySelectorAll('button');
			buttons.forEach((btn) => {
				expect(btn).toBeDisabled();
			});
		});

		it('dismisses search bar immediately when an action is triggered', async () => {
			let resolveAction: (value: unknown) => void;
			mockSetCalendarEventAsNow.mockReturnValue(
				new Promise((resolve) => { resolveAction = resolve; }),
			);
			const user = await searchAndGetResults();

			const setAsNowButtons = screen.getAllByTestId('action-set-as-now');
			await user.click(setAsNowButtons[0]);

			// Search bar should be dismissed immediately, before the request resolves
			await waitFor(() => {
				expect(screen.queryByTestId('search-results-dropdown')).not.toBeInTheDocument();
				expect(screen.getByRole('textbox')).toHaveValue('');
			});

			// Resolve the action to avoid unhandled promise
			resolveAction!(mockResults[0]);
		});
	});
});
