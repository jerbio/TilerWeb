import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import RestrictionProfileEditor, {
	RestrictionType,
} from '@/core/common/components/restriction/RestrictionProfileEditor';
import type { DaySchedule } from '@/core/common/types/schedule';

const buildSchedule = (overrides?: (Partial<DaySchedule> | undefined)[]): DaySchedule[] =>
	Array.from({ length: 7 }, (_, i) => ({
		dayIndex: i,
		startTime: '',
		endTime: '',
		...(overrides?.[i] ?? {}),
	}));

const renderEditor = (props?: {
	schedule?: DaySchedule[];
	onCustomScheduleChange?: (value: DaySchedule[]) => void;
}) => {
	const onCustomScheduleChange = props?.onCustomScheduleChange ?? vi.fn();
	const utils = render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<MemoryRouter>
					<RestrictionProfileEditor
						isRestricted
						onIsRestrictedChange={vi.fn()}
						restrictionType={RestrictionType.Custom}
						onRestrictionTypeChange={vi.fn()}
						customSchedule={props?.schedule ?? buildSchedule()}
						onCustomScheduleChange={onCustomScheduleChange}
					/>
				</MemoryRouter>
			</ThemeProvider>
		</I18nextProvider>
	);
	return { ...utils, onCustomScheduleChange };
};

describe('RestrictionProfileEditor — copy/paste times', () => {
	it('does not render a copy button on days with no times set', () => {
		renderEditor();
		expect(screen.queryByTestId('restriction-copy-btn-0')).not.toBeInTheDocument();
	});

	it('renders a copy button on days that have both start and end times', () => {
		const schedule = buildSchedule([{ dayIndex: 0, startTime: '9:00 AM', endTime: '5:00 PM' }]);
		renderEditor({ schedule });
		expect(screen.getByTestId('restriction-copy-btn-0')).toBeInTheDocument();
	});

	it('shows a cancel-copy indicator on the source day and paste buttons on the others after copying', async () => {
		const user = userEvent.setup();
		const schedule = buildSchedule([{ dayIndex: 0, startTime: '9:00 AM', endTime: '5:00 PM' }]);
		renderEditor({ schedule });

		await user.click(screen.getByTestId('restriction-copy-btn-0'));

		expect(screen.getByTestId('restriction-copy-active-0')).toBeInTheDocument();
		// Paste buttons appear on every other day.
		for (let i = 1; i < 7; i += 1) {
			expect(screen.getByTestId(`restriction-paste-btn-${i}`)).toBeInTheDocument();
		}
	});

	it('clicking the cancel-copy indicator returns the source day to a copy button', async () => {
		const user = userEvent.setup();
		const schedule = buildSchedule([{ dayIndex: 0, startTime: '9:00 AM', endTime: '5:00 PM' }]);
		renderEditor({ schedule });

		await user.click(screen.getByTestId('restriction-copy-btn-0'));
		await user.click(screen.getByTestId('restriction-copy-active-0'));

		expect(screen.queryByTestId('restriction-copy-active-0')).not.toBeInTheDocument();
		expect(screen.getByTestId('restriction-copy-btn-0')).toBeInTheDocument();
		expect(screen.queryByTestId('restriction-paste-btn-1')).not.toBeInTheDocument();
	});

	it('clicking paste calls onCustomScheduleChange with the copied times applied to the target day', async () => {
		const user = userEvent.setup();
		const schedule = buildSchedule([{ dayIndex: 0, startTime: '9:00 AM', endTime: '5:00 PM' }]);
		const onCustomScheduleChange = vi.fn();
		renderEditor({ schedule, onCustomScheduleChange });

		await user.click(screen.getByTestId('restriction-copy-btn-0'));
		await user.click(screen.getByTestId('restriction-paste-btn-3'));

		expect(onCustomScheduleChange).toHaveBeenCalledTimes(1);
		const updated: DaySchedule[] = onCustomScheduleChange.mock.calls[0][0];
		expect(updated[3]).toEqual({
			dayIndex: 3,
			startTime: '9:00 AM',
			endTime: '5:00 PM',
		});
		// Other days are left alone.
		expect(updated[0]).toEqual({
			dayIndex: 0,
			startTime: '9:00 AM',
			endTime: '5:00 PM',
		});
		expect(updated[1]).toEqual({ dayIndex: 1, startTime: '', endTime: '' });
	});

	it('supports pasting the same copied times to multiple days', async () => {
		const user = userEvent.setup();
		const schedule = buildSchedule([{ dayIndex: 0, startTime: '9:00 AM', endTime: '5:00 PM' }]);
		const onCustomScheduleChange = vi.fn();
		renderEditor({ schedule, onCustomScheduleChange });

		await user.click(screen.getByTestId('restriction-copy-btn-0'));
		await user.click(screen.getByTestId('restriction-paste-btn-2'));
		await user.click(screen.getByTestId('restriction-paste-btn-4'));

		expect(onCustomScheduleChange).toHaveBeenCalledTimes(2);
		const firstUpdate: DaySchedule[] = onCustomScheduleChange.mock.calls[0][0];
		const secondUpdate: DaySchedule[] = onCustomScheduleChange.mock.calls[1][0];
		expect(firstUpdate[2]).toMatchObject({ startTime: '9:00 AM', endTime: '5:00 PM' });
		expect(secondUpdate[4]).toMatchObject({ startTime: '9:00 AM', endTime: '5:00 PM' });
	});
});
