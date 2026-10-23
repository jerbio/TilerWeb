import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { http, HttpResponse } from 'msw';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { toast } from 'sonner';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import AppToaster from '@/core/ui/AppToaster';
import { LocationPicker } from '@/components/location/LocationSelector';
import en from '@/i18n/locales/en.json';
import { server } from '@/test/mocks/server';
import locationService from '@/services/locationService';
import { AppApi } from '../appApi';
import { ChatApi } from '../chatApi';
import { ScheduleApi } from '../scheduleApi';
import { CalendarEventApi } from '../calendarEventApi';
import { SubCalendarEventApi } from '../subCalendarEventApi';
import { LocationApi } from '../locationApi';

vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://test.example.com/' } }));

let sent: Request[];
let warning: MockInstance<typeof toast.warning>;
const withoutLocation = { location: '', latitude: 40, longitude: -73, verified: false };

beforeAll(async () => {
	await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: en } } });
	// JSDOM does not implement pointer capture, used by Sonner's swipe handling.
	Object.defineProperty(Element.prototype, 'setPointerCapture', {
		configurable: true,
		value: () => {},
	});
});
afterAll(() => Reflect.deleteProperty(Element.prototype, 'setPointerCapture'));
beforeEach(() => {
	sent = [];
	locationService.initialize();
	locationService.cancelDetection();
	locationService.store.setState(locationService.store.getInitialState(), true);
	warning = vi.spyOn(toast, 'warning');
	vi.spyOn(locationService, 'getCurrentLocation').mockResolvedValue(withoutLocation);
	server.use(
		http.all('https://test.example.com/*', ({ request }) => {
			sent.push(request);
			return HttpResponse.json({
				Error: { Code: '0', Message: 'SUCCESS' },
				Content: [],
				ServerStatus: null,
			});
		})
	);
});
afterEach(() => {
	act(() => {
		locationService.closePicker();
		toast.dismiss();
	});
	vi.restoreAllMocks();
});

function renderLocationFlow() {
	return render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<AppToaster />
				<LocationPicker />
			</ThemeProvider>
		</I18nextProvider>
	);
}

async function sendWithoutLocation() {
	await act(async () => {
		await new ScheduleApi().shuffle({});
	});
}

