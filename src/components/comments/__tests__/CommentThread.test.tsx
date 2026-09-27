import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser, within } from '@/test/test-utils';
import CommentThread from '../CommentThread';
import CommentsService from '@/services/commentsService';
import type { CommentView } from '@/core/common/types/comment';

vi.mock('react-i18next', async () => {
	const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
	return {
		...actual,
		useTranslation: () => ({
			t: (key: string, opts?: { count?: number }) => {
				if (key === 'comments.count') return `${opts?.count ?? 0} comments`;
				return key;
			},
		}),
	};
});

const comment = (id: string, text: string, overrides: Partial<CommentView> = {}) => ({
	id,
	targetType: 'tileshare_tilette',
	targetId: 't',
	author: { id: 'user-1', displayName: 'Alice', isOwner: true, isDeleted: false },
	text,
	createdAt: 1750000000000,
	editedAt: null,
	deletedAt: null,
	isDeleted: false,
	canEdit: true,
	canDelete: true,
	rootCommentId: null,
	isReply: false,
	hasReplies: false,
	replyCount: 0,
	...overrides,
});

const reply = (id: string, text: string, rootCommentId = 'c1') =>
	comment(id, text, { rootCommentId, isReply: true });

const makeService = (impl: {
	getComments: ReturnType<typeof vi.fn>;
	getReplies?: ReturnType<typeof vi.fn>;
	createComment?: ReturnType<typeof vi.fn>;
	updateComment?: ReturnType<typeof vi.fn>;
	deleteComment?: ReturnType<typeof vi.fn>;
	uploadAttachment?: ReturnType<typeof vi.fn>;
	deleteAttachment?: ReturnType<typeof vi.fn>;
	downloadAttachment?: ReturnType<typeof vi.fn>;
	getParticipants?: ReturnType<typeof vi.fn>;
}) =>
	({
		getComments: impl.getComments,
		getReplies: impl.getReplies ?? vi.fn(),
		createComment: impl.createComment ?? vi.fn(),
		updateComment: impl.updateComment ?? vi.fn(),
		deleteComment: impl.deleteComment ?? vi.fn(),
		uploadAttachment: impl.uploadAttachment ?? vi.fn(),
		deleteAttachment: impl.deleteAttachment ?? vi.fn(),
		downloadAttachment: impl.downloadAttachment ?? vi.fn(),
		getParticipants: impl.getParticipants ?? vi.fn().mockResolvedValue([]),
	}) as unknown as CommentsService;

