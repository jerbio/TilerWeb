import { createInstance, type i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import DatePicker from '@/core/common/components/date_picker';
import AvatarCluster from '@/core/common/components/AvatarCluster';
import TiletteDraftFields from '../TiletteDraftFields';
import { TileshareMode } from '@/core/common/types/tileshare';

const resources = import.meta.glob<{ default: Record<string, unknown> }>(
	'../../../i18n/locales/*.json',
	{ eager: true }
);
async function language(locale: string) {
	const instance = createInstance();
	await instance.init({
		lng: locale,
		fallbackLng: false,
		resources: Object.fromEntries(
			Object.entries(resources).map(([file, value]) => [
				file.split('/').pop()!.replace('.json', ''),
				{ translation: value.default },
			])
		),
	});
	return instance;
}
function localized(children: ReactNode, instance: i18n) {
	return (
		<I18nextProvider i18n={instance}>
			<ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
		</I18nextProvider>
	);
}

describe('TileShare localized controls', () => {
	it.each([
		['en', '11/17/2026'],
		['de', '17.11.2026'],
		['el', '17/11/2026'],
		['es', '17/11/2026'],
		['fr', '17/11/2026'],
		['hi', '17/11/2026'],
		['it', '17/11/2026'],
		['ja', '2026/11/17'],
		['ko', '2026. 11. 17.'],
		['pl', '17.11.2026'],
		['ru', '17.11.2026'],
		['zh', '2026/11/17'],
	])(
		'uses %s for dates, navigation, day labels, and selection feedback',
		async (locale, display) => {
			const instance = await language(locale);
			const change = vi.fn();
			render(
				localized(
					<DatePicker label="Deadline" value="2026-11-17" onChange={change} />,
					instance
				)
			);
			const input = screen.getByLabelText('Deadline');
			expect(input).toHaveValue(display);
			fireEvent.click(input);
			const calendar = screen.getByRole('dialog', {
				name: instance.t('datePicker.calendar'),
			});
			expect(
				within(calendar).getByRole('button', {
					name: instance.t('datePicker.previousMonth'),
				})
			).toBeInTheDocument();
			expect(
				within(calendar).getByRole('button', { name: instance.t('datePicker.nextMonth') })
			).toBeInTheDocument();
			const nextDay = calendar.querySelector(
				'.react-datepicker__day--018:not(.react-datepicker__day--outside-month)'
			)!;
			expect(nextDay.getAttribute('aria-label')).toContain(
				instance.t('datePicker.chooseDay')
			);
			fireEvent.click(nextDay);
			expect(change).toHaveBeenCalledWith('2026-11-18');
			expect(screen.getByRole('status')).toHaveTextContent(
				instance.t('datePicker.selectedDate', {
					date: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
						new Date(2026, 10, 18)
					),
				})
			);
			await act(() => instance.changeLanguage('ja'));
			expect(screen.getByRole('status')).toHaveTextContent(
				'選択した日付：2026年11月18日水曜日'
			);
		}
	);
	it('keeps inclusive date-only limits in the same local calendar day', async () => {
		const instance = await language('fr');
		render(
			localized(
				<DatePicker
					label="Deadline"
					value="2026-11-17"
					minDate="2026-11-17"
					maxDate="2026-11-17"
					onChange={vi.fn()}
				/>,
				instance
			)
		);
		fireEvent.click(screen.getByLabelText('Deadline'));
		const calendar = screen.getByRole('dialog', { name: instance.t('datePicker.calendar') });
		const selected = calendar.querySelector(
			'.react-datepicker__day--017:not(.react-datepicker__day--outside-month)'
		)!;
		expect(selected).toHaveAttribute('aria-disabled', 'false');
		const disabled = calendar.querySelector(
			'.react-datepicker__day--018:not(.react-datepicker__day--outside-month)'
		)!;
		expect(disabled).toHaveAttribute('aria-disabled', 'true');
		expect(disabled.getAttribute('aria-label')).toContain(
			instance.t('datePicker.unavailableDay')
		);
	});
	it('accepts a typed regional date and still writes the ISO calendar date', async () => {
		const instance = await language('en-GB');
		const change = vi.fn();
		render(
			localized(
				<DatePicker label="Deadline" value="2026-11-17" onChange={change} />,
				instance
			)
		);
		const input = screen.getByLabelText('Deadline');
		expect(input).toHaveValue('17/11/2026');
		fireEvent.change(input, { target: { value: '19/11/2026' } });
		expect(change).toHaveBeenCalledWith('2026-11-19');
	});
	it('formats deadline warnings in the selected language without changing saved dates', async () => {
		const instance = await language('fr');
		const change = vi.fn();
		const draft = {
			id: 'draft',
			name: 'Design',
			durationMinutes: '60',
			deadline: '2026-11-18',
			note: '',
			recipients: [],
			location: { address: '', description: '', isVerified: false },
		};
		const { rerender } = render(
			localized(
				<TiletteDraftFields
					value={draft}
					mode={TileshareMode.Class}
					shareDeadline="2026-11-17"
					onChange={change}
				/>,
				instance
			)
		);
		expect(
			screen.getByText(
				instance.t('tileShareEdit.afterShare', { deadline: '17 novembre 2026' })
			)
		).toHaveTextContent('17 novembre 2026');
		fireEvent.click(
			screen.getByRole('checkbox', {
				name: instance.t('tileShareComposer.moveShareDeadline', {
					deadline: '18 novembre 2026',
				}),
			})
		);
		expect(change).toHaveBeenCalledWith({ ...draft, moveShareDeadline: true });
		rerender(
			localized(
				<TiletteDraftFields
					value={{ ...draft, deadline: '' }}
					mode={TileshareMode.Class}
					shareDeadline="2026-11-17"
					onChange={change}
				/>,
				instance
			)
		);
		expect(
			screen.getByText(
				(_text, element) =>
					element?.tagName === 'SMALL' &&
					element.textContent ===
						instance.t('tileShareModes.deadlineDefault', {
							deadline: '17 novembre 2026',
						})
			)
		).toBeInTheDocument();
	});
	it('formats avatar overflow with the app language', async () => {
		const instance = await language('de');
		render(
			localized(
				<AvatarCluster users={Array.from({ length: 1237 }, () => ({ name: 'Ada' }))} />,
				instance
			)
		);
		expect(screen.getByText('+1.234')).toBeInTheDocument();
	});
});
