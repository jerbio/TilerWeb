import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, setupUser, waitFor, within } from '@/test/test-utils';
import { shareAssignment, shareTilette } from '@/test/tileshare-fixtures';
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import ProjectShareExperience from '../ProjectShareExperience';
import ClassShareExperience from '../ClassShareExperience';
import TileShareTheme from '../TileShareTheme';
import { TileShareMutations } from '../TileShareMutations';
import { TileShareViewerContext } from '../TiletteRsvpStatus';
import { TiletteInvitationRefreshContext } from '../TiletteInvitationActions';
import { sharePreferenceKey } from '@/hooks/useSharePreference';

const mocks = vi.hoisted(() => ({
	add: vi.fn(),
	remove: vi.fn(),
	respond: vi.fn(),
	check: vi.fn(),
	refresh: vi.fn(),
	user: { id: 'viewer', countryCode: '1', timeZone: 'America/Denver' },
}));
vi.mock('@/services', () => ({
	tileshareService: { addTiletteRecipient: mocks.add, removeTiletteRecipient: mocks.remove },
}));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		respondToInvitation = mocks.respond;
		getAssignmentResponse = mocks.check;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/core/theme/ThemeProvider', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({
		i18n: { language: 'en' },
		t: (
			key: string,
			fallback?: string | Record<string, unknown>,
			options?: Record<string, unknown>
		) => {
			let result = typeof fallback === 'string' ? fallback : key;
			for (const [name, value] of Object.entries(
				options ?? (typeof fallback === 'object' ? fallback : {})
			))
				result = result.split(`{{${name}}}`).join(String(value));
			return result;
		},
	}),
}));

function scene(
	tasks: TileShareTemplate[],
	owner = true,
	mode: 'project' | 'class' = 'project',
	id = 'share'
) {
	return (
		<TileShareTheme>
			<TileShareMutations>
				<TileShareViewerContext.Provider value={{ isOwner: owner, viewerId: 'viewer' }}>
					<TiletteInvitationRefreshContext.Provider value={mocks.refresh}>
						{mode === 'project' ? (
							<ProjectShareExperience clusterId={id} tilettes={tasks} />
						) : (
							<ClassShareExperience
								clusterId={id}
								tilettes={tasks}
								participants={[{ Email: 'waiting@example.com' }]}
								refresh={mocks.refresh}
							/>
						)}
					</TiletteInvitationRefreshContext.Provider>
				</TileShareViewerContext.Provider>
			</TileShareMutations>
		</TileShareTheme>
	);
}
function show(
	tasks: TileShareTemplate[],
	owner = true,
	mode: 'project' | 'class' = 'project',
	id = 'share'
) {
	return render(scene(tasks, owner, mode, id));
}
function card(name: string) {
	return screen.getByText(name, { selector: 'p' }).closest('[data-board-card-id]') as HTMLElement;
}
function column(stage: string) {
	return screen.getByText(`tilesharedemo.detail.status.${stage}`).parentElement!.parentElement!
		.parentElement!;
}
function drag(name: string, target: string) {
	const values = new Map<string, string>();
	const dataTransfer = {
		effectAllowed: '',
		setData: (type: string, value: string) => values.set(type, value),
		getData: (type: string) => values.get(type) ?? '',
	};
	fireEvent.dragStart(card(name), { dataTransfer });
	fireEvent.dragEnter(column(target), { dataTransfer });
	fireEvent.drop(column(target), { dataTransfer });
}
function checked(label: string) {
	const stages = ['Unassigned', 'Delegated', 'In progress', 'Completed'];
	const responses = [
		'Awaiting response',
		'Tentative',
		'Accepted',
		'Declined',
		'Unknown response',
	];
	const name = stages.includes(label)
		? /^(Participant status|Status)(\s*\(\d+\))?$/
		: responses.includes(label)
			? /^Invitation response/
			: /^People(\s*\(\d+\))?$/;
	fireEvent.click(screen.getByRole('button', { name }));
	fireEvent.click(screen.getByRole('checkbox', { name: label }));
	fireEvent.keyDown(document, { key: 'Escape' });
}
const mixed = shareTilette('Mixed work', [
	shareAssignment('viewer', InvitationStatus.Accepted, 100),
	shareAssignment('other', InvitationStatus.None),
]);
beforeEach(() => {
	vi.resetAllMocks();
	mocks.add.mockResolvedValue({});
	mocks.remove.mockResolvedValue({});
	mocks.respond.mockResolvedValue({});
	mocks.refresh.mockResolvedValue(undefined);
});

