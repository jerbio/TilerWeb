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
			t: (key: string, opts?: { count?: number }) =>
				opts?.count !== undefined ? `${key}:${opts.count}` : key,
		}),
	};
});

const todayAt = (hours: number, minutes: number) => {
	const d = new Date();
	d.setHours(hours, minutes, 0, 0);
	return d.getTime();
};

const root = (overrides: Partial<CommentView> = {}): CommentView => ({
	id: 'c1',
	targetType: 'tileshare_tilette',
	targetId: 't',
	author: {
		id: 'u-ada',
		displayName: 'Ada Okafor',
		isOwner: false,
		isDeleted: false,
		isViewer: false,
	},
	text: 'Morning team! Please review <@u-tunde>.',
	createdAt: todayAt(7, 15),
	editedAt: null,
	deletedAt: null,
	isDeleted: false,
	canEdit: false,
	canDelete: false,
	rootCommentId: null,
	isReply: false,
	hasReplies: true,
	replyCount: 8,
	attachments: [],
	mentions: [{ id: 'u-tunde', displayName: 'Tunde Adebayo', isDeleted: false }],
	replyAuthors: [
		{ id: 'u-kemi', displayName: 'Kemi Balogun', isDeleted: false },
		{ id: 'u-chuks', displayName: 'Chuks Nnamdi', isDeleted: false },
	],
	...overrides,
});

const service = (comments: CommentView[], extra: Partial<Record<string, unknown>> = {}) =>
	({
		getComments: vi
			.fn()
			.mockResolvedValue({ comments, nextCursor: null, total: comments.length }),
		getReplies: vi.fn().mockResolvedValue({ comments: [], nextCursor: null, total: 0 }),
		getParticipants: vi.fn().mockResolvedValue([
			{ id: 'u-tunde', displayName: 'Tunde Adebayo', isViewer: true },
			{ id: 'u-ada', displayName: 'Ada Okafor', isViewer: false },
		]),
		createComment: vi.fn(),
		updateComment: vi.fn(),
		deleteComment: vi.fn(),
		uploadAttachment: vi.fn(),
		deleteAttachment: vi.fn(),
		downloadAttachment: vi.fn(),
		...extra,
	}) as unknown as CommentsService;

describe('CommentThread — layout', () => {
	it('renders an avatar, the author name, the time and a highlighted mention', async () => {
		render(
			<CommentThread
				targetType="tileshare_tilette"
				targetId="t"
				service={service([root()])}
			/>
		);

		const item = await screen.findByTestId('comment-item');
		expect(within(item).getAllByTestId('comment-avatar')[0]).toHaveTextContent('AO');
		expect(within(item).getByText('Ada Okafor')).toBeInTheDocument();
		expect(within(item).getByText('7:15 AM')).toBeInTheDocument();
		const mention = within(item).getByTestId('comment-mention');
		expect(mention).toHaveTextContent('@Tunde Adebayo');
		expect(within(item).getByTestId('comment-text')).toHaveTextContent(
			'Morning team! Please review @Tunde Adebayo.'
		);
	});

	it("labels the viewer's own comments", async () => {
		render(
			<CommentThread
				targetType="tileshare_tilette"
				targetId="t"
				service={service([
					root({
						author: {
							id: 'u-tunde',
							displayName: 'Tunde Adebayo',
							isOwner: false,
							isDeleted: false,
							isViewer: true,
						},
					}),
				])}
			/>
		);

		expect(await screen.findByText('comments.you')).toBeInTheDocument();
	});

	it('summarises replies with stacked author avatars and the reply count', async () => {
		render(
			<CommentThread
				targetType="tileshare_tilette"
				targetId="t"
				service={service([root()])}
			/>
		);

		const toggle = await screen.findByTestId('comment-replies-toggle');
		expect(toggle).toHaveTextContent('comments.replies:8');
		expect(
			within(toggle)
				.getAllByTestId('comment-avatar')
				.map((a) => a.textContent)
		).toEqual(['KB', 'CN']);
	});

	it('shows a neutral mention for a deleted person', async () => {
		render(
			<CommentThread
				targetType="tileshare_tilette"
				targetId="t"
				service={service([
					root({ mentions: [{ id: 'u-tunde', displayName: null, isDeleted: true }] }),
				])}
			/>
		);

		expect(await screen.findByTestId('comment-mention')).toHaveTextContent(
			'@comments.deletedAuthor'
		);
	});

	it('offers loaded participants in the composer mention picker', async () => {
		const user = setupUser();
		const svc = service([]);
		render(<CommentThread targetType="tileshare_tilette" targetId="t" service={svc} />);
		await screen.findByTestId('comment-empty');

		await user.type(screen.getByTestId('comment-composer-input'), '@a');

		expect(svc.getParticipants).toHaveBeenCalledWith({
			targetType: 'tileshare_tilette',
			targetId: 't',
		});
		expect(await screen.findByRole('option', { name: 'Ada Okafor' })).toBeInTheDocument();
	});
});
