import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
	return <output data-testid="location">{useLocation().search}</output>;
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
	it('shows only the participant progress and opens their actual calendar tile', async () => {
		mocks.response.mockResolvedValue({
			id: 'me-assignment',
			invitationStatus: InvitationStatus.Accepted,
			calendarId: 'calendar+mine',
		});
		show([assignment('me', 25), assignment('other', 90)]);
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '25');
		await setupUser().click(screen.getByRole('button', { name: 'Open tile' }));
		expect(mocks.response).toHaveBeenCalledWith('me-assignment');
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
		expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
		expect(screen.queryByRole('button', { name: 'Open tile' })).not.toBeInTheDocument();
	});
	it('does not turn unknown completion into zero', () => {
		show([assignment('a', 20), assignment('b', null)], true);
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		expect(screen.getByText('Progress unavailable')).toBeInTheDocument();
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
