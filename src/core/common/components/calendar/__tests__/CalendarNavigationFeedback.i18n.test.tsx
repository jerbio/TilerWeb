import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarNavigationFeedback, { CalendarNavigationState } from '../CalendarNavigationFeedback';
import { CalendarRequestStatus } from '../calendarRequestContext';
import english from '@/i18n/locales/en.json';

type Locale = { calendarNavigation: typeof english.calendarNavigation };
const locales = import.meta.glob<{ default: Locale }>('../../../../../i18n/locales/*.json', {
	eager: true,
});
const date = Date.UTC(2026, 10, 28, 12);

describe('calendar navigation internationalization', () => {
	for (const [file, resource] of Object.entries(locales)) {
		const language = file.split('/').pop()!.replace('.json', '');
		it(`renders every stage and outcome in ${language} without English fallback`, async () => {
			const labels = resource.default.calendarNavigation;
			expect(Object.keys(labels).sort()).toEqual(
				Object.keys(english.calendarNavigation).sort()
			);
			const i18n = createInstance();
			await i18n.init({
				lng: language,
				fallbackLng: false,
				resources: { [language]: { translation: resource.default } },
				interpolation: { escapeValue: false },
			});
			for (const key of Object.keys(english.calendarNavigation)) {
				expect(i18n.exists(`calendarNavigation.${key}`), key).toBe(true);
				const translated = i18n.t(`calendarNavigation.${key}`, { date: 'DATE' });
				expect(translated).not.toContain('{{');
				if (language !== 'en')
					expect(translated).not.toBe(
						i18n.t(`calendarNavigation.${key}`, {
							lng: 'en',
							defaultValue: english.calendarNavigation[key as keyof typeof labels],
							date: 'DATE',
						})
					);
			}
			const formattedDate = new Intl.DateTimeFormat(language, {
				month: 'short',
				day: 'numeric',
			}).format(date);
			const scenarios: [CalendarNavigationState, string][] = [
				[{ phase: 'locating' }, labels.locating],
				[{ phase: 'loading_calendar' }, labels.loading],
				[
					{ phase: 'loading_calendar', date },
					labels.loadingDate.replace('{{date}}', formattedDate),
				],
				[{ phase: 'opening' }, labels.opening],
				[{ phase: 'locating', outcome: CalendarRequestStatus.Deleted }, labels.deleted],
				[{ phase: 'locating', outcome: CalendarRequestStatus.Completed }, labels.completed],
				[{ phase: 'locating', outcome: CalendarRequestStatus.DemoMode }, labels.demo],
				[{ phase: 'locating', outcome: CalendarRequestStatus.Stale }, labels.stale],
				[{ phase: 'locating', outcome: CalendarRequestStatus.NotFound }, labels.notFound],
				[{ phase: 'locating', outcome: CalendarRequestStatus.Error }, labels.error],
			];
			const tree = (state: CalendarNavigationState) => (
				<I18nextProvider i18n={i18n}>
					<CalendarNavigationFeedback
						state={state}
						onRetry={vi.fn()}
						onDismiss={vi.fn()}
					/>
				</I18nextProvider>
			);
			const view = render(tree(scenarios[0][0]));
			for (const [state, message] of scenarios) {
				view.rerender(tree(state));
				const notice = screen.getByTestId('calendar-navigation-feedback');
				expect(notice).toHaveTextContent(message);
				expect(notice).toHaveAttribute('lang', language);
				expect(notice).toHaveAttribute('dir', 'ltr');
				if (state.outcome) {
					expect(screen.getByRole('button', { name: labels.retry })).toBeInTheDocument();
					expect(
						screen.getByRole('button', { name: labels.dismiss })
					).toBeInTheDocument();
				}
			}
		});
	}

	it('updates the message and date when the selected language changes during navigation', async () => {
		const i18n = createInstance();
		const fr = locales['../../../../../i18n/locales/fr.json'].default;
		const ja = locales['../../../../../i18n/locales/ja.json'].default;
		await i18n.init({
			lng: 'fr-CA',
			fallbackLng: false,
			resources: { fr: { translation: fr }, ja: { translation: ja } },
			interpolation: { escapeValue: false },
		});
		render(
			<I18nextProvider i18n={i18n}>
				<CalendarNavigationFeedback state={{ phase: 'loading_calendar', date }} />
			</I18nextProvider>
		);
		expect(screen.getByRole('status')).toHaveTextContent(
			fr.calendarNavigation.loadingDate.replace(
				'{{date}}',
				new Intl.DateTimeFormat('fr-CA', { month: 'short', day: 'numeric' }).format(date)
			)
		);
		await act(async () => {
			await i18n.changeLanguage('ja');
		});
		expect(screen.getByRole('status')).toHaveTextContent(
			ja.calendarNavigation.loadingDate.replace(
				'{{date}}',
				new Intl.DateTimeFormat('ja', { month: 'short', day: 'numeric' }).format(date)
			)
		);
		expect(screen.getByRole('status')).toHaveAttribute('lang', 'ja');
	});
});
