import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import ClassShareActions from '../ClassShareActions';
import { TileShareTemplate } from '@/core/common/types/tileshare';

const mocks = vi.hoisted(() => ({ add: vi.fn(), remove: vi.fn(), respond: vi.fn() }));
vi.mock('@/services', () => ({
	tileshareService: { addTiletteRecipient: mocks.add, removeTiletteRecipient: mocks.remove },
}));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		respondToInvitation = mocks.respond;
	},
}));
vi.mock('@/core/auth/useAuth', () => ({
	useAuth: () => ({ user: { id: 'viewer', countryCode: '1' } }),
}));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
const tasks = ['first', 'second'].map(
	(id) => ({ id, designatedUsers: [] }) as unknown as TileShareTemplate
);
beforeEach(() => {
	vi.clearAllMocks();
	mocks.add.mockResolvedValue({});
	mocks.remove.mockResolvedValue({});
	mocks.respond.mockResolvedValue({});
});
describe('Class changes', () => {
	it('adds someone to all tilettes and retries only failed additions', async () => {
		mocks.add.mockImplementation((id: string) =>
			id === 'second' && mocks.add.mock.calls.length < 3
				? Promise.reject(new Error('offline'))
				: Promise.resolve({})
		);
		render(
			<ClassShareActions
				tilettes={tasks}
				isOwner
				onChanged={vi.fn().mockResolvedValue(undefined)}
			/>
		);
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'person@example.com' },
		});
		fireEvent.click(screen.getByText('Add to all tilettes'));
		await screen.findByText('Retry remaining changes');
		expect(mocks.add.mock.calls.map((call) => call[0])).toEqual(['first', 'second']);
		fireEvent.click(screen.getByText('Retry remaining changes'));
		await waitFor(() => expect(mocks.add).toHaveBeenCalledTimes(3));
		expect(mocks.add.mock.calls.map((call) => call[0])).toEqual(['first', 'second', 'second']);
	});
	it('skips tasks that already include a participant', async () => {
		const assigned = {
			...tasks[0],
			designatedUsers: [
				{
					userId: 'person',
					displayedIdentifier: 'person@example.com',
					designatedTileTemplateId: 'assignment',
					userProfile: null,
				},
			],
		} as TileShareTemplate;
		render(
			<ClassShareActions
				tilettes={[assigned, tasks[1]]}
				isOwner
				onChanged={vi.fn().mockResolvedValue(undefined)}
			/>
		);
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'person@example.com' },
		});
		fireEvent.click(screen.getByText('Add to all tilettes'));
		await waitFor(() =>
			expect(mocks.add).toHaveBeenCalledExactlyOnceWith('second', {
				Email: 'person@example.com',
			})
		);
	});
	it('answers only the viewer’s pending assignments in a Class', async () => {
		const assigned = {
			...tasks[0],
			designatedUsers: [
				{ userId: 'viewer', designatedTileTemplateId: 'pending', rsvpStatus: 'none' },
				{ userId: 'other', designatedTileTemplateId: 'other', rsvpStatus: 'none' },
			],
		} as TileShareTemplate;
		const accepted = {
			...tasks[1],
			designatedUsers: [
				{ userId: 'viewer', designatedTileTemplateId: 'accepted', rsvpStatus: 'accepted' },
			],
		} as TileShareTemplate;
		render(
			<ClassShareActions
				tilettes={[assigned, accepted]}
				isOwner={false}
				onChanged={vi.fn().mockResolvedValue(undefined)}
			/>
		);
		fireEvent.click(screen.getByText('Accept all pending tilettes'));
		await waitFor(() =>
			expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('pending', 'accepted')
		);
	});
});
