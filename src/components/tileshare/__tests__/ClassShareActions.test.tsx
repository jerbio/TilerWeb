import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@/test/test-utils';
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
	useTranslation: () => ({
		t: (key: string, fallback?: string, options?: Record<string, unknown>) => {
			let text = fallback ?? key;
			for (const [name, value] of Object.entries(options ?? {}))
				text = text.split(`{{${name}}}`).join(String(value));
			return text;
		},
	}),
}));
const tasks = ['first', 'second'].map(
	(id) => ({ id, designatedUsers: [] }) as unknown as TileShareTemplate
);
const assignedTasks = tasks.map((task) => ({
	...task,
	designatedUsers: [
		{
			userId: 'person',
			displayedIdentifier: 'person@example.com',
			designatedTileTemplateId: `${task.id}-assignment`,
		},
	],
})) as TileShareTemplate[];
beforeEach(() => {
	vi.clearAllMocks();
	mocks.add.mockResolvedValue({});
	mocks.remove.mockResolvedValue({});
	mocks.respond.mockResolvedValue({});
});
describe('Class changes', () => {
	it('reviews removal scope and allows cancellation before any write', () => {
		render(<ClassShareActions tilettes={assignedTasks} isOwner onChanged={vi.fn()} />);
		fireEvent.click(
			screen.getAllByRole('button', { name: 'Remove from existing tilettes' })[0]
		);
		expect(
			screen.getByText(
				'Remove person@example.com from existing tilettes? Assignments: 2. Their linked calendar work for these assignments will be disabled.'
			)
		).toBeInTheDocument();
		expect(mocks.remove).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(mocks.remove).not.toHaveBeenCalled();
	});
	it('shows removal progress and partial results, then retries only failed assignments', async () => {
		let finish!: () => void;
		mocks.remove
			.mockImplementationOnce(
				() =>
					new Promise<void>((resolve) => {
						finish = resolve;
					})
			)
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({});
		render(
			<ClassShareActions
				tilettes={assignedTasks}
				isOwner
				onChanged={vi.fn().mockResolvedValue(undefined)}
			/>
		);
		fireEvent.click(
			screen.getAllByRole('button', { name: 'Remove from existing tilettes' })[0]
		);
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		expect(
			screen.getByRole('progressbar', { name: 'Participant removal progress' })
		).toHaveAttribute('value', '0');
		expect(screen.getByLabelText('Participant email or phone')).toBeDisabled();
		await act(async () => finish());
		await screen.findByText(
			'person@example.com — assignments removed: 1; removals to retry: 1.'
		);
		fireEvent.click(screen.getByRole('button', { name: 'Retry remaining changes' }));
		await screen.findByText('person@example.com removed. Assignments removed: 2.');
		expect(mocks.remove.mock.calls).toEqual([
			['first', 'first-assignment'],
			['second', 'second-assignment'],
			['second', 'second-assignment'],
		]);
		fireEvent.click(
			within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[1]
		);
		expect(screen.getByRole('status')).toHaveTextContent(
			'person@example.com removed. Assignments removed: 2.'
		);
	});
	it('retains a refresh failure when retrying an unfinished removal also fails', async () => {
		mocks.remove.mockResolvedValueOnce({}).mockRejectedValue(new Error('offline'));
		const refresh = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(undefined);
		render(<ClassShareActions tilettes={assignedTasks} isOwner onChanged={refresh} />);
		fireEvent.click(
			screen.getAllByRole('button', { name: 'Remove from existing tilettes' })[0]
		);
		fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
		await screen.findByText('Saved, but couldn’t refresh');
		fireEvent.click(screen.getByRole('button', { name: 'Retry remaining changes' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
		expect(screen.getByText('Saved, but couldn’t refresh')).toBeInTheDocument();
		expect(refresh).toHaveBeenCalledOnce();
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await waitFor(() =>
			expect(screen.queryByText('Saved, but couldn’t refresh')).not.toBeInTheDocument()
		);
		expect(mocks.remove.mock.calls).toEqual([
			['first', 'first-assignment'],
			['second', 'second-assignment'],
			['second', 'second-assignment'],
		]);
	});
	it('explains a roster participant without assignments without sending removals', () => {
		render(
			<ClassShareActions
				tilettes={tasks}
				participants={[{ Email: 'waiting@example.com' }]}
				isOwner
				onChanged={vi.fn()}
			/>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Remove from existing tilettes' }));
		expect(
			screen.getByText(
				'waiting@example.com has no assignments to remove from the existing tilettes.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Remove participant' })
		).not.toBeInTheDocument();
		expect(mocks.remove).not.toHaveBeenCalled();
	});
	it('announces a completed write after unmount and stops the rest of the old removal', async () => {
		let finish!: () => void;
		mocks.remove.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				})
		);
		const refresh = vi.fn();
		const changed = vi.fn();
		window.addEventListener('tileshare-changed', changed);
		try {
			const page = render(
				<ClassShareActions tilettes={assignedTasks} isOwner onChanged={refresh} />
			);
			fireEvent.click(
				screen.getAllByRole('button', { name: 'Remove from existing tilettes' })[0]
			);
			fireEvent.click(screen.getByRole('button', { name: 'Remove participant' }));
			page.unmount();
			await act(async () => finish());
			expect(mocks.remove).toHaveBeenCalledOnce();
			expect(changed).toHaveBeenCalledOnce();
			expect(refresh).not.toHaveBeenCalled();
		} finally {
			window.removeEventListener('tileshare-changed', changed);
		}
	});
	it('lets the owner correct the contact if none of the additions succeeded', async () => {
		mocks.add.mockRejectedValue(new Error('unavailable'));
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
		fireEvent.keyDown(screen.getByLabelText('Participant email or phone'), { key: 'Enter' });
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
		await screen.findByText('Couldn’t add person@example.com. Additions to retry: 2.');
		fireEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
		expect(screen.getByLabelText('Participant email or phone')).toBeEnabled();
		expect(screen.getByLabelText('Participant email or phone')).toHaveValue(
			'person@example.com'
		);
		expect(mocks.add).toHaveBeenCalledTimes(2);
	});
	it('reviews the recipient and affected tilettes before sending, and can cancel without changes', () => {
		render(<ClassShareActions tilettes={tasks} isOwner onChanged={vi.fn()} />);
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'person@example.com' },
		});
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		expect(
			screen.getByText('Add person@example.com to existing tilettes? Total: 2.')
		).toBeInTheDocument();
		expect(mocks.add).not.toHaveBeenCalled();
		fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		expect(screen.getByLabelText('Participant email or phone')).toHaveValue(
			'person@example.com'
		);
		expect(mocks.add).not.toHaveBeenCalled();
	});
	it('shows addition progress and a recipient-specific success result, then clears the contact', async () => {
		let resolve!: (value: object) => void;
		mocks.add.mockImplementationOnce(
			() =>
				new Promise((done) => {
					resolve = done;
				})
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
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
		expect(
			screen.getByRole('progressbar', { name: 'Participant addition progress' })
		).toHaveAttribute('value', '0');
		expect(screen.getByLabelText('Participant email or phone')).toBeDisabled();
		expect(
			within(screen.getByRole('dialog'))
				.getAllByRole('button', { name: 'Close' })
				.every((button) => button.hasAttribute('disabled'))
		).toBe(true);
		expect(mocks.add).toHaveBeenCalledTimes(1);
		await act(async () => resolve({}));
		await screen.findByText('person@example.com added. Tilettes updated: 2.');
		expect(screen.getByLabelText('Participant email or phone')).toHaveValue('');
		expect(mocks.add).toHaveBeenCalledTimes(2);
	});
	it('explains when someone already has every assignment instead of silently doing nothing', () => {
		const assigned = tasks.map((task) => ({
			...task,
			designatedUsers: [{ userId: 'person', displayedIdentifier: 'person@example.com' }],
		})) as TileShareTemplate[];
		const refresh = vi.fn();
		render(<ClassShareActions tilettes={assigned} isOwner onChanged={refresh} />);
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'person@example.com' },
		});
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		expect(
			screen.getByText(
				'person@example.com is already assigned to all existing tilettes. No changes are needed.'
			)
		).toBeInTheDocument();
		expect(
			within(screen.getByRole('dialog')).queryByRole('button', { name: 'Add participant' })
		).not.toBeInTheDocument();
		expect(mocks.add).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});
	it('distinguishes a saved addition from a refresh failure and retries only the refresh', async () => {
		const refresh = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(undefined);
		render(<ClassShareActions tilettes={tasks} isOwner onChanged={refresh} />);
		fireEvent.change(screen.getByLabelText('Participant email or phone'), {
			target: { value: 'person@example.com' },
		});
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
		await screen.findByText(
			'The participant list couldn’t refresh. Refresh it to check the latest assignments.'
		);
		expect(
			screen.getByText('person@example.com added. Tilettes updated: 2.')
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
		expect(mocks.add).toHaveBeenCalledTimes(2);
	});
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
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		expect(mocks.add).not.toHaveBeenCalled();
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
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
		fireEvent.click(screen.getByText('Add to all existing tilettes'));
		fireEvent.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Add participant' })
		);
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
		fireEvent.click(screen.getByRole('button', { name: 'Confirm response' }));
		await waitFor(() =>
			expect(mocks.respond).toHaveBeenCalledExactlyOnceWith('pending', 'accepted')
		);
	});
});
