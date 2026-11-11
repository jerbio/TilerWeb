import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, setupUser, within, waitFor } from '@/test/test-utils';
import { tileshareService } from '@/services';
import { shareAssignment, shareTilette } from '@/test/tileshare-fixtures';
import { InvitationStatus } from '@/core/common/types/tileshare';
import { sharePreferenceKey } from '@/hooks/useSharePreference';
import { TileShareViewerContext } from '../TiletteRsvpStatus';
import { TileShareMutations } from '../TileShareMutations';
import TileShareTheme from '../TileShareTheme';
import ProjectShareExperience from '../ProjectShareExperience';
import ClassShareExperience from '../ClassShareExperience';

vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		respondToInvitation = vi.fn().mockResolvedValue({});
	},
}));
vi.mock('@/services', () => ({
	tileshareService: { addTiletteRecipient: vi.fn(), removeTiletteRecipient: vi.fn() },
}));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/core/theme/ThemeProvider', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({
		t: (
			key: string,
			fallback?: string | Record<string, unknown>,
			options?: Record<string, unknown>
		) => {
			let value = typeof fallback === 'string' ? fallback : key;
			for (const [name, replacement] of Object.entries(
				options ?? (typeof fallback === 'object' ? fallback : {})
			))
				value = value.split(`{{${name}}}`).join(String(replacement));
			return value;
		},
	}),
}));
const tasks = [
	shareTilette('My task', [
		shareAssignment('viewer'),
		shareAssignment('other', InvitationStatus.Accepted, 100),
	]),
	shareTilette('Other task', [shareAssignment('other')]),
	shareTilette('Unassigned task'),
];
const refresh = vi.fn().mockResolvedValue(undefined);
function show(mode: 'project' | 'class', owner: boolean, clusterId = 'share') {
	return render(
		<TileShareTheme>
			<TileShareMutations>
				<TileShareViewerContext.Provider value={{ isOwner: owner, viewerId: 'viewer' }}>
					{mode === 'project' ? (
						<ProjectShareExperience clusterId={clusterId} tilettes={tasks} />
					) : (
						<ClassShareExperience
							clusterId={clusterId}
							tilettes={tasks}
							participants={[{ Email: 'waiting@example.com' }]}
							refresh={refresh}
						/>
					)}
				</TileShareViewerContext.Provider>
			</TileShareMutations>
		</TileShareTheme>
	);
}
beforeEach(() => vi.clearAllMocks());
describe('share experiences', () => {
	it('keeps a pending removal and its result while switching Class sections', async () => {
		const remove = vi.mocked(tileshareService.removeTiletteRecipient);
		let finish!: () => void;
		remove.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = () => resolve({} as never);
				})
		);
		show('class', true);
		const interaction = setupUser();
		const participant = screen
			.getByText('viewer@example.com', { selector: 'strong' })
			.closest('details')!;
		await interaction.click(participant.querySelector('summary')!);
		await interaction.click(
			within(participant).getByRole('button', { name: 'Remove from existing tilettes' })
		);
		await interaction.click(screen.getByRole('button', { name: 'Remove participant' }));
		await interaction.click(screen.getByRole('tab', { name: 'Tilettes' }));
		await act(async () => finish());
		await screen.findByText('viewer@example.com removed. Assignments removed: 1.');
		const close = within(screen.getByRole('dialog')).getAllByRole('button', {
			name: 'Close',
		})[1];
		await waitFor(() => expect(close).toBeEnabled());
		await interaction.click(close);
		await interaction.click(screen.getByRole('tab', { name: 'Participants' }));
		expect(remove).toHaveBeenCalledExactlyOnceWith('My task', 'assignment-viewer');
		expect(screen.getByRole('status')).toHaveTextContent(
			'viewer@example.com removed. Assignments removed: 1.'
		);
	});
	it('retains failed Class changes while switching sections and retries only unfinished work', async () => {
		const add = vi.mocked(tileshareService.addTiletteRecipient);
		let reject!: (error: Error) => void;
		add.mockImplementation((id) =>
			id === 'Other task'
				? new Promise((_, fail) => {
						reject = fail;
					})
				: Promise.resolve({} as never)
		);
		show('class', true);
		const interaction = setupUser();
		await interaction.type(
			screen.getByLabelText('Participant email or phone'),
			'new@example.com'
		);
		await interaction.click(
			screen.getByRole('button', { name: 'Add to all existing tilettes' })
		);
		await interaction.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
		await waitFor(() => expect(add).toHaveBeenCalledTimes(2));
		await interaction.click(screen.getByRole('tab', { name: 'Tilettes' }));
		await act(async () => reject(new Error('offline')));
		await waitFor(() => expect(add).toHaveBeenCalledTimes(3));
		const close = within(screen.getByRole('dialog')).getAllByRole('button', {
			name: 'Close',
		})[1];
		await waitFor(() => expect(close).toBeEnabled());
		await interaction.click(close);
		await interaction.click(screen.getByRole('tab', { name: 'Participants' }));
		add.mockResolvedValue({} as never);
		await interaction.click(screen.getByRole('button', { name: 'Retry remaining changes' }));
		await waitFor(() => expect(add).toHaveBeenCalledTimes(4));
		expect(add.mock.calls.map(([id]) => id)).toEqual([
			'My task',
			'Other task',
			'Unassigned task',
			'Other task',
		]);
	});
	it('starts a Project owner on the collective Board, including an owner with assignments', () => {
		show('project', true);
		expect(screen.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'All tilettes' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(screen.getByText('Team status')).toBeInTheDocument();
		expect(screen.getByText('Unassigned task')).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'Class view' })).not.toBeInTheDocument();
	});
	it('starts a Project participant on My tilettes and applies scope to both layouts', async () => {
		show('project', false);
		expect(screen.getByRole('tab', { name: 'My tilettes' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(screen.queryByText('Other task')).not.toBeInTheDocument();
		await setupUser().click(screen.getByRole('tab', { name: 'Board' }));
		expect(screen.queryByText('Other task')).not.toBeInTheDocument();
		expect(screen.getAllByRole('tablist')).toHaveLength(2);
		await setupUser().click(screen.getByRole('tab', { name: 'All tilettes' }));
		expect(screen.getByText('Other task')).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'People' })).not.toBeInTheDocument();
	});
	it('remembers choices only for the same user, share, mode, and role', async () => {
		localStorage.setItem('tilesharedemo.detail.view', 'assignee');
		const first = show('project', true);
		await setupUser().click(screen.getByRole('tab', { name: 'People' }));
		first.unmount();
		const same = show('project', true);
		expect(screen.getByRole('tab', { name: 'People' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		same.unmount();
		const other = show('project', true, 'another');
		expect(screen.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true');
		other.unmount();
		show('project', false);
		expect(screen.getByRole('tab', { name: 'Tilettes' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(sharePreferenceKey('viewer', 'share', 'project', true)).not.toBe(
			sharePreferenceKey('another', 'share', 'project', true)
		);
	});
	it('shows a Class roster with missing assignments and the owner’s personal response action', async () => {
		show('class', true);
		expect(screen.getByRole('tab', { name: 'Participants' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		const waiting = screen
			.getByText('waiting@example.com', { selector: 'strong' })
			.closest('details')!;
		await setupUser().click(within(waiting).getByText('waiting@example.com'));
		expect(within(waiting).getByText('No assigned tilettes yet.')).toBeVisible();
		const self = screen
			.getByText('viewer@example.com', { selector: 'strong' })
			.closest('details')!;
		await setupUser().click(within(self).getByText('viewer@example.com'));
		expect(within(self).getByRole('button', { name: 'Respond' })).toBeVisible();
		expect(screen.queryByRole('tab', { name: 'Board' })).not.toBeInTheDocument();
	});
	it('gives Class participants their own list and bulk responses without a peer overview', () => {
		show('class', false);
		expect(screen.getByRole('heading', { name: 'My tilettes' })).toBeInTheDocument();
		expect(screen.getByText('0/1 completed')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Accept all pending tilettes' })
		).toBeInTheDocument();
		expect(screen.queryByText('Other task')).not.toBeInTheDocument();
		expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
		expect(screen.queryByText('waiting@example.com')).not.toBeInTheDocument();
	});
	it('falls back to defaults if storage is unavailable', () => {
		const storage = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('disabled');
		});
		show('project', true);
		expect(screen.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true');
		storage.mockRestore();
	});
});
