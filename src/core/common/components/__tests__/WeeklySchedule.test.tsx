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
		</I18nextProvider>
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
			renderWithTheme(<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />);

			const dayHeaders = screen.getAllByTestId(/^day-label-/);
			expect(dayHeaders).toHaveLength(7);
			expect(dayHeaders.map((el) => el.textContent)).toEqual(DAYS);
		});

		it('renders Start and End as dropdown placeholders for each day', () => {
			renderWithTheme(<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />);

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

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} />);

			const mondayColumn = screen.getByTestId('day-column-1');
			const selects = within(mondayColumn).getAllByRole('combobox');
			expect(selects[0]).toHaveValue('8:00 AM');
			expect(selects[1]).toHaveValue('6:00 PM');
		});

		it('renders empty dropdowns when no time is set', () => {
			renderWithTheme(<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />);

			const sundayColumn = screen.getByTestId('day-column-0');
			const selects = within(sundayColumn).getAllByRole('combobox');
			expect(selects[0]).toHaveValue('');
			expect(selects[1]).toHaveValue('');
		});
	});

	describe('Sizing', () => {
		it('renders with default "md" size', () => {
			const { container } = renderWithTheme(
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} />
			);

			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper).toBeInTheDocument();
		});

		it('accepts "sm" size prop', () => {
			renderWithTheme(
				<WeeklySchedule
					schedule={buildSchedule()}
					onChange={vi.fn()}
					size={WeeklyScheduleSize.Sm}
				/>
			);

			const dayHeaders = screen.getAllByTestId(/^day-label-/);
			expect(dayHeaders).toHaveLength(7);
		});

		it('accepts "lg" size prop', () => {
			renderWithTheme(
				<WeeklySchedule
					schedule={buildSchedule()}
					onChange={vi.fn()}
					size={WeeklyScheduleSize.Lg}
				/>
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

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={onChange} />);

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

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={onChange} />);

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
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} onDayToggle={onDayToggle} />
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
				<WeeklySchedule schedule={schedule} onChange={vi.fn()} onDayToggle={onDayToggle} />
			);

			await user.click(screen.getByTestId('day-circle-1'));

			expect(onDayToggle).toHaveBeenCalledWith(1, false);
		});

		it('does not call onDayToggle when disabled', async () => {
			const user = userEvent.setup();
			const onDayToggle = vi.fn();
			const schedule = buildSchedule();

			renderWithTheme(
				<WeeklySchedule
					schedule={schedule}
					onChange={vi.fn()}
					onDayToggle={onDayToggle}
					disabled
				/>
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

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} />);

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
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} disabled />
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
				<WeeklySchedule schedule={buildSchedule()} onChange={vi.fn()} readOnly />
			);

			const selects = screen.getAllByRole('combobox');
			selects.forEach((select) => {
				expect(select).toBeDisabled();
			});
		});
	});

	describe('Copy / Paste', () => {
		it('shows a copy button only on days that have both start and end times', () => {
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} />);

			expect(screen.getByTestId('copy-btn-1')).toBeInTheDocument();
			expect(screen.queryByTestId('copy-btn-0')).not.toBeInTheDocument();
		});

		it('does not show copy buttons when disabled', () => {
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} disabled />);

			expect(screen.queryByTestId('copy-btn-1')).not.toBeInTheDocument();
		});

		it('enters copy mode when copy is clicked and shows paste buttons on other days', async () => {
			const user = userEvent.setup();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
				{ dayIndex: 2, startTime: '9:00 AM', endTime: '5:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} />);

			await user.click(screen.getByTestId('copy-btn-1'));

			// Source day shows active/check icon
			expect(screen.getByTestId('copy-active-1')).toBeInTheDocument();
			// Other days show paste buttons
			expect(screen.getByTestId('paste-btn-0')).toBeInTheDocument();
			expect(screen.getByTestId('paste-btn-2')).toBeInTheDocument();
			// No copy buttons visible during copy mode
			expect(screen.queryByTestId('copy-btn-1')).not.toBeInTheDocument();
			expect(screen.queryByTestId('copy-btn-2')).not.toBeInTheDocument();
		});

		it('calls onChange with copied times when paste is clicked', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={onChange} />);

			// Copy Monday's times
			await user.click(screen.getByTestId('copy-btn-1'));
			// Paste to Sunday
			await user.click(screen.getByTestId('paste-btn-0'));

			expect(onChange).toHaveBeenCalledWith(0, 'startTime', '8:00 AM');
			expect(onChange).toHaveBeenCalledWith(0, 'endTime', '6:00 PM');
		});

		it('stays in copy mode after pasting so multiple days can be pasted to', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={onChange} />);

			// Copy Monday's times
			await user.click(screen.getByTestId('copy-btn-1'));
			// Paste to Sunday
			await user.click(screen.getByTestId('paste-btn-0'));
			// Still in copy mode — paste buttons still visible on other days
			expect(screen.getByTestId('copy-active-1')).toBeInTheDocument();
			expect(screen.getByTestId('paste-btn-2')).toBeInTheDocument();
			expect(screen.getByTestId('paste-btn-3')).toBeInTheDocument();

			// Paste to Wednesday too
			await user.click(screen.getByTestId('paste-btn-3'));
			expect(onChange).toHaveBeenCalledWith(3, 'startTime', '8:00 AM');
			expect(onChange).toHaveBeenCalledWith(3, 'endTime', '6:00 PM');

			// Still in copy mode
			expect(screen.getByTestId('copy-active-1')).toBeInTheDocument();
		});

		it('exits copy mode when the active copy indicator is clicked', async () => {
			const user = userEvent.setup();
			const schedule = buildSchedule([
				undefined,
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
			]);

			renderWithTheme(<WeeklySchedule schedule={schedule} onChange={vi.fn()} />);

			await user.click(screen.getByTestId('copy-btn-1'));
			expect(screen.getByTestId('copy-active-1')).toBeInTheDocument();

			// Click the active indicator to cancel
			await user.click(screen.getByTestId('copy-active-1'));

			// Back to normal — copy button reappears
			expect(screen.getByTestId('copy-btn-1')).toBeInTheDocument();
			expect(screen.queryByTestId('paste-btn-0')).not.toBeInTheDocument();
		});
	});
});
