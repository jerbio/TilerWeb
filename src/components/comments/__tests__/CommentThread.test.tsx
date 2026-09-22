import { describe, it, expect, vi } from 'vitest';
import { render, screen, setupUser } from '@/test/test-utils';
import CommentThread from '../CommentThread';
import CommentsService from '@/services/commentsService';

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

const comment = (id: string, text: string) => ({
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
	hasReplies: false,
});

const makeService = (impl: {
	getComments: ReturnType<typeof vi.fn>;
	createComment?: ReturnType<typeof vi.fn>;
	updateComment?: ReturnType<typeof vi.fn>;
	deleteComment?: ReturnType<typeof vi.fn>;
}) =>
	({
		getComments: impl.getComments,
		createComment: impl.createComment ?? vi.fn(),
		updateComment: impl.updateComment ?? vi.fn(),
		deleteComment: impl.deleteComment ?? vi.fn(),
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
