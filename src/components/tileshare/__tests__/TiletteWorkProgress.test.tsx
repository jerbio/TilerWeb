import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import { setupUser } from '@/test/test-utils';
import { InvitationStatus, TileShareTemplate, DesignatedUser } from '@/core/common/types/tileshare';
import { TileShareViewerContext } from '../TiletteRsvpStatus';
import TiletteWorkProgress from '../TiletteWorkProgress';
const mocks = vi.hoisted(() => ({ response: vi.fn() }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		getAssignmentResponse = mocks.response;
	},
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_: string, fallback: string) => fallback,
		i18n: { language: 'en-US' },
	}),
}));
const assignment = (
	userId: string,
	completionPct: number | null,
	rsvpStatus = InvitationStatus.Accepted
): DesignatedUser => ({
	userId,
	completionPct,
	rsvpStatus,
	displayedIdentifier: userId,
	designatedTileTemplateId: userId + '-assignment',
	userProfile: null,
});
function Location() {
	return <div data-testid="location">{useLocation().search}</div>;
}
function show(assignments: DesignatedUser[], owner = false, assigneeId?: string) {
	const tilette: TileShareTemplate = {
		id: 't',
		name: 'Review',
		creator: null,
		designatedUsers: assignments,
		clusterId: 'c',
		duration: 3600000,
		start: null,
		end: null,
		miscData: null,
	};
	return render(
		<MemoryRouter>
			<ThemeProvider theme={lightTheme}>
				<TileShareViewerContext.Provider value={{ isOwner: owner, viewerId: 'me' }}>
					<TiletteWorkProgress tilette={tilette} assigneeId={assigneeId} />
					<Location />
				</TileShareViewerContext.Provider>
			</ThemeProvider>
		</MemoryRouter>
	);
}
beforeEach(() => vi.clearAllMocks());
describe('accepted tilette progress', () => {
	it('ends a stalled assignment lookup with an error and a usable retry action', async () => {
		vi.useFakeTimers();
		mocks.response.mockImplementationOnce(
			(_id: string, signal: AbortSignal) =>
				new Promise((_resolve, reject) => {
					signal.addEventListener('abort', () => reject(new Error('aborted')));
				})
		);
		show([assignment('me', 25)]);
		fireEvent.click(screen.getByRole('button', { name: 'Open tile' }));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(30000);
		});
		expect(screen.getByRole('alert')).toHaveTextContent('Try again');
		expect(screen.getByRole('button', { name: 'Open tile' })).toBeEnabled();
	});

	it('aborts an opening lookup when the TileShare UI unmounts', () => {
		mocks.response.mockReturnValueOnce(new Promise(() => {}));
		const view = show([assignment('me', 25)]);
		fireEvent.click(screen.getByRole('button', { name: 'Open tile' }));
		const signal = mocks.response.mock.calls[0][1] as AbortSignal;
		view.unmount();
		expect(signal.aborted).toBe(true);
	});
	it('acknowledges a slow lookup immediately and prevents duplicate opening requests', async () => {
		let resolve!: (value: unknown) => void;
		mocks.response.mockReturnValueOnce(
			new Promise((r) => {
				resolve = r;
			})
		);
		show([assignment('me', 25)]);
		await setupUser().click(screen.getByRole('button', { name: 'Open tile' }));
		const opening = screen.getByRole('button', { name: 'Finding your tile…' });
		expect(opening).toBeDisabled();
		expect(opening).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('status')).toHaveTextContent('Finding your tile');
		await setupUser().click(opening);
		expect(mocks.response).toHaveBeenCalledTimes(1);
		await act(async () =>
			resolve({ calendarId: 'calendar', invitationStatus: InvitationStatus.Accepted })
		);
		expect(screen.getByTestId('location')).toHaveTextContent('calendarEventId=calendar');
	});

	it('restores the action and displays an error when opening fails', async () => {
		mocks.response.mockRejectedValueOnce(new Error('Network unavailable'));
		show([assignment('me', 25)]);
		await setupUser().click(screen.getByRole('button', { name: 'Open tile' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Try again');
		expect(screen.getByRole('button', { name: 'Open tile' })).toBeEnabled();
	});
	it('ignores null assignment entries while retaining valid progress', () => {
		show([null, assignment('me', 25), null] as DesignatedUser[]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
		expect(screen.getByRole('button', { name: 'Open tile' })).toBeInTheDocument();
	});
	it('does not render phantom work for a null-only assignment list', () => {
		show([null] as unknown as DesignatedUser[], true);
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
	it('shows only the participant progress and opens their actual calendar tile', async () => {
		mocks.response.mockResolvedValue({
			id: 'me-assignment',
			invitationStatus: InvitationStatus.Accepted,
			calendarId: 'calendar+mine',
		});
		show([assignment('me', 25), assignment('other', 90)]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
		await setupUser().click(screen.getByRole('button', { name: 'Open tile' }));
		expect(mocks.response).toHaveBeenCalledWith('me-assignment', expect.any(AbortSignal));
		await waitFor(() =>
			expect(screen.getByTestId('location')).toHaveTextContent(
				'calendarEventId=calendar%2Bmine'
			)
		);
	});
	it('averages accepted work for the manager without including declined work', () => {
		show(
			[
				assignment('a', 20),
				assignment('b', 60),
				assignment('c', 100, InvitationStatus.Declined),
			],
			true
		);
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
		expect(screen.queryByRole('button', { name: 'Open tile' })).not.toBeInTheDocument();
	});
	it('does not turn unknown completion into zero', () => {
		show([assignment('a', 20), assignment('b', null)], true);
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		expect(screen.getByText('Progress unavailable')).toBeInTheDocument();
		expect(screen.getByRole('img', { name: 'Progress unavailable' })).toBeInTheDocument();
	});
	it.each([0, 50, 100])('shows %i%% inside an accessible completion donut', (progress) => {
		show([assignment('me', progress)]);
		const donut = screen.getByRole('progressbar', { name: 'Your completion' });
		expect(donut).toHaveAttribute('aria-valuemin', '0');
		expect(donut).toHaveAttribute('aria-valuemax', '100');
		expect(donut).toHaveAttribute('aria-valuenow', String(progress));
		expect(donut).toHaveTextContent(`${progress}%`);
		expect(donut.querySelector('svg')).toBeInTheDocument();
	});
	it('does not expose progress in another participant lane', () => {
		show([assignment('other', 90)], false, 'other');
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	});
	it('does not show progress for an unanswered or declined assignment', () => {
		show([assignment('me', 0, InvitationStatus.Declined)]);
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});
