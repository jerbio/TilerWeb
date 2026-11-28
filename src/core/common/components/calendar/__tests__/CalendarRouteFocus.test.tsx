import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@/i18n/config';
import { MemoryRouter, useLocation } from 'react-router';
import { CalendarRouteFocus } from '../calendar_wrapper';
import { CalendarRequestProvider, useCalendarRequestListener } from '../CalendarRequestProvider';
import {
	CalendarRequestType,
	CalendarEntityType,
	CalendarRequest,
	CalendarRequestStatus,
	CalendarRequestResult,
} from '../calendarRequestContext';
vi.mock('@/core/common/components/calendar/calendar', () => ({ default: () => null }));
function Listener({ onRequest }: { onRequest: (request: CalendarRequest) => void }) {
	useCalendarRequestListener(({ request, onResult }) => {
		onRequest(request);
		onResult?.({ status: CalendarRequestStatus.Found, entityId: 'accepted+tile' });
	});
	return <output data-testid="query">{useLocation().search}</output>;
}
describe('calendar route focus', () => {
	it('shows startup progress and retains the route target until focus finishes', async () => {
		let report: ((result: CalendarRequestResult) => void) | undefined;
		const requested = vi.fn();
		function SlowListener() {
			useCalendarRequestListener(({ request, onResult }) => {
				requested(request);
				report = onResult;
				onResult?.({
					status: CalendarRequestStatus.Navigating,
					entityId: 'parent',
					phase: 'loading_calendar',
					date: Date.UTC(2026, 10, 28, 12),
				});
			});
			return <div data-testid="query">{useLocation().search}</div>;
		}
		const tree = (loading: boolean) => (
			<MemoryRouter initialEntries={['/timeline?calendarEventId=parent&view=week']}>
				<CalendarRequestProvider>
					<SlowListener />
					<CalendarRouteFocus loading={loading} allowEventLookup />
				</CalendarRequestProvider>
			</MemoryRouter>
		);
		const view = render(tree(true));
		expect(screen.getByTestId('calendar-navigation-feedback')).toHaveTextContent(
			'Loading your calendar'
		);
		view.rerender(tree(false));
		await waitFor(() => expect(report).toBeDefined());
		expect(screen.getByTestId('query')).toHaveTextContent('calendarEventId=parent');
		view.rerender(tree(true));
		expect(screen.getAllByTestId('calendar-navigation-feedback')).toHaveLength(1);
		expect(screen.getByTestId('calendar-navigation-feedback')).toHaveTextContent(
			'Loading the calendar for'
		);
		act(() => report?.({ status: CalendarRequestStatus.Found, entityId: 'parent' }));
		await waitFor(() => expect(screen.getByTestId('query')).toHaveTextContent('?view=week'));
		expect(requested).toHaveBeenCalledTimes(1);
	});
	it('waits for calendar loading and focuses the committed tile while preserving other parameters', async () => {
		const requested = vi.fn();
		const tree = (loading: boolean) => (
			<MemoryRouter initialEntries={['/timeline?calendarEventId=accepted%2Btile&view=week']}>
				<CalendarRequestProvider>
					<Listener onRequest={requested} />
					<CalendarRouteFocus loading={loading} allowEventLookup />
				</CalendarRequestProvider>
			</MemoryRouter>
		);
		const view = render(tree(true));
		expect(requested).not.toHaveBeenCalled();
		view.rerender(tree(false));
		await waitFor(() =>
			expect(requested).toHaveBeenCalledWith(
				expect.objectContaining({
					type: CalendarRequestType.FocusEvent,
					entityType: CalendarEntityType.CalendarEvent,
					entityId: 'accepted+tile',
				})
			)
		);
		await waitFor(() => expect(screen.getByTestId('query')).toHaveTextContent('?view=week'));
		expect(requested).toHaveBeenCalledTimes(1);
	});
});
