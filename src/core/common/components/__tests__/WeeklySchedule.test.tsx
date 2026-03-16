import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import WeeklySchedule, { WeeklyScheduleSize } from '@/core/common/components/WeeklySchedule';
import type { DaySchedule } from '@/core/common/types/schedule';

const renderWithTheme = (ui: React.ReactElement) => {
	return render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>
		</I18nextProvider>,
	);
};

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const buildSchedule = (overrides?: (Partial<DaySchedule> | undefined)[]): DaySchedule[] =>
	DAYS.map((_, i) => ({
		dayIndex: i,
		startTime: '',
		endTime: '',
		...(overrides?.[i] ?? {}),
	}));

describe('WeeklySchedule', () => {
	describe('Rendering', () => {
		it('renders all 7 day labels', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />,
			);

			const dayHeaders = screen.getAllByTestId(/^day-label-/);
			expect(dayHeaders).toHaveLength(7);
			expect(dayHeaders.map((el) => el.textContent)).toEqual(DAYS);
		});

		it('renders Start and End as dropdown placeholders for each day', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />,
			);

			// Start/End appear as <option> placeholder text inside each dropdown
			const startOptions = screen.getAllByRole('option', { name: 'Start' });
			const endOptions = screen.getAllByRole('option', { name: 'End' });
			expect(startOptions).toHaveLength(7);
			expect(endOptions).toHaveLength(7);
		});

		it('displays provided start and end times', () => {
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} />,
			);

			const mondayColumn = screen.getByTestId('day-column-1');
			const selects = within(mondayColumn).getAllByRole('combobox');
			expect(selects[0]).toHaveValue('8:00 AM');
			expect(selects[1]).toHaveValue('6:00 PM');
		});

		it('renders empty dropdowns when no time is set', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />,
			);

			const sundayColumn = screen.getByTestId('day-column-0');
			const selects = within(sundayColumn).getAllByRole('combobox');
			expect(selects[0]).toHaveValue('');
			expect(selects[1]).toHaveValue('');
		});
	});

	describe('Sizing', () => {
		it('renders with default "md" size', () => {
			const { container } = renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />,
			);

			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper).toBeInTheDocument();
		});

		it('accepts "sm" size prop', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} size={WeeklyScheduleSize.Sm} />,
			);

			const dayHeaders = screen.getAllByTestId(/^day-label-/);
			expect(dayHeaders).toHaveLength(7);
		});

		it('accepts "lg" size prop', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} size={WeeklyScheduleSize.Lg} />,
			);

			const dayHeaders = screen.getAllByTestId(/^day-label-/);
			expect(dayHeaders).toHaveLength(7);
		});
	});

	describe('Interactions', () => {
		it('calls onChange when start time is changed', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			const schedule = buildSchedule();

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={onChange} />,
			);

			const mondayColumn = screen.getByTestId('day-column-1');
			const selects = within(mondayColumn).getAllByRole('combobox');
			await user.selectOptions(selects[0], '9:00 AM');

			expect(onChange).toHaveBeenCalledWith(1, 'startTime', '9:00 AM');
		});

		it('calls onChange when end time is changed', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '5:00 PM' },
			]);

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={onChange} />,
			);

			const mondayColumn = screen.getByTestId('day-column-1');
			const selects = within(mondayColumn).getAllByRole('combobox');
			await user.selectOptions(selects[1], '6:00 PM');

			expect(onChange).toHaveBeenCalledWith(1, 'endTime', '6:00 PM');
		});

		it('calls onDayToggle with true when an unselected day circle is clicked', async () => {
			const user = userEvent.setup();
			const onDayToggle = vi.fn();
			const schedule = buildSchedule();

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} onDayToggle={onDayToggle} />,
			);

			await user.click(screen.getByTestId('day-circle-2'));

			expect(onDayToggle).toHaveBeenCalledWith(2, true);
		});

		it('calls onDayToggle with false when a selected day circle is clicked', async () => {
			const user = userEvent.setup();
			const onDayToggle = vi.fn();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} onDayToggle={onDayToggle} />,
			);

			await user.click(screen.getByTestId('day-circle-1'));

			expect(onDayToggle).toHaveBeenCalledWith(1, false);
		});

		it('does not call onDayToggle when disabled', async () => {
			const user = userEvent.setup();
			const onDayToggle = vi.fn();
			const schedule = buildSchedule();

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} onDayToggle={onDayToggle} disabled />,
			);

			await user.click(screen.getByTestId('day-circle-0'));

			expect(onDayToggle).not.toHaveBeenCalled();
		});
	});

	describe('Selected state', () => {
		it('applies selected styling to days with times set', () => {
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} />,
			);

			const selectedCircle = screen.getByTestId('day-circle-1');
			const unselectedCircle = screen.getByTestId('day-circle-0');

			const selectedStyle = window.getComputedStyle(selectedCircle);
			const unselectedStyle = window.getComputedStyle(unselectedCircle);

			// Selected day should have a non-transparent background
			expect(selectedStyle.background).not.toBe(unselectedStyle.background);
		});
	});

	describe('Disabled state', () => {
		it('disables all dropdowns when disabled prop is true', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} disabled />,
			);

			const selects = screen.getAllByRole('combobox');
			selects.forEach((select) => {
				expect(select).toBeDisabled();
			});
		});
	});

	describe('Read-only state', () => {
		it('disables all dropdowns when readOnly prop is true', () => {
			renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} readOnly />,
			);

			const selects = screen.getAllByRole('combobox');
			selects.forEach((select) => {
				expect(select).toBeDisabled();
			});
		});
	});
});
