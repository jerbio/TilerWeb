import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@/test/test-utils';
import TiletteManagement from '../TiletteManagement';
import { TileShareTemplate } from '@/core/common/types/tileshare';
const api = vi.hoisted(() => ({
	addTiletteRecipient: vi.fn(),
	removeTiletteRecipient: vi.fn(),
	deleteTilette: vi.fn(),
}));
vi.mock('@/services', () => ({ tileshareService: api }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string, values?: Record<string, string>) =>
			(fallback ?? key).replace(
				/\{\{(\w+)\}\}/g,
				(_, name: string) => values?.[name] ?? name
			),
	}),
}));
const tilette: TileShareTemplate = {
	id: 'tilette',
	name: 'Review API',
	creator: null,
	clusterId: 'cluster',
	duration: 3600000,
	start: null,
	end: null,
	miscData: null,
	designatedUsers: [
		{
			designatedTileTemplateId: 'assignment',
			displayedIdentifier: 'ada@example.com',
			userId: 'ada',
			userProfile: null,
			rsvpStatus: 'accepted',
			completionPct: 0,
		},
	],
};
function mount(owner = true) {
	const onChanged = vi.fn().mockResolvedValue(undefined);
	const onDeleted = vi.fn();
	render(
		<TiletteManagement
			tilette={tilette}
			isOwner={owner}
			onChanged={onChanged}
			onDeleted={onDeleted}
		/>
	);
	return { onChanged, onDeleted };
}
beforeEach(() => {
	vi.resetAllMocks();
});
describe('tilette management', () => {
	it('hides management controls from participants', () => {
		mount(false);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
	it('adds a validated contact and refreshes the recipient list', async () => {
		const { onChanged } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		const input = screen.getByLabelText('Email or international phone number (+country code)');
		fireEvent.change(input, { target: { value: 'invalid' } });
		expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled();
		fireEvent.change(input, { target: { value: 'new@example.com' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add recipient' }));
		await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
		expect(api.addTiletteRecipient).toHaveBeenCalledWith('tilette', {
			Email: 'new@example.com',
		});
	});
	it('requires confirmation and removes only the selected assignment', async () => {
		const { onChanged } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		expect(api.removeTiletteRecipient).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
		expect(api.removeTiletteRecipient).toHaveBeenCalledWith('tilette', 'assignment');
	});
	it('keeps a failed removal open for retry', async () => {
		api.removeTiletteRecipient.mockRejectedValue(new Error('failed'));
		const { onChanged } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Couldn’t remove ada@example.com'
		);
		expect(onChanged).not.toHaveBeenCalled();
	});
	it('restores focus to Manage people after cancelling removal', async () => {
		mount();
		const manage = screen.getByRole('button', { name: 'Manage people' });
		fireEvent.click(manage);
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(manage).toHaveFocus());
		expect(api.removeTiletteRecipient).not.toHaveBeenCalled();
	});
	it('shows progress and success, prevents duplicate clicks, and hides a saved removal from a stale list', async () => {
		let finish!: () => void;
		api.removeTiletteRecipient.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				})
		);
		mount();
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		const confirm = screen.getByRole('button', { name: 'Remove participant' });
		fireEvent.click(confirm);
		fireEvent.click(confirm);
		expect(
			screen.getByRole('progressbar', { name: 'Participant removal progress' })
		).toHaveAttribute('value', '0');
		expect(
			screen.getByText('Removing ada@example.com. Assignments processed: 0/1.')
		).toBeInTheDocument();
		expect(
			screen
				.getAllByRole('button', { name: 'Close' })
				.every((button) => button.hasAttribute('disabled'))
		).toBe(true);
		await act(async () => finish());
		await screen.findByText('ada@example.com removed. Assignments removed: 1.');
		expect(api.removeTiletteRecipient).toHaveBeenCalledOnce();
		fireEvent.click(
			within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[1]
		);
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		expect(
			screen.queryByRole('button', { name: 'Remove ada@example.com' })
		).not.toBeInTheDocument();
	});
	it('offers an explanation and refresh when assignment details are missing', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		render(
			<TiletteManagement
				tilette={{
					...tilette,
					designatedUsers: [
						{ ...tilette.designatedUsers![0], designatedTileTemplateId: null },
					],
				}}
				isOwner
				onChanged={refresh}
				onDeleted={vi.fn()}
			/>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		expect(screen.getByText(/Some assignment details are unavailable/)).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Remove participant' })
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
		expect(api.removeTiletteRecipient).not.toHaveBeenCalled();
	});
	it('offers a refresh-only retry after a successful removal', async () => {
		const refresh = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(undefined);
		render(
			<TiletteManagement tilette={tilette} isOwner onChanged={refresh} onDeleted={vi.fn()} />
		);
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		await screen.findByText('Saved, but couldn’t refresh');
		expect(
			screen.getByText('ada@example.com removed. Assignments removed: 1.')
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
		expect(api.removeTiletteRecipient).toHaveBeenCalledOnce();
	});
	it('deletes the tilette after confirmation and returns to its parent', async () => {
		const { onDeleted } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Delete tilette' }));
		expect(api.deleteTilette).not.toHaveBeenCalled();
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveTextContent('The share will remain');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete tilette' }));
		await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
		expect(api.deleteTilette).toHaveBeenCalledWith('tilette');
	});
});
