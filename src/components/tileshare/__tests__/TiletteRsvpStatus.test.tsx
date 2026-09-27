import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser, within } from '@/test/test-utils';
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import TiletteRsvpStatus, { TileShareViewerContext } from '../TiletteRsvpStatus';
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
const tilette: TileShareTemplate = {
	id: 'tilette',
	name: 'Task',
	creator: null,
	clusterId: 'cluster',
	duration: null,
	start: null,
	end: null,
	miscData: null,
	designatedUsers: [
		{
			userId: 'one',
			designatedTileTemplateId: 'a',
			displayedIdentifier: 'Ada',
			userProfile: null,
			rsvpStatus: InvitationStatus.Accepted,
			completionPct: 0,
		},
		{
			userId: 'two',
			designatedTileTemplateId: 'b',
			displayedIdentifier: 'Kemi',
			userProfile: null,
			rsvpStatus: InvitationStatus.Declined,
			completionPct: 0,
		},
		{
			userId: 'three',
			designatedTileTemplateId: 'c',
			displayedIdentifier: 'Chuks',
			userProfile: null,
			rsvpStatus: InvitationStatus.None,
			completionPct: 0,
		},
	],
};
const view = (isOwner: boolean, viewerId: string, data = tilette, assigneeId?: string) => (
	<TileShareViewerContext.Provider value={{ isOwner, viewerId }}>
		<TiletteRsvpStatus tilette={data} assigneeId={assigneeId} />
	</TileShareViewerContext.Provider>
);
describe('tilette RSVP presentation', () => {
	it.each([
		['one', 'Accepted'],
		['two', 'Declined'],
		['three', 'Awaiting response'],
	])('shows only %s own response, independent of work completion', (id, label) => {
		render(view(false, id));
		expect(screen.getByText('Your response')).toBeInTheDocument();
		expect(screen.getByText(label)).toBeInTheDocument();
		expect(screen.queryByText('View responses')).not.toBeInTheDocument();
		expect(screen.queryByText('Ada')).not.toBeInTheDocument();
	});
	it('summarizes mixed responses for the owner and identifies each participant', async () => {
		render(view(true, 'owner'));
		for (const label of ['Accepted', 'Declined', 'Awaiting response'])
			expect(screen.getAllByText(label)[0].parentElement).toHaveTextContent(`1${label}`);
		await setupUser().click(screen.getByText('View responses'));
		const rows = screen.getAllByRole('listitem');
		expect(within(rows[0]).getByText('Ada')).toBeInTheDocument();
		expect(within(rows[0]).getByText('Accepted')).toBeInTheDocument();
		expect(within(rows[1]).getByText('Declined')).toBeInTheDocument();
	});
	it('shows the specific assignee response to the manager in that lane', () => {
		render(view(true, 'owner', tilette, 'two'));
		expect(screen.getByText('Declined')).toBeInTheDocument();
		expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
	});
	it('does not label another lane as the participant own response', () => {
		const { container } = render(view(false, 'one', tilette, 'two'));
		expect(container.querySelector('span')).toBeNull();
	});
	it('does not infer acceptance or pending from an unknown or missing RSVP', () => {
		render(
			view(false, 'one', {
				...tilette,
				designatedUsers: [{ ...tilette.designatedUsers![0], rsvpStatus: null }],
			})
		);
		expect(screen.getByText('Unknown response')).toBeInTheDocument();
		expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
	});
	it('updates the label from refreshed assignment data', () => {
		const result = render(view(false, 'three'));
		result.rerender(
			view(false, 'three', {
				...tilette,
				designatedUsers: tilette.designatedUsers!.map((d) =>
					d.userId === 'three' ? { ...d, rsvpStatus: InvitationStatus.Accepted } : d
				),
			})
		);
		expect(screen.getByText('Accepted')).toBeInTheDocument();
		expect(screen.queryByText('Awaiting response')).not.toBeInTheDocument();
	});
});
