import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import TiletteNotes from '../TiletteNotes';
import TiletteBody from '../detail/body/TiletteBody';
import { tileShareNotesService } from '@/services/tileShareNotesService';

vi.mock('react-i18next', async (importOriginal) => ({
	...(await importOriginal<typeof import('react-i18next')>()),
	useTranslation: () => ({
		t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
	}),
}));
vi.mock('@/services/tileShareNotesService', () => ({
	tileShareNotesService: { getNotes: vi.fn(), updateNotes: vi.fn() },
}));

describe('Board and Notes style isolation', () => {
	beforeEach(() => {
		localStorage.removeItem('tilesharedemo.detail.view');
		vi.mocked(tileShareNotesService.getNotes).mockReset().mockResolvedValue({
			EventId: 'share',
			UserNote: 'Saved notes',
			Etag: 'unchanged',
			Scope: 'tilette',
			AgentNote: null,
			Source: null,
			AuthorUserId: null,
			AgentNoteUpdatedAt: null,
		});
	});
	it('keeps Notes styling and data unchanged when empty Board lanes mount and views switch back', async () => {
		const { container } = render(
			<>
				<TiletteNotes id="share" canEdit={false} compact />
				<TiletteBody clusterId="share" tilettes={[]} />
			</>
		);
		await screen.findByText('Saved notes');
		const summary = container.querySelector('summary')!;
		expect(getComputedStyle(summary).display).toBe('flex');
		const user = setupUser();
		await user.click(screen.getByRole('tab', { name: 'Board view' }));
		const emptyLanes = screen.getAllByText('tilesharedemo.detail.board.empty');
		expect(emptyLanes).toHaveLength(3);
		for (const lane of emptyLanes) expect(getComputedStyle(lane).borderTopStyle).toBe('dashed');
		expect(container.querySelector('summary')).toBe(summary);
		expect(getComputedStyle(summary).display).toBe('flex');
		await user.click(screen.getByRole('tab', { name: 'tilesharedemo.detail.view.list' }));
		expect(getComputedStyle(summary).display).toBe('flex');
		expect(summary.parentElement).not.toHaveAttribute('open');
		expect(tileShareNotesService.getNotes).toHaveBeenCalledOnce();
	});
});
