import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils';
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
		fireEvent.click(screen.getByRole('button', { name: 'Remove recipient' }));
		await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
		expect(api.removeTiletteRecipient).toHaveBeenCalledWith('tilette', 'assignment');
	});
	it('keeps a failed removal open for retry', async () => {
		api.removeTiletteRecipient.mockRejectedValue(new Error('failed'));
		const { onChanged } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Manage people' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove ada@example.com' }));
		fireEvent.click(screen.getByRole('button', { name: 'Remove recipient' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('could not be completed');
		expect(onChanged).not.toHaveBeenCalled();
	});
	it('deletes the tilette after confirmation and returns to its parent', async () => {
		const { onDeleted } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'Delete tilette' }));
		expect(api.deleteTilette).not.toHaveBeenCalled();
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveTextContent('The project will remain');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete tilette' }));
		await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
		expect(api.deleteTilette).toHaveBeenCalledWith('tilette');
	});
});
