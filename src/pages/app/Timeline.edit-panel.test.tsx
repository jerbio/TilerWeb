import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, setupUser, waitFor, within } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarEvent, ThirdPartyType } from '@/core/common/types/schedule';
import { useCalendarUI } from '@/core/common/components/calendar/calendar-ui.provider';
import Timeline from './Timeline';

const mocks = vi.hoisted(() => ({
	lookup: vi.fn(),
	subEvents: vi.fn(),
	update: vi.fn(),
	profile: vi.fn(),
}));

vi.mock('@/services', () => ({
	scheduleService: {
		lookupCalendarEventById: mocks.lookup,
		getSubEventsOfCalendar: mocks.subEvents,
		updateCalendarEvent: mocks.update,
	},
	userService: { getScheduleProfile: mocks.profile },
}));
vi.mock('@/global_state', () => ({
	default: (selector: (state: unknown) => unknown) =>
		selector({ authenticatedUser: { id: 'user-1' } }),
}));
vi.mock('react-i18next', () => ({
	initReactI18next: { type: '3rdParty', init: vi.fn() },
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: 'en' },
	}),
}));
vi.mock('@react-spring/web', () => ({
	animated: new Proxy({}, { get: (_, tag) => tag }),
	useTransition:
		<T,>(items: T[]) =>
		(renderItem: (style: object, item: T) => React.ReactNode) =>
			items.map((item) => renderItem({}, item)),
}));
vi.mock('@/core/common/components/calendar/calendar_wrapper', () => ({
	CalendarWrapper: () => <div>Calendar grid</div>,
}));
vi.mock('@/core/common/components/chat/chat', () => ({ default: () => <div>Chat</div> }));

// Drive the shared editTile.open action used by More options and Tiler search.
// Keep the real provider, panel sync/stack, loader, form and subevents mounted.
vi.mock('@/components/timeline/timeline_header', () => ({
	default: function SelectionControls() {
		const open = useCalendarUI((s) => s.editTile.actions.open);
		return (
			<>
				<button onClick={() => open(firstEvent)}>Select first event</button>
				<button onClick={() => open({ id: secondEvent.id } as CalendarEvent)}>
					More options for second event
				</button>
				<button onClick={() => open({ ...secondEvent, name: 'Search summary' })}>
					Search result for second event
				</button>
			</>
		);
	},
}));

const firstEvent: CalendarEvent = {
	id: 'first_7_0_0',
	name: 'First event',
	start: 1769925600000,
	end: 1770532200000,
	eachTileDuration: 3600000,
	splitCount: 2,
	address: '123 Main St',
	addressDescription: 'First location',
	searchdDescription: null,
	completeCount: 0,
	deletionCount: 0,
	thirdpartyType: ThirdPartyType.Tiler,
	thirdPartyId: null,
	thirdPartyUserId: null,
	colorOpacity: 1,
	colorRed: 52,
	colorGreen: 152,
	colorBlue: 219,
	isComplete: false,
	isEnabled: true,
	isRecurring: false,
	locationId: null,
	isReadOnly: false,
	isProcrastinateEvent: false,
	isRigid: false,
	uiConfig: null,
	repetition: null,
	restrictionProfile: null,
	emojis: null,
	isWhatIf: false,
	entityName: 'CalendarEvent',
	blob: null,
	subEvents: null,
};
const secondEvent: CalendarEvent = {
	...firstEvent,
	id: 'second_7_0_0',
	name: 'Second event',
	start: firstEvent.start! + 86400000,
	end: firstEvent.end! + 86400000,
	eachTileDuration: 5400000,
	splitCount: 3,
	address: '456 Oak Ave',
	addressDescription: 'Second location',
};

const selectionButtons = ['More options for second event', 'Search result for second event'];

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('innerWidth', 1440);
	mocks.lookup.mockImplementation(async (id: string) => {
		if (id === firstEvent.id) return firstEvent;
		if (id === secondEvent.id) return secondEvent;
		throw new Error(`Unexpected calendar lookup: ${id}`);
	});
	mocks.subEvents.mockResolvedValue([]);
	mocks.profile.mockResolvedValue(null);
	mocks.update.mockResolvedValue({});
});
afterEach(() => vi.unstubAllGlobals());

async function openFirstEvent() {
	const user = setupUser();
	render(
		<ThemeProvider>
			<Timeline />
		</ThemeProvider>
	);
	await user.click(screen.getByRole('button', { name: 'Select first event' }));
	await screen.findByDisplayValue(firstEvent.name!);
	await waitFor(() =>
		expect(mocks.subEvents).toHaveBeenCalledWith(firstEvent.id, expect.any(Object))
	);
	return user;
}

async function editFirstEvent() {
	const user = await openFirstEvent();
	const input = screen.getByDisplayValue(firstEvent.name!);
	await user.clear(input);
	await user.type(input, 'Unsaved first event');
	return user;
}

async function discardWarning() {
	// Accept either accessible dialog role without coupling to modal styling.
	return waitFor(() => {
		const warning = screen.queryByRole('alertdialog') ?? screen.queryByRole('dialog');
		expect(warning).toBeInTheDocument();
		return within(warning!);
	});
}

