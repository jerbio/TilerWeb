import { describe, it, expect, vi } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen, setupUser, waitFor } from '@/test/test-utils';
import CommentComposer from '../CommentComposer';
import type { AttachmentView } from '@/core/common/types/comment';

vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return {
		...actual,
		useTranslation: () => ({
			t: (key: string) => key,
		}),
	};
});

describe('CommentComposer', () => {
	it('submits trimmed text and clears the field on success', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(<CommentComposer onSubmit={onSubmit} />);

		const input = screen.getByTestId('comment-composer-input');
		await user.type(input, '  hello world  ');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith('hello world', [], expect.any(String));
		await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe(''));
	});

	it('reuses the idempotency key after a failed submit and rotates it after success', async () => {
		const user = setupUser();
		const onSubmit = vi
			.fn()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValue(undefined);
		render(<CommentComposer onSubmit={onSubmit} />);
		const input = screen.getByTestId('comment-composer-input');
		const submit = screen.getByTestId('comment-composer-submit');

		await user.type(input, 'hi');
		await user.click(submit);
		await waitFor(() => expect(submit).toBeEnabled());
		await user.click(submit);
		await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe(''));
		await user.type(input, 'next');
		await user.click(submit);

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3));
		const keys = onSubmit.mock.calls.map((c) => c[2]);
		expect(keys[1]).toBe(keys[0]);
		expect(keys[2]).not.toBe(keys[0]);
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

describe('CommentComposer — attachments', () => {
	const pdf = () => new File(['abc'], 'a.pdf', { type: 'application/pdf' });
	const ready = (id: string) => ({
		id,
		fileName: 'a.pdf',
		contentType: 'application/pdf',
		byteSize: 3,
		state: 'ready',
	});

	it('uploads a chosen file and submits its attachment id', async () => {
		const user = setupUser();
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onUpload = vi.fn().mockResolvedValue(ready('a1'));
		render(<CommentComposer onSubmit={onSubmit} onUpload={onUpload} />);

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		expect(onUpload).toHaveBeenCalledWith(
			expect.any(File),
			expect.any(String),
			expect.any(Function)
		);
		expect(await screen.findByText('a.pdf')).toBeInTheDocument();

		await user.type(screen.getByTestId('comment-composer-input'), 'see file');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(onSubmit).toHaveBeenCalledWith('see file', ['a1'], expect.any(String));
		await waitFor(() =>
			expect(screen.queryByTestId('comment-pending-attachment')).not.toBeInTheDocument()
		);
	});

	it('rejects a disallowed file type without uploading', async () => {
		const user = setupUser({ applyAccept: false });
		const onUpload = vi.fn();
		render(<CommentComposer onSubmit={vi.fn()} onUpload={onUpload} />);

		await user.upload(screen.getByTestId('comment-attach-input'), new File(['x'], 'a.exe'));

		expect(onUpload).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('comments.attachmentInvalidType');
	});

	it('blocks submit after a failed upload and retries with the same retry key', async () => {
		const user = setupUser();
		const onUpload = vi
			.fn()
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValueOnce(ready('a2'));
		render(<CommentComposer onSubmit={vi.fn()} onUpload={onUpload} />);
		const submit = screen.getByTestId('comment-composer-submit');

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		await user.type(screen.getByTestId('comment-composer-input'), 'text');
		await user.click(await screen.findByTestId('comment-attachment-retry'));

		await waitFor(() => expect(submit).toBeEnabled());
		expect(onUpload).toHaveBeenCalledTimes(2);
		expect(onUpload.mock.calls[1][1]).toBe(onUpload.mock.calls[0][1]);
	});

	it('disables submit while a file has not uploaded', async () => {
		const user = setupUser();
		const onUpload = vi.fn().mockRejectedValue(new Error('network'));
		render(<CommentComposer onSubmit={vi.fn()} onUpload={onUpload} />);

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		await user.type(screen.getByTestId('comment-composer-input'), 'text');

		await screen.findByTestId('comment-attachment-retry');
		expect(screen.getByTestId('comment-composer-submit')).toBeDisabled();
	});

	it('removes a ready attachment and cancels it on the server', async () => {
		const user = setupUser();
		const onCancelAttachment = vi.fn().mockResolvedValue(undefined);
		render(
			<CommentComposer
				onSubmit={vi.fn()}
				onUpload={vi.fn().mockResolvedValue(ready('a1'))}
				onCancelAttachment={onCancelAttachment}
			/>
		);

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		await screen.findByText('a.pdf');
		await user.click(screen.getByTestId('comment-attachment-remove'));

		expect(onCancelAttachment).toHaveBeenCalledWith('a1');
		expect(screen.queryByTestId('comment-pending-attachment')).not.toBeInTheDocument();
	});

	it('hides the attach control when uploads are not supported', () => {
		render(<CommentComposer onSubmit={vi.fn()} />);
		expect(screen.queryByTestId('comment-attach-input')).not.toBeInTheDocument();
	});
});

