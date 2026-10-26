import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { CalendarRouteFocus } from '../calendar_wrapper';
import { CalendarRequestProvider, useCalendarRequestListener } from '../CalendarRequestProvider';
import {
	CalendarRequestType,
	CalendarEntityType,
	CalendarRequest,
	CalendarRequestStatus,
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