describe('four-stage TileShare workflows', () => {
	it('can cancel assignment selection without writing and restores focus to its launch button', async () => {
		show([shareTilette('Free work')]);
		const launch = within(card('Free work')).getByRole('button', {
			name: 'Assign participants',
		});
		await setupUser().click(launch);
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(launch).toHaveFocus());
		expect(mocks.add).not.toHaveBeenCalled();
	});
	it('revalidates an unassigned tilette after selection before creating assignments', async () => {
		const free = shareTilette('Free work');
		const known = shareTilette('Known work', [shareAssignment('viewer')]);
		const page = show([free, known]);
		fireEvent.click(
			within(card('Free work')).getByRole('button', { name: 'Assign participants' })
		);
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('checkbox', { name: 'viewer@example.com' })
		);
		fireEvent.click(screen.getByRole('button', { name: 'Review assignments' }));
		page.rerender(scene([{ ...free, designatedUsers: [shareAssignment('other')] }, known]));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('This tilette has changed');
		expect(mocks.add).not.toHaveBeenCalled();
	});
	it('announces a completed assignment after navigation but does not continue old-scope writes', async () => {
		let finish!: () => void;
		mocks.add.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				})
		);
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			const page = show([
				shareTilette('Free work'),
				shareTilette('Known work', [shareAssignment('viewer'), shareAssignment('other')]),
			]);
			fireEvent.click(
				within(card('Free work')).getByRole('button', { name: 'Assign participants' })
			);
			const dialog = within(screen.getByRole('dialog'));
			fireEvent.click(dialog.getByRole('checkbox', { name: 'viewer@example.com' }));
			fireEvent.click(dialog.getByRole('checkbox', { name: 'other@example.com' }));
			fireEvent.click(dialog.getByRole('button', { name: 'Review assignments' }));
			fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
			page.unmount();
			await act(async () => finish());
			expect(mocks.add).toHaveBeenCalledOnce();
			expect(changed).toHaveBeenCalledOnce();
			expect(mocks.refresh).not.toHaveBeenCalled();
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});
	it('revalidates the complete removal scope when assignments change before confirmation', async () => {
		const page = show([mixed]);
		drag('Mixed work', 'unassigned');
		page.rerender(
			scene([
				{
					...mixed,
					designatedUsers: [...mixed.designatedUsers!, shareAssignment('new-person')],
				},
			])
		);
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('This tilette has changed');
		expect(mocks.remove).not.toHaveBeenCalled();
	});
	it('keeps Class additions scoped to every existing tilette when filters hide work', async () => {
		show([shareTilette('Visible work'), shareTilette('Hidden work')], true, 'class');
		fireEvent.change(screen.getByLabelText('Search tilette names'), {
			target: { value: 'Visible' },
		});
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'new@example.com' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Add to all existing tilettes' }));
		expect(
			screen.getByText('Add new@example.com to existing tilettes? Total: 2.')
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Add participant' }));
		await waitFor(() => expect(mocks.add).toHaveBeenCalledTimes(2));
		expect(mocks.add.mock.calls.map((call) => call[0])).toEqual([
			'Visible work',
			'Hidden work',
		]);
	});
	it('places work in the four columns and never treats a mixed or unknown assignment as complete', () => {
		show([
			shareTilette('Free work'),
			shareTilette('Waiting work', [shareAssignment('viewer')]),
			mixed,
			shareTilette('Done work', [shareAssignment('viewer', InvitationStatus.Accepted, 100)]),
			shareTilette('Unknown work', [shareAssignment('viewer', InvitationStatus.Accepted)]),
		]);
		expect(column('unassigned')).toHaveTextContent('Free work');
		expect(column('delegated')).toHaveTextContent('Waiting work');
		expect(column('inProgress')).toHaveTextContent('Mixed work');
		expect(column('inProgress')).toHaveTextContent('Unknown work');
		expect(column('completed')).toHaveTextContent('Done work');
	});
	it('supports assignment by drag, reviews contacts, and deduplicates new contacts', async () => {
		show([shareTilette('Free work'), shareTilette('Known work', [shareAssignment('viewer')])]);
		drag('Free work', 'delegated');
		const dialog = screen.getByRole('dialog');
		fireEvent.click(within(dialog).getByRole('checkbox', { name: 'viewer@example.com' }));
		const input = within(dialog).getByLabelText('Participant email or phone');
		fireEvent.change(input, { target: { value: 'VIEWER@example.com' } });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Add to selection' }));
		fireEvent.click(within(dialog).getByRole('button', { name: 'Review assignments' }));
		expect(
			screen.getByText('Assign Free work to the selected participants? Total: 1.')
		).toBeInTheDocument();
		expect(mocks.add).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		await screen.findByText('Free work — assignments saved: 1; assignments to retry: 0.');
		expect(mocks.add).toHaveBeenCalledExactlyOnceWith(
			'Free work',
			expect.objectContaining({ Id: 'viewer', Email: 'viewer@example.com' })
		);
	});
	it('keeps partial assignment results across layout changes and retries only failed writes', async () => {
		mocks.add
			.mockResolvedValueOnce({})
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({});
		show([
			shareTilette('Free work'),
			shareTilette('Known work', [shareAssignment('viewer'), shareAssignment('other')]),
		]);
		fireEvent.click(
			within(card('Free work')).getByRole('button', { name: 'Assign participants' })
		);
		const dialog = screen.getByRole('dialog');
		fireEvent.click(within(dialog).getByRole('checkbox', { name: 'viewer@example.com' }));
		fireEvent.click(within(dialog).getByRole('checkbox', { name: 'other@example.com' }));
		fireEvent.click(within(dialog).getByRole('button', { name: 'Review assignments' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		await screen.findByText('Free work — assignments saved: 1; assignments to retry: 1.');
		fireEvent.click(
			within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[1]
		);
		fireEvent.click(screen.getByRole('tab', { name: 'Tilettes' }));
		fireEvent.click(screen.getByRole('button', { name: 'Retry remaining changes' }));
		await screen.findByText('Free work — assignments saved: 2; assignments to retry: 0.');
		expect(mocks.add.mock.calls.map((call) => call[1].Email)).toEqual([
			'viewer@example.com',
			'other@example.com',
			'other@example.com',
		]);
	});
	it('offers refresh-only retry after assignments were saved', async () => {
		mocks.refresh.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
		show([shareTilette('Free work'), shareTilette('Known work', [shareAssignment('viewer')])]);
		fireEvent.click(
			within(card('Free work')).getByRole('button', { name: 'Assign participants' })
		);
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('checkbox', { name: 'viewer@example.com' })
		);
		fireEvent.click(screen.getByRole('button', { name: 'Review assignments' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		await screen.findByText('Saved, but couldn’t refresh');
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(2));
		expect(mocks.add).toHaveBeenCalledOnce();
	});
	it('allows correcting the contact selection when no assignment was saved', async () => {
		mocks.add.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({});
		show([shareTilette('Free work'), shareTilette('Known work', [shareAssignment('viewer')])]);
		fireEvent.click(
			within(card('Free work')).getByRole('button', { name: 'Assign participants' })
		);
		const input = within(screen.getByRole('dialog')).getByLabelText(
			'Participant email or phone'
		);
		fireEvent.change(input, { target: { value: 'wrong@example.com' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add to selection' }));
		fireEvent.click(screen.getByRole('button', { name: 'Review assignments' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		await screen.findByText('Free work — assignments saved: 0; assignments to retry: 1.');
		fireEvent.click(
			within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[1]
		);
		fireEvent.click(screen.getByRole('button', { name: 'Edit selection' }));
		const dialog = within(screen.getByRole('dialog'));
		fireEvent.click(dialog.getByRole('checkbox', { name: 'wrong@example.com' }));
		fireEvent.click(dialog.getByRole('checkbox', { name: 'viewer@example.com' }));
		fireEvent.click(screen.getByRole('button', { name: 'Review assignments' }));
		fireEvent.click(screen.getByRole('button', { name: 'Confirm assignments' }));
		await screen.findByText('Free work — assignments saved: 1; assignments to retry: 0.');
		expect(mocks.add.mock.calls.map((call) => call[1].Email)).toEqual([
			'wrong@example.com',
			'viewer@example.com',
		]);
	});
	it('removes the full assignment set despite a people filter and only after confirmation', async () => {
		show([mixed]);
		checked('viewer@example.com');
		drag('Mixed work', 'unassigned');
		expect(
			screen.getByText(
				'Remove all 2 assignments on this tilette? Linked calendar work for every participant will be disabled. Other tilettes will remain unchanged.'
			)
		).toBeInTheDocument();
		expect(mocks.remove).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
		expect(mocks.remove.mock.calls).toEqual([
			['Mixed work', 'assignment-viewer'],
			['Mixed work', 'assignment-other'],
		]);
	});
	it('restricts owner My scope to own acceptance and keeps the result after filtering away the card', async () => {
		let finish!: () => void;
		mocks.respond.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				})
		);
		show([
			shareTilette('Pending work', [shareAssignment('viewer')]),
			shareTilette('Free work'),
		]);
		fireEvent.click(screen.getByRole('tab', { name: 'My tilettes' }));
		expect(
			within(card('Pending work')).queryByRole('button', { name: 'Remove assignments' })
		).not.toBeInTheDocument();
		drag('Pending work', 'unassigned');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		drag('Pending work', 'inProgress');
		fireEvent.change(screen.getByLabelText('Search tilette names'), {
			target: { value: 'no match' },
		});
		fireEvent.click(screen.getByRole('tab', { name: 'Tilettes' }));
		await act(async () => finish());
		await screen.findByText('Your response for Pending work is saved.');
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith(
			'assignment-viewer',
			InvitationStatus.Accepted
		);
	});
	it('checks an uncertain acceptance without repeating the write', async () => {
		mocks.respond.mockRejectedValue(new Error('timeout'));
		mocks.check.mockResolvedValue({
			id: 'assignment-viewer',
			tiletteId: 'Pending work',
			clusterId: 'share',
			invitationStatus: 'accepted',
		});
		show([shareTilette('Pending work', [shareAssignment('viewer')])]);
		drag('Pending work', 'inProgress');
		await screen.findByText(
			'Your response for Pending work could not be confirmed. Check the response before trying again.'
		);
		fireEvent.click(screen.getByRole('button', { name: 'Check response' }));
		await screen.findByText('Your response for Pending work is saved.');
		expect(mocks.respond).toHaveBeenCalledOnce();
		expect(mocks.check).toHaveBeenCalledExactlyOnceWith('assignment-viewer');
	});
	it('treats the backend pending response as awaiting response for badges, filters, and acceptance', async () => {
		show(
			[shareTilette('Pending work', [shareAssignment('viewer', InvitationStatus.Pending)])],
			false
		);
		expect(screen.getByText('Awaiting response', { selector: 'span' })).toBeInTheDocument();
		checked('Awaiting response');
		expect(screen.getByText('Pending work', { selector: 'a' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
		drag('Pending work', 'inProgress');
		await screen.findByText('Your response for Pending work is saved.');
		expect(mocks.respond).toHaveBeenCalledExactlyOnceWith(
			'assignment-viewer',
			InvitationStatus.Accepted
		);
	});
	it('prevents arbitrary completion and participant assignment/removal drags', () => {
		show(
			[shareTilette('Pending work', [shareAssignment('viewer')]), shareTilette('Free work')],
			false
		);
		fireEvent.click(screen.getByRole('tab', { name: 'All tilettes' }));
		fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
		expect(card('Free work')).not.toHaveAttribute('draggable', 'true');
		drag('Pending work', 'completed');
		drag('Pending work', 'unassigned');
		expect(mocks.respond).not.toHaveBeenCalled();
		expect(mocks.remove).not.toHaveBeenCalled();
		expect(mocks.add).not.toHaveBeenCalled();
	});
	it('shares filters across layouts, restores them on return, and resets pagination', async () => {
		const tasks = Array.from({ length: 12 }, (_, i) => shareTilette(`Task ${i}`));
		const first = show(tasks);
		fireEvent.click(screen.getByRole('tab', { name: 'Tilettes' }));
		await setupUser().click(screen.getByRole('button', { name: /next/i }));
		expect(screen.getByText('Task 11')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Search tilette names'), {
			target: { value: 'Task 0' },
		});
		await waitFor(() =>
			expect(screen.getByText('Task 0', { selector: 'a' })).toBeInTheDocument()
		);
		fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
		expect(card('Task 0')).toBeInTheDocument();
		expect(screen.queryByText('Task 11')).not.toBeInTheDocument();
		first.unmount();
		show(tasks);
		expect(screen.getByLabelText('Search tilette names')).toHaveValue('Task 0');
		fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
		expect(card('Task 11')).toBeInTheDocument();
	});
	it('uses individual work status in People while retaining team status in Board', () => {
		show([mixed]);
		checked('Completed');
		expect(
			screen.getByText('No matching results. Change or clear your filters.')
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: 'People' }));
		expect(screen.getByText('Mixed work')).toBeInTheDocument();
		expect(
			screen.queryByText('other@example.com', { selector: 'span' })
		).not.toBeInTheDocument();
	});
	it('preserves Class summary totals and full bulk-response scope when title filters hide work', async () => {
		const tasks = [
			shareTilette('Visible work', [shareAssignment('viewer')]),
			shareTilette('Hidden work', [
				{ ...shareAssignment('viewer'), designatedTileTemplateId: 'other-assignment' },
			]),
		];
		show(tasks, false, 'class');
		fireEvent.change(screen.getByLabelText('Search tilette names'), {
			target: { value: 'Visible' },
		});
		expect(screen.getByText('0/2 completed')).toBeInTheDocument();
		expect(screen.queryByText('Hidden work')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Accept all pending tilettes' }));
		expect(
			screen.getByText(
				'Apply tileshareRsvp.accepted to all 2 of your pending assignments in this Class, including assignments hidden by filters?'
			)
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Confirm response' }));
		await waitFor(() => expect(mocks.respond).toHaveBeenCalledTimes(2));
		expect(screen.queryByLabelText('Find people')).not.toBeInTheDocument();
	});
	it('keeps empty roster members until assignment-specific filters exclude them', () => {
		show([mixed], true, 'class');
		expect(screen.getByText('waiting@example.com', { selector: 'strong' })).toBeInTheDocument();
		checked('Completed');
		expect(
			screen.queryByText('waiting@example.com', { selector: 'strong' })
		).not.toBeInTheDocument();
		expect(screen.getByText('1 assigned tilettes')).toBeInTheDocument();
		expect(screen.getByText('1/1 completed')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
		expect(screen.getByText('waiting@example.com', { selector: 'strong' })).toBeInTheDocument();
	});
	it('ignores invalid storage and isolates filters by role and share', () => {
		localStorage.setItem(
			`${sharePreferenceKey('viewer', 'share', 'project', true)}:filters.v1`,
			'{bad'
		);
		const first = show([mixed]);
		expect(screen.getByLabelText('Search tilette names')).toHaveValue('');
		fireEvent.change(screen.getByLabelText('Search tilette names'), {
			target: { value: 'missing' },
		});
		first.unmount();
		const second = show([mixed], true, 'project', 'another');
		expect(screen.getByLabelText('Search tilette names')).toHaveValue('');
		second.unmount();
		show([mixed], false);
		expect(screen.getByLabelText('Search tilette names')).toHaveValue('');
	});
});