describe('CommentThread', () => {
	it('renders the loaded comments and the total count', async () => {
		const service = makeService({
			getComments: vi.fn().mockResolvedValue({
				comments: [comment('c1', 'first'), comment('c2', 'second')],
				nextCursor: null,
				total: 2,
			}),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		expect(await screen.findAllByTestId('comment-item')).toHaveLength(2);
		expect(screen.getByText('2 comments')).toBeInTheDocument();
		expect(service.getComments).toHaveBeenCalledTimes(1);
	});

	it('shows the empty state when there are no comments', async () => {
		const service = makeService({
			getComments: vi.fn().mockResolvedValue({ comments: [], nextCursor: null, total: 0 }),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		expect(await screen.findByTestId('comment-empty')).toBeInTheDocument();
	});

	it('shows the error state with a retry that reloads', async () => {
		const user = setupUser();
		let call = 0;
		const service = makeService({
			getComments: vi.fn().mockImplementation(() => {
				call += 1;
				return call === 1
					? Promise.reject(new Error('boom'))
					: Promise.resolve({
							comments: [comment('c1', 'recovered')],
							nextCursor: null,
							total: 1,
						});
			}),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		expect(await screen.findByTestId('comment-error')).toBeInTheDocument();
		expect(screen.getByText('boom')).toBeInTheDocument();

		await user.click(screen.getByTestId('comment-retry'));
		expect(await screen.findByTestId('comment-item')).toBeInTheDocument();
		expect(service.getComments).toHaveBeenCalledTimes(2);
	});

	it('appends comments on load-more and hides the button when there is no next cursor', async () => {
		const user = setupUser();
		const service = makeService({
			getComments: vi
				.fn()
				.mockResolvedValueOnce({
					comments: [comment('c1', 'first')],
					nextCursor: 'cur1',
					total: 5,
				})
				.mockResolvedValueOnce({
					comments: [comment('c2', 'second')],
					nextCursor: null,
					total: 5,
				}),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		await screen.findByTestId('comment-load-more');
		await user.click(screen.getByTestId('comment-load-more'));

		expect(await screen.findAllByTestId('comment-item')).toHaveLength(2);
		expect(screen.queryByTestId('comment-load-more')).not.toBeInTheDocument();
		expect(service.getComments).toHaveBeenCalledTimes(2);
	});
});

describe('CommentThread — two-level replies', () => {
	const rootThread = (overrides: Partial<CommentView> = {}) =>
		vi.fn().mockResolvedValue({
			comments: [comment('c1', 'root', { hasReplies: true, replyCount: 2, ...overrides })],
			nextCursor: null,
			total: 1,
		});

	it('shows the reply toggle on a root and opens the inline reply composer without fetching', async () => {
		const user = setupUser();
		const service = makeService({ getComments: rootThread({ hasReplies: false }) });

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		const replyToggle = await screen.findByTestId('comment-reply-toggle');
		expect(screen.queryByTestId('comment-reply-composer')).not.toBeInTheDocument();

		await user.click(replyToggle);

		expect(screen.getByTestId('comment-reply-composer')).toBeInTheDocument();
		expect(
			screen.getByRole('textbox', { name: 'comments.replyPlaceholder' })
		).toBeInTheDocument();
		// Opening the composer must not trigger a reply fetch.
		expect(service.getReplies).not.toHaveBeenCalled();
	});

	it('submits a reply via the service with the root comment id', async () => {
		const user = setupUser();
		const createComment = vi.fn().mockResolvedValue(reply('r1', 'new reply'));
		const service = makeService({
			getComments: rootThread({ hasReplies: false }),
			createComment,
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		await user.click(await screen.findByTestId('comment-reply-toggle'));
		await user.type(
			screen.getByRole('textbox', { name: 'comments.replyPlaceholder' }),
			'hello'
		);
		await user.click(
			within(screen.getByTestId('comment-reply-composer')).getByTestId(
				'comment-composer-submit'
			)
		);

		expect(createComment).toHaveBeenCalledTimes(1);
		const args = createComment.mock.calls[0][0] as Record<string, unknown>;
		expect(args).toMatchObject({
			targetType: 'tileshare_tilette',
			targetId: 't',
			text: 'hello',
			rootCommentId: 'c1',
			mentionedUserIds: [],
		});
		expect(typeof args.idempotencyKey).toBe('string');
		// On success the composer closes and the created reply renders inline.
		expect(screen.queryByTestId('comment-reply-composer')).not.toBeInTheDocument();
		const items = await screen.findAllByTestId('comment-item');
		expect(items).toHaveLength(2);
	});

	it('loads replies lazily on the first expand and hides them without re-fetching', async () => {
		const user = setupUser();
		const service = makeService({
			getComments: rootThread(),
			getReplies: vi.fn().mockResolvedValue({
				comments: [reply('r1', 'one'), reply('r2', 'two')],
				nextCursor: null,
				total: 2,
			}),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await screen.findByTestId('comment-item', { exact: false });

		// Nothing fetched until the user expands.
		expect(service.getReplies).not.toHaveBeenCalled();

		await user.click(screen.getByTestId('comment-replies-toggle'));
		expect(await screen.findByTestId('comment-reply-list')).toBeInTheDocument();
		expect(service.getReplies).toHaveBeenCalledTimes(1);
		expect(service.getReplies).toHaveBeenCalledWith(
			'c1',
			expect.objectContaining({ limit: 50 })
		);
		expect(await screen.findAllByTestId('comment-item')).toHaveLength(3);

		// Nested replies never show a reply affordance (two-level limit).
		expect(screen.getAllByTestId('comment-reply-toggle')).toHaveLength(1);
		expect(screen.queryByTestId('comment-reply-composer')).not.toBeInTheDocument();

		// Collapse again — no second fetch.
		await user.click(screen.getByTestId('comment-replies-toggle'));
		expect(screen.queryByTestId('comment-reply-list')).not.toBeInTheDocument();
		expect(service.getReplies).toHaveBeenCalledTimes(1);
	});

	it('shows the empty state when a root has no replies', async () => {
		const user = setupUser();
		const service = makeService({
			getComments: rootThread(),
			getReplies: vi.fn().mockResolvedValue({ comments: [], nextCursor: null, total: 0 }),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		await user.click(await screen.findByTestId('comment-replies-toggle'));
		expect(await screen.findByTestId('comment-replies-empty')).toBeInTheDocument();
	});

	it('shows a reply error with a retry that re-fetches', async () => {
		const user = setupUser();
		const getReplies = vi
			.fn()
			.mockRejectedValueOnce(new Error('replies boom'))
			.mockResolvedValueOnce({ comments: [], nextCursor: null, total: 0 });
		const service = makeService({ getComments: rootThread(), getReplies });

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		await user.click(await screen.findByTestId('comment-replies-toggle'));
		expect(await screen.findByTestId('comment-replies-error')).toBeInTheDocument();
		expect(screen.getByText('replies boom')).toBeInTheDocument();

		await user.click(screen.getByTestId('comment-replies-retry'));
		expect(await screen.findByTestId('comment-replies-empty')).toBeInTheDocument();
		expect(getReplies).toHaveBeenCalledTimes(2);
	});

	it('loads more replies with the next cursor', async () => {
		const user = setupUser();
		const getReplies = vi
			.fn()
			.mockResolvedValueOnce({
				comments: [reply('r1', 'one')],
				nextCursor: 'rc1',
				total: 2,
			})
			.mockResolvedValueOnce({
				comments: [reply('r2', 'two')],
				nextCursor: null,
				total: 2,
			});
		const service = makeService({ getComments: rootThread(), getReplies });

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await user.click(await screen.findByTestId('comment-replies-toggle'));

		await user.click(await screen.findByTestId('comment-replies-load-more'));

		expect(await screen.findAllByTestId('comment-item')).toHaveLength(3);
		expect(getReplies).toHaveBeenCalledTimes(2);
		expect(getReplies).toHaveBeenLastCalledWith(
			'c1',
			expect.objectContaining({ cursor: 'rc1', limit: 50 })
		);
		expect(screen.queryByTestId('comment-replies-load-more')).not.toBeInTheDocument();
	});
});

describe('CommentThread — attachments', () => {
	const empty = () => vi.fn().mockResolvedValue({ comments: [], nextCursor: null, total: 0 });

	it('renders attachment cards and downloads through the service', async () => {
		const user = setupUser();
		URL.createObjectURL = vi.fn(() => 'blob:mock');
		URL.revokeObjectURL = vi.fn();
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		const downloadAttachment = vi.fn().mockResolvedValue(new Blob(['x']));
		const service = makeService({
			getComments: vi.fn().mockResolvedValue({
				comments: [
					comment('c1', 'see file', {
						attachments: [
							{
								id: 'a1',
								fileName: 'plan.pdf',
								contentType: 'application/pdf',
								byteSize: 2048,
								state: 'attached',
							},
						],
					}),
				],
				nextCursor: null,
				total: 1,
			}),
			downloadAttachment,
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);

		expect(await screen.findByText('plan.pdf')).toBeInTheDocument();
		await user.click(screen.getByTestId('comment-attachment-download'));

		expect(downloadAttachment).toHaveBeenCalledWith('a1');
		expect(click).toHaveBeenCalled();
		click.mockRestore();
	});

	it('sends uploaded attachment ids when creating a comment', async () => {
		const user = setupUser();
		const createComment = vi.fn().mockResolvedValue(comment('c9', 'with file'));
		const service = makeService({
			getComments: empty(),
			createComment,
			uploadAttachment: vi.fn().mockResolvedValue({
				id: 'a1',
				fileName: 'a.pdf',
				contentType: 'application/pdf',
				byteSize: 3,
				state: 'ready',
			}),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await screen.findByTestId('comment-empty');

		await user.upload(
			screen.getByTestId('comment-attach-input'),
			new File(['abc'], 'a.pdf', { type: 'application/pdf' })
		);
		await screen.findByText('a.pdf');
		await user.type(screen.getByTestId('comment-composer-input'), 'with file');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(createComment).toHaveBeenCalledWith(
			expect.objectContaining({ text: 'with file', attachmentIds: ['a1'] })
		);
	});

	it('sends the ids of mentioned people when creating a comment', async () => {
		const user = setupUser();
		const createComment = vi.fn().mockResolvedValue(comment('c9', 'hi <@u-ada>'));
		const service = makeService({
			getComments: empty(),
			createComment,
			getParticipants: vi
				.fn()
				.mockResolvedValue([{ id: 'u-ada', displayName: 'Ada Okafor', isViewer: false }]),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await screen.findByTestId('comment-empty');

		await user.type(screen.getByTestId('comment-composer-input'), 'hi @ad');
		await screen.findByRole('option', { name: 'Ada Okafor' });
		await user.keyboard('{Enter}');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(createComment).toHaveBeenCalledWith(
			expect.objectContaining({ text: 'hi <@u-ada>', mentionedUserIds: ['u-ada'] })
		);
	});

	it('sends the ids of people still mentioned after an edit', async () => {
		const user = setupUser();
		const updateComment = vi.fn().mockResolvedValue(comment('c1', 'hi <@u-ada> again'));
		const service = makeService({
			getComments: vi.fn().mockResolvedValue({
				comments: [
					comment('c1', 'hi <@u-ada>', {
						mentions: [{ id: 'u-ada', displayName: 'Ada Okafor', isDeleted: false }],
					}),
				],
				nextCursor: null,
				total: 1,
			}),
			updateComment,
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await user.click(await screen.findByRole('button', { name: 'comments.edit' }));
		await user.type(screen.getByTestId('comment-edit-input'), ' again');
		await user.click(screen.getByTestId('comment-edit-save'));

		expect(updateComment).toHaveBeenCalledWith(
			'c1',
			expect.objectContaining({ text: 'hi <@u-ada> again', mentionedUserIds: ['u-ada'] })
		);
	});

	it('keeps the draft when creating a comment fails', async () => {
		const user = setupUser();
		const service = makeService({
			getComments: empty(),
			createComment: vi.fn().mockRejectedValue(new Error('boom')),
		});

		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={service} />);
		await screen.findByTestId('comment-empty');

		const input = screen.getByTestId('comment-composer-input') as HTMLTextAreaElement;
		await user.type(input, 'keep me');
		await user.click(screen.getByTestId('comment-composer-submit'));

		expect(service.createComment).toHaveBeenCalledTimes(1);
		expect(input.value).toBe('keep me');
	});
});
