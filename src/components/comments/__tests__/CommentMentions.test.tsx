import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser, within } from '@/test/test-utils';
import CommentComposer from '../CommentComposer';

vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return {
		...actual,
		useTranslation: () => ({ t: (key: string) => key }),
	};
});

const participants = [
	{ id: 'me', displayName: 'Tunde Adebayo', isViewer: true },
	{ id: 'u-ada', displayName: 'Ada Okafor', isViewer: false },
	{ id: 'u-kemi', displayName: 'Kemi Balogun', isViewer: false },
];

describe('CommentComposer — mentions', () => {
	it('suggests matching participants after @ and inserts the picked name', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(<CommentComposer onSubmit={onSubmit} participants={participants} />);
		const input = screen.getByTestId('comment-composer-input') as HTMLTextAreaElement;

		await user.type(input, 'Nice one, @ad');
		const list = screen.getByRole('listbox');
		expect(
			within(list)
				.getAllByRole('option')
				.map((o) => o.textContent)
		).toEqual(['Ada Okafor']);

		await user.keyboard('{Enter}');
		expect(input.value).toBe('Nice one, @Ada Okafor ');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

		await user.type(input, 'thanks');
		await user.click(screen.getByTestId('comment-composer-submit'));
		expect(onSubmit).toHaveBeenCalledWith('Nice one, <@u-ada> thanks', [], expect.any(String));
	});

	it('moves through suggestions with the arrow keys and picks with a click', async () => {
		const user = setupUser();
		render(<CommentComposer onSubmit={vi.fn()} participants={participants} />);
		const input = screen.getByTestId('comment-composer-input') as HTMLTextAreaElement;

		await user.type(input, '@');
		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		await user.keyboard('{ArrowDown}');
		expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');

		await user.click(screen.getByRole('option', { name: 'Kemi Balogun' }));
		expect(input.value).toBe('@Kemi Balogun ');
	});

	it('closes suggestions on Escape without submitting', async () => {
		const user = setupUser();
		const onSubmit = vi.fn();
		render(<CommentComposer onSubmit={onSubmit} participants={participants} />);
		const input = screen.getByTestId('comment-composer-input');

		await user.type(input, 'hey @k');
		await user.keyboard('{Escape}');

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('sends typed @text without a pick as plain text', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(<CommentComposer onSubmit={onSubmit} participants={participants} />);

		await user.type(screen.getByTestId('comment-composer-input'), 'ping @Ada Okafor');
		await user.keyboard('{Escape}');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(onSubmit).toHaveBeenCalledWith('ping @Ada Okafor', [], expect.any(String));
	});
});