describe('Timeline edit panel selection', () => {
	it.each(selectionButtons)('loads the new form and subevents via %s', async (button) => {
		const user = await openFirstEvent();
		await user.click(screen.getByRole('button', { name: button }));
		await waitFor(() =>
			expect(mocks.subEvents).toHaveBeenCalledWith(secondEvent.id, expect.any(Object))
		);
		expect(screen.getByDisplayValue(secondEvent.name!)).toBeInTheDocument();
		expect(screen.queryByDisplayValue(firstEvent.name!)).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'calendarEvent.edit.save' })
		).not.toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('hides the previous form while the next event is loading', async () => {
		const user = await openFirstEvent();
		let resolveLookup!: (event: CalendarEvent) => void;
		mocks.lookup.mockReturnValueOnce(
			new Promise<CalendarEvent>((resolve) => {
				resolveLookup = resolve;
			})
		);
		await user.click(screen.getByRole('button', { name: selectionButtons[0] }));
		// Settle the request even when the regression assertion fails.
		try {
			expect(screen.getByTestId('edit-event-loading')).toBeInTheDocument();
			expect(screen.queryByDisplayValue(firstEvent.name!)).not.toBeInTheDocument();
			expect(mocks.subEvents).not.toHaveBeenCalledWith(secondEvent.id, expect.any(Object));
		} finally {
			await act(async () => resolveLookup(secondEvent));
		}
		await screen.findByDisplayValue(secondEvent.name!);
	});

	it('saves the new event values without carrying fields over from the previous event', async () => {
		const user = await openFirstEvent();
		await user.click(screen.getByRole('button', { name: selectionButtons[1] }));
		await waitFor(() =>
			expect(mocks.subEvents).toHaveBeenCalledWith(secondEvent.id, expect.any(Object))
		);
		// Append to the displayed name: a stale form must not become a valid save for B.
		await user.type(screen.getByDisplayValue(/^(First|Second) event$/), ' updated');
		await user.click(screen.getByRole('button', { name: 'calendarEvent.edit.save' }));
		await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
		expect(mocks.update).toHaveBeenCalledWith(
			expect.objectContaining({
				EventID: secondEvent.id,
				EventName: `${secondEvent.name} updated`,
				Duration: secondEvent.eachTileDuration,
				Split: secondEvent.splitCount,
				CalAddress: secondEvent.address,
			})
		);
	});

	it.each(selectionButtons)(
		'keeps the current draft when a switch via %s is cancelled',
		async (button) => {
			const user = await editFirstEvent();
			await user.click(screen.getByRole('button', { name: button }));
			const warning = await discardWarning();
			expect(warning.getByRole('button', { name: /discard/i })).toBeInTheDocument();
			expect(mocks.lookup).not.toHaveBeenCalledWith(secondEvent.id);
			expect(mocks.subEvents).not.toHaveBeenCalledWith(secondEvent.id, expect.any(Object));
			await user.click(warning.getByRole('button', { name: /keep editing/i }));
			expect(screen.getByDisplayValue('Unsaved first event')).toBeInTheDocument();
			await user.click(screen.getByRole('button', { name: 'calendarEvent.edit.save' }));
			await waitFor(() =>
				expect(mocks.update).toHaveBeenCalledWith(
					expect.objectContaining({
						EventID: firstEvent.id,
						EventName: 'Unsaved first event',
					})
				)
			);
		}
	);

	it('loads the selected event with a clean form after discarding the current draft', async () => {
		const user = await editFirstEvent();
		await user.click(screen.getByRole('button', { name: selectionButtons[1] }));
		const warning = await discardWarning();
		expect(mocks.lookup).not.toHaveBeenCalledWith(secondEvent.id);
		await user.click(warning.getByRole('button', { name: /discard/i }));
		await screen.findByDisplayValue(secondEvent.name!);
		await waitFor(() =>
			expect(mocks.subEvents).toHaveBeenCalledWith(secondEvent.id, expect.any(Object))
		);
		expect(screen.queryByDisplayValue('Unsaved first event')).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'calendarEvent.edit.save' })
		).not.toBeInTheDocument();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it('preserves the draft without prompting or reloading when the same event is selected again', async () => {
		const user = await editFirstEvent();
		const lookupCount = mocks.lookup.mock.calls.length;
		const subEventsCount = mocks.subEvents.mock.calls.length;
		await user.click(screen.getByRole('button', { name: 'Select first event' }));
		expect(screen.getByDisplayValue('Unsaved first event')).toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(mocks.lookup).toHaveBeenCalledTimes(lookupCount);
		expect(mocks.subEvents).toHaveBeenCalledTimes(subEventsCount);
	});

	it('switches without a warning when all edits have been reverted', async () => {
		const user = await editFirstEvent();
		const input = screen.getByDisplayValue('Unsaved first event');
		await user.clear(input);
		await user.type(input, firstEvent.name!);
		await user.click(screen.getByRole('button', { name: selectionButtons[0] }));
		await screen.findByDisplayValue(secondEvent.name!);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('keeps the saving event active until its save completes', async () => {
		const user = await editFirstEvent();
		let resolveSave!: (value: object) => void;
		mocks.update.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSave = resolve;
			})
		);
		await user.click(screen.getByRole('button', { name: 'calendarEvent.edit.save' }));
		try {
			expect(screen.getByRole('button', { name: 'calendarEvent.edit.back' })).toBeDisabled();
			await user.click(screen.getByRole('button', { name: selectionButtons[1] }));
			expect(screen.getByDisplayValue('Unsaved first event')).toBeInTheDocument();
			expect(mocks.lookup).not.toHaveBeenCalledWith(secondEvent.id);
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		} finally {
			await act(async () => resolveSave({}));
		}
		expect(mocks.update).toHaveBeenCalledWith(
			expect.objectContaining({ EventID: firstEvent.id })
		);
		await waitFor(() =>
			expect(screen.queryByDisplayValue('Unsaved first event')).not.toBeInTheDocument()
		);
	});
});
