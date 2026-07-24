import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import dayjs from 'dayjs';
import CalendarDatePicker from '../calendar_date_picker';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

const defaultProps = {
	isOpen: true,
	onClose: vi.fn(),
	onDateSelect: vi.fn(),
	startDay: dayjs('2025-07-07'), // a Monday
	daysInView: 7,
};

describe('CalendarDatePicker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders nothing when closed', () => {
		const { container } = renderWithTheme(
			<CalendarDatePicker {...defaultProps} isOpen={false} />
		);
		expect(container.innerHTML).toBe('');
	});

	it('renders when open', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		// Month label should be visible
		expect(screen.getByText('July')).toBeInTheDocument();
	});

	it('displays the month name matching the startDay prop', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} startDay={dayjs('2025-03-15')} />);
		expect(screen.getByText('March')).toBeInTheDocument();
	});

	it('renders 7 day-of-week header labels', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		// dayjs locale default week starts Sunday: Su, Mo, Tu, We, Th, Fr, Sa
		const dayNames = screen.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/);
		expect(dayNames.length).toBe(7);
	});

	it('navigates to the next month', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		expect(screen.getByText('July')).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText('Next month'));

		expect(screen.getByText('August')).toBeInTheDocument();
	});

	it('navigates to the previous month', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		expect(screen.getByText('July')).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText('Previous month'));

		expect(screen.getByText('June')).toBeInTheDocument();
	});

	it('calls onDateSelect and onClose when a date is clicked', () => {
		const onDateSelect = vi.fn();
		const onClose = vi.fn();
		renderWithTheme(
			<CalendarDatePicker {...defaultProps} onDateSelect={onDateSelect} onClose={onClose} />
		);

		// Click a date cell showing "15"
		const dateCells = screen.getAllByText('15');
		fireEvent.click(dateCells[0]);

		expect(onDateSelect).toHaveBeenCalledTimes(1);
		const selectedDate = onDateSelect.mock.calls[0][0] as dayjs.Dayjs;
		expect(selectedDate.date()).toBe(15);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('closes on Escape key press', () => {
		const onClose = vi.fn();
		renderWithTheme(<CalendarDatePicker {...defaultProps} onClose={onClose} />);

		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('renders 6 rows of 7 date cells (42 total) in calendar mode', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		// prev nav + year button + next nav = 3 header buttons; 42 date cells = 45 total
		const allButtons = screen.getAllByRole('button');
		expect(allButtons.length).toBe(45);
	});
});

describe('CalendarDatePicker — year picker', () => {
	beforeEach(() => vi.clearAllMocks());

	it('clicking the year button switches to year-selection mode', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		fireEvent.click(screen.getByLabelText(/select year/i));
		// Day-of-week headers disappear
		expect(screen.queryByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/)).not.toBeInTheDocument();
		// Year cells appear
		const yearCells = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''));
		expect(yearCells.length).toBe(12);
	});

	it('year grid contains the year of the selected date', () => {
		renderWithTheme(
			<CalendarDatePicker {...defaultProps} selectedDate={dayjs('2025-07-07')} />
		);
		fireEvent.click(screen.getByLabelText(/select year/i));
		const yearCells = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''));
		const years = yearCells.map((b) => Number(b.textContent?.trim()));
		expect(years).toContain(2025);
	});

	it('clicking a year returns to calendar mode for that year', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		fireEvent.click(screen.getByLabelText(/select year/i));
		// Pick any year that is visible in the initial grid (should include 2025)
		const target = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '2025');
		expect(target).toBeDefined();
		fireEvent.click(target!);
		// Back to calendar mode — day headers present, year grid gone
		expect(screen.queryByText(/^Su$/)).toBeInTheDocument();
		// Header shows 2025
		expect(screen.getByLabelText(/select year/i).textContent?.trim()).toBe('2025');
	});

	it('navigating forward in year mode shifts the year range by 12', () => {
		renderWithTheme(
			<CalendarDatePicker {...defaultProps} selectedDate={dayjs('2025-07-07')} />
		);
		fireEvent.click(screen.getByLabelText(/select year/i));
		const initialYears = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
			.map((b) => Number(b.textContent?.trim()));
		const initialMax = Math.max(...initialYears);

		fireEvent.click(screen.getByLabelText('Next years'));

		const updatedYears = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
			.map((b) => Number(b.textContent?.trim()));
		expect(Math.min(...updatedYears)).toBe(initialMax + 1);
	});

	it('navigating backward in year mode shifts the year range by 12', () => {
		renderWithTheme(
			<CalendarDatePicker {...defaultProps} selectedDate={dayjs('2025-07-07')} />
		);
		fireEvent.click(screen.getByLabelText(/select year/i));
		const initialYears = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
			.map((b) => Number(b.textContent?.trim()));
		const initialMin = Math.min(...initialYears);

		fireEvent.click(screen.getByLabelText('Previous years'));

		const updatedYears = screen
			.getAllByRole('button')
			.filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
			.map((b) => Number(b.textContent?.trim()));
		expect(Math.max(...updatedYears)).toBe(initialMin - 1);
	});
});

describe('CalendarDatePicker — date text input', () => {
	beforeEach(() => vi.clearAllMocks());

	it('shows a text input in the picker', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('text input has a non-empty placeholder showing the expected format', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		const placeholder = screen.getByRole('textbox').getAttribute('placeholder') ?? '';
		expect(placeholder.length).toBeGreaterThan(0);
		// Placeholder should contain YYYY (4-digit year marker) regardless of locale
		expect(placeholder).toContain('YYYY');
	});

	it('pre-fills input with the selected date when opened', () => {
		renderWithTheme(
			<CalendarDatePicker {...defaultProps} selectedDate={dayjs('2025-08-20')} />
		);
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).not.toBe('');
	});

	it('typing an ISO date and pressing Enter selects that date', () => {
		const onDateSelect = vi.fn();
		renderWithTheme(<CalendarDatePicker {...defaultProps} onDateSelect={onDateSelect} />);
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: '2030-03-15' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(onDateSelect).toHaveBeenCalledTimes(1);
		const selected = onDateSelect.mock.calls[0][0] as dayjs.Dayjs;
		expect(selected.year()).toBe(2030);
		expect(selected.month()).toBe(2); // March = 2 (0-indexed)
		expect(selected.date()).toBe(15);
	});

	it('blurring the input with a valid ISO date selects that date', () => {
		const onDateSelect = vi.fn();
		renderWithTheme(<CalendarDatePicker {...defaultProps} onDateSelect={onDateSelect} />);
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: '2025-11-22' } });
		fireEvent.blur(input);
		expect(onDateSelect).toHaveBeenCalledTimes(1);
		const selected = onDateSelect.mock.calls[0][0] as dayjs.Dayjs;
		expect(selected.year()).toBe(2025);
		expect(selected.month()).toBe(10); // November = 10 (0-indexed)
		expect(selected.date()).toBe(22);
	});

	it('typing an invalid string and pressing Enter does not call onDateSelect', () => {
		const onDateSelect = vi.fn();
		renderWithTheme(<CalendarDatePicker {...defaultProps} onDateSelect={onDateSelect} />);
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: 'not-a-date' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(onDateSelect).not.toHaveBeenCalled();
	});

	it('valid input navigates the calendar to the correct month', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: '2030-11-01' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(screen.getByText('November')).toBeInTheDocument();
	});
});
