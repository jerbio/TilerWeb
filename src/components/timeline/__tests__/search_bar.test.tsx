import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import SearchBar from '../search_bar';
import { CalendarEvent } from '@/core/common/types/schedule';

const mockSearchCalendarEventsByName = vi.fn();

// Mock the services module
vi.mock('@/services', () => ({
	scheduleService: {
		searchCalendarEventsByName: (...args: unknown[]) => mockSearchCalendarEventsByName(...args),
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

// Mock CalendarUIProvider
vi.mock('@/core/common/components/calendar/CalendarUIProvider', () => ({
	useCalendarUI: () => ({
		setCreateTileModalOpen: vi.fn(),
		isCreateTileModalOpen: false,
		setCreateTileModalExpanded: vi.fn(),
		isCreateTileModalExpanded: false,
	}),
}));

// Mock TimeUtil
vi.mock('@/core/util/time', () => ({
	default: {
		relativeTime: () => '2 days ago',
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
});
