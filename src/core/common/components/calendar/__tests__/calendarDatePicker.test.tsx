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

		// Click next month button (second nav button)
		const buttons = screen.getAllByRole('button');
		const nextButton = buttons[1]; // first is prev, second is next
		fireEvent.click(nextButton);

		expect(screen.getByText('August')).toBeInTheDocument();
	});

	it('navigates to the previous month', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		expect(screen.getByText('July')).toBeInTheDocument();

		const buttons = screen.getAllByRole('button');
		const prevButton = buttons[0];
		fireEvent.click(prevButton);

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

	it('renders 6 rows of 7 date cells (42 total)', () => {
		renderWithTheme(<CalendarDatePicker {...defaultProps} />);
		// All clickable date cells are buttons (42 date cells + 2 nav buttons = 44)
		const allButtons = screen.getAllByRole('button');
		// 2 nav buttons + 42 date cells
		expect(allButtons.length).toBe(44);
	});
});
