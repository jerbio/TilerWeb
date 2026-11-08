import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import {
	useCalendarDispatch,
	useCalendarRequestListener,
} from '@/core/common/components/calendar/CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';
import Timeline from './Timeline';

const mocks = vi.hoisted(() => ({ mounted: vi.fn(), unmounted: vi.fn(), request: vi.fn() }));

vi.mock('@/global_state', () => ({
	default: (selector: (state: unknown) => unknown) =>
		selector({ authenticatedUser: { id: 'user-1' } }),
}));
vi.mock('@/components/timeline/timeline_header', () => ({ default: () => null }));
vi.mock('@/core/common/components/side-panel/edit-calendar-event/EditCalendarEventLoader', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/side-panel/edit-notes/EditNotes', () => ({
	default: () => null,
}));
vi.mock('react-i18next', () => ({
	initReactI18next: { type: '3rdParty', init: vi.fn() },
	useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
vi.mock('@react-spring/web', () => ({
	animated: new Proxy({}, { get: (_, tag) => tag }),
	useTransition:
		<T,>(items: T[]) =>
		(renderItem: (style: object, item: T) => React.ReactNode) =>
			items.map((item) => renderItem({}, item)),
}));
vi.mock('@/core/common/components/calendar/calendar_wrapper', () => ({
	CalendarWrapper: () => {
		useCalendarRequestListener(({ request }) => mocks.request(request));
		return <div>Calendar grid</div>;
	},
}));
vi.mock('@/core/common/components/chat/chat', () => ({
	default: function MockChat({ onNavigateToCalendar }: { onNavigateToCalendar: () => void }) {
		const [draft, setDraft] = useState('');
		const dispatch = useCalendarDispatch();
		useEffect(() => {
			mocks.mounted();
			return () => {
				mocks.unmounted();
			};
		}, []);
		return (
			<div>
				<div data-testid="messages" style={{ overflowY: 'auto', height: 100 }}>
					Conversation
				</div>
				<textarea
					aria-label="Chat draft"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
				/>
				<button
					onClick={() => {
						onNavigateToCalendar();
						dispatch({
							type: CalendarRequestType.FocusEvent,
							entityId: 'soccer',
							entityType: CalendarEntityType.CalendarEvent,
							actionType: 'update_existing_task',
						});
					}}
				>
					Go to soccer
				</button>
			</div>
		);
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('innerWidth', 800);
});
afterEach(() => vi.unstubAllGlobals());

describe('Timeline chat and calendar navigation', () => {
	it('reveals the grid and returns to the same conversation, draft, and scroll position', async () => {
		render(
			<ThemeProvider>
				<Timeline />
			</ThemeProvider>
		);
		fireEvent.click(screen.getByPlaceholderText('calendar.mobileChatInput.placeholder'));
		const draft = await screen.findByRole('textbox', { name: 'Chat draft' });
		fireEvent.change(draft, { target: { value: 'Keep this draft' } });
		const messages = screen.getByTestId('messages');
		messages.scrollTop = 240;
		fireEvent.click(screen.getByRole('button', { name: 'Go to soccer' }));
		expect(draft).not.toBeVisible();
		expect(mocks.request).toHaveBeenCalledWith(
			expect.objectContaining({ type: CalendarRequestType.FocusEvent, entityId: 'soccer' })
		);
		fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
		await waitFor(() => expect(draft).toBeVisible());
		expect(draft).toHaveValue('Keep this draft');
		expect(screen.getByTestId('messages')).toBe(messages);
		expect(messages.scrollTop).toBe(240);
		expect(mocks.mounted).toHaveBeenCalledOnce();
		expect(mocks.unmounted).not.toHaveBeenCalled();
		expect(mocks.request).toHaveBeenLastCalledWith({
			type: CalendarRequestType.ClearSelection,
		});
	});
});