describe('CommentComposer — upload progress', () => {
	const pdf = () => new File(['abc'], 'a.pdf', { type: 'application/pdf' });

	/** An upload the test drives by hand: report progress, then resolve. */
	const controlledUpload = () => {
		let progress!: (fraction: number) => void;
		let finish!: () => void;
		const onUpload = vi.fn(
			(_file: File, _retryKey: string, onProgress?: (fraction: number) => void) => {
				progress = (f) => onProgress?.(f);
				return new Promise<AttachmentView>((resolve) => {
					finish = () =>
						resolve({
							id: 'a1',
							fileName: 'a.pdf',
							contentType: 'application/pdf',
							byteSize: 3,
							state: 'ready',
						});
				});
			}
		);
		return { onUpload, progress: (f: number) => progress(f), finish: () => finish() };
	};

	it('shows the percentage, then the server check, then uploaded', async () => {
		const user = setupUser();
		const upload = controlledUpload();
		render(<CommentComposer onSubmit={vi.fn()} onUpload={upload.onUpload} />);

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		act(() => upload.progress(0.4));

		const bar = screen.getByRole('progressbar', { name: 'a.pdf' });
		expect(bar).toHaveAttribute('aria-valuenow', '40');
		expect(screen.getByText('40%')).toBeInTheDocument();

		act(() => upload.progress(1));
		expect(screen.getByText('comments.attachmentProcessing')).toBeInTheDocument();

		await act(async () => upload.finish());
		expect(screen.getByText('comments.attachmentUploaded')).toBeInTheDocument();
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	});

	it('announces pending uploads next to the send button until they finish', async () => {
		const user = setupUser();
		const upload = controlledUpload();
		render(<CommentComposer onSubmit={vi.fn()} onUpload={upload.onUpload} />);

		await user.upload(screen.getByTestId('comment-attach-input'), pdf());

		const summary = screen.getByTestId('comment-upload-summary');
		expect(summary).toHaveAttribute('role', 'status');
		expect(summary).toHaveTextContent('comments.attachmentUploadingSummary');

		await act(async () => upload.finish());
		expect(screen.queryByTestId('comment-upload-summary')).not.toBeInTheDocument();
	});

	it('warns before leaving the page while an upload is in progress', async () => {
		const user = setupUser();
		const upload = controlledUpload();
		render(<CommentComposer onSubmit={vi.fn()} onUpload={upload.onUpload} />);
		const leave = () => {
			const event = new Event('beforeunload', { cancelable: true });
			window.dispatchEvent(event);
			return event.defaultPrevented;
		};

		expect(leave()).toBe(false);
		await user.upload(screen.getByTestId('comment-attach-input'), pdf());
		expect(leave()).toBe(true);

		await act(async () => upload.finish());
		expect(leave()).toBe(false);
	});
});