describe('location notices at the shared request boundary', () => {
	it.each([
		[
			'chat message',
			() => new ChatApi().sendMessage({ EntityId: '', ChatMessage: 'Find lunch' }),
		],
		[
			'chat acceptance',
			() => new ChatApi().executeActions('request-1', undefined, '-73', '40', 'false'),
		],
		['schedule shuffle', () => new ScheduleApi().shuffle({})],
		['tile prediction', () => new ScheduleApi().getNewTilePrediction('Lunch')],
		[
			'calendar event update',
			() => new CalendarEventApi().updateCalendarEvent({ EventID: 'event-1' }),
		],
		[
			'occurrence update',
			() =>
				new SubCalendarEventApi().updateSubCalendarEvent({
					Id: 'event-1',
					TimeZone: 'UTC',
				}),
		],
		[
			'address search using the current location as an anchor',
			() => new LocationApi().searchAnonymousByName('Coffee', withoutLocation),
		],
	] as const)(
		'warns and still dispatches %s when location is unverified',
		async (_label, send) => {
			await send();
			expect(sent).toHaveLength(1);
			expect(warning).toHaveBeenCalledOnce();
			const fields =
				sent[0].method === 'GET'
					? Object.fromEntries(new URL(sent[0].url).searchParams)
					: await sent[0].json();
			for (const key of ['UserLatitude', 'UserLongitude', 'userLatitude', 'userLongitude']) {
				expect(fields[key] ?? '').toBe('');
			}
			expect(fields.Latitude).toBeUndefined();
			expect(fields.Longitude).toBeUndefined();
		}
	);

	it('checks explicit payload overrides instead of warning about an unused cached location', async () => {
		await new CalendarEventApi().updateCalendarEvent({
			EventID: 'event-1',
			UserLatitude: '40',
			UserLongitude: '-73',
			UserLocationVerified: 'true',
		});
		expect(warning).not.toHaveBeenCalled();
		expect(await sent[0].json()).toMatchObject({
			UserLatitude: '40',
			UserLongitude: '-73',
			UserLocationVerified: 'true',
		});
	});

	it('warns about an explicit unverified override even when the cached location is verified', async () => {
		vi.mocked(locationService.getCurrentLocation).mockResolvedValue({
			...withoutLocation,
			verified: true,
		});
		await new CalendarEventApi().updateCalendarEvent({
			EventID: 'event-1',
			UserLocationVerified: 'false',
		});
		expect(warning).toHaveBeenCalledOnce();
		expect(await sent[0].json()).toMatchObject({
			UserLatitude: '',
			UserLongitude: '',
			UserLocationVerified: 'false',
		});
	});

	it('does not warn for verified requests, unrelated API reads, or reading the location cache', async () => {
		vi.mocked(locationService.getCurrentLocation).mockResolvedValue({
			...withoutLocation,
			verified: true,
		});
		await new ScheduleApi().shuffle({});
		await new AppApi().apiRequest('api/User');
		await locationService.getCurrentLocation();
		expect(warning).not.toHaveBeenCalled();
	});

	it('also checks requests dispatched through the multipart transport', async () => {
		const form = new FormData();
		form.append('UserLatitude', '40');
		form.append('UserLongitude', '-73');
		form.append('UserLocationVerified', 'false');
		await new AppApi().apiRequestFormData('api/Test', { body: form, usesUserLocation: true });
		expect(warning).toHaveBeenCalledOnce();
		const body = await sent[0].formData();
		expect(body.get('UserLatitude')).toBe('');
		expect(body.get('UserLongitude')).toBe('');
	});

	it('renders the warning in the global toaster without adding a persistent layout row', async () => {
		render(
			<ThemeProvider defaultTheme="dark">
				<AppToaster />
			</ThemeProvider>
		);
		await act(async () => {
			await new ScheduleApi().shuffle({});
		});
		expect(await screen.findByText('Location ignored for this request')).toBeVisible();
		expect(
			screen.getByText('Travel times and nearby suggestions may be less accurate.')
		).toBeVisible();
	});

	it('opens the global picker from the toast without needing a visible location field', async () => {
		const user = userEvent.setup();
		const detect = vi.spyOn(locationService, 'detectCurrentLocation').mockResolvedValue();
		renderLocationFlow();
		await sendWithoutLocation();
		await user.click(await screen.findByRole('button', { name: 'Set location' }));
		expect(screen.getByRole('dialog', { name: 'Location' })).toBeVisible();
		expect(screen.getByRole('searchbox', { name: 'Choose an address' })).toHaveFocus();
		expect(locationService.store.getState().requestNeedsLocation).toBe(false);
		expect(detect).not.toHaveBeenCalled();
		// The original request has already been sent; resolving location never replays it.
		expect(sent).toHaveLength(1);
		await user.click(screen.getByRole('button', { name: 'Use current location' }));
		expect(detect).toHaveBeenCalledOnce();
	});

	it.each(['{Enter}', ' '])('opens the picker with keyboard activation (%s)', async (key) => {
		const user = userEvent.setup();
		renderLocationFlow();
		await sendWithoutLocation();
		const action = await screen.findByRole('button', { name: 'Set location' });
		action.focus();
		await user.keyboard(key);
		expect(screen.getByRole('dialog', { name: 'Location' })).toBeVisible();
	});

	it('allows dismissing the warning without opening the picker', async () => {
		const user = userEvent.setup();
		renderLocationFlow();
		await sendWithoutLocation();
		await user.click(await screen.findByRole('button', { name: 'Close toast' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(locationService.store.getState().pickerOpen).toBe(false);
	});
});
