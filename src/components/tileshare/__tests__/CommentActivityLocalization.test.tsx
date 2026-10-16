import { act, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { describe, it, expect, vi } from 'vitest';
import { darkTheme } from '@/core/theme/dark';
import TileShareActivityTimeline from '../TileShareActivityTimeline';

const locales = import.meta.glob<{
	default: {
		tileshareActivity: { events: Record<string, string>; sentences: Record<string, string> };
	};
}>('../../../i18n/locales/*.json', { eager: true });
const mocks = vi.hoisted(() => ({ getActivity: vi.fn() }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getActivity = mocks.getActivity;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));

const types = ['comment_added', 'comment_replied', 'comment_edited', 'comment_deleted'];
const resources = Object.fromEntries(
	Object.entries(locales).map(([path, resource]) => [
		path.split('/').pop()!.replace('.json', ''),
		{ translation: resource.default },
	])
);

async function show(language: string, attributed = true) {
	const i18n = createInstance();
	await i18n.use(initReactI18next).init({
		lng: language,
		fallbackLng: false,
		resources,
		interpolation: { escapeValue: false },
	});
	mocks.getActivity.mockResolvedValue({
		items: types.map((eventType) => ({
			eventId: eventType,
			eventType,
			schemaVersion: 1,
			clusterId: 'cluster',
			tiletteId: 'tilette',
			actorId: attributed ? 'actor' : undefined,
			actorName: attributed ? 'Murphy' : undefined,
			tiletteTitle: 'Design <img src=x>',
			occurredAt: Date.now(),
			targetAvailable: true,
		})),
		nextCursor: null,
	});
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider theme={darkTheme}>
				<MemoryRouter>
					<TileShareActivityTimeline ClusterId="cluster" />
				</MemoryRouter>
			</ThemeProvider>
		</I18nextProvider>
	);
	await screen.findAllByRole('link');
	return i18n;
}

describe('comment activity localization', () => {
	it.each(Object.keys(resources))(
		'renders complete %s sentences and accessible event labels',
		async (language) => {
			await show(language);
			const translations = resources[language].translation.tileshareActivity;
			const links = screen.getAllByRole('link');
			types.forEach((type, index) => {
				const expected = translations.sentences[type]
					.replace('<actor/>', 'Murphy')
					.replace('<title/>', '\u2018Design <img src=x>\u2019');
				expect(links[index]).toHaveTextContent(expected);
				expect(links[index].getAttribute('aria-label')).toContain(
					translations.events[type]
				);
				expect(links[index].querySelector('img')).toBeNull();
			});
		}
	);
	it('changes existing activity sentences when the selected language changes', async () => {
		const i18n = await show('en');
		expect(screen.getAllByRole('link')[0]).toHaveTextContent('Murphy commented on');
		await act(() => i18n.changeLanguage('fr'));
		expect(screen.getAllByRole('link')[0]).toHaveTextContent('Murphy a comment');
	});
	it('localizes redacted events without restoring actor attribution', async () => {
		await show('de', false);
		expect(screen.getAllByRole('link')[0]).toHaveTextContent(
			resources.de.translation.tileshareActivity.events.comment_added
		);
		expect(screen.queryByText('Murphy')).not.toBeInTheDocument();
	});
});
