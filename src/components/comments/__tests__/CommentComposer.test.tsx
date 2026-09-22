import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import CommentComposer from '../CommentComposer';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

describe('CommentComposer', () => {
	it('submits trimmed text and clears the field on success', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(<CommentComposer onSubmit={onSubmit} />);

		const input = screen.getByTestId('comment-composer-input');
		await user.type(input, '  hello world  ');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith('hello world');
		await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe(''));
	});

	it('disables the submit button when the field is empty', () => {
		render(<CommentComposer onSubmit={vi.fn()} />);
		expect(screen.getByTestId('comment-composer-submit')).toBeDisabled();
	});

	it('enables the submit button once there is non-whitespace text', async () => {
		const user = setupUser();
		render(<CommentComposer onSubmit={vi.fn()} />);
		const input = screen.getByTestId('comment-composer-input');
		await user.type(input, 'abc');
		expect(screen.getByTestId('comment-composer-submit')).toBeEnabled();
	});

	it('keeps the draft when the submit fails', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
		render(<CommentComposer onSubmit={onSubmit} />);

		const input = screen.getByTestId('comment-composer-input');
		await user.type(input, 'oops');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe('oops'));
	});
});
