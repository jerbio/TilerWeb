import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/test-utils';
import { setupUser } from '@/test/test-utils';
import TileshareCreate, { TileshareMode } from '../TileshareCreate';
import { tileshareService } from '@/services';
import dayjs from 'dayjs';

vi.mock('@/core/theme/ThemeProvider', () => ({
	useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('react-i18next', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-i18next')>();
	return {
		...actual,
		useTranslation: () => ({ t: (key: string) => key }),
	};
});

vi.mock('@/services', () => ({
	tileshareService: { createCluster: vi.fn() },
}));

vi.mock('@/core/auth/useAuth', () => ({
	useAuth: () => ({
		user: { email: 'me@example.com', timeZone: 'UTC', timeZoneDifference: 0 },
	}),
}));

const { showNotification, updateNotification, dismissNotification } = vi.hoisted(() => ({
	showNotification: vi.fn(),
	updateNotification: vi.fn(),
	dismissNotification: vi.fn(),
}));

vi.mock('@/core/ui', () => ({
	useUiStore: (selector: (s: unknown) => unknown) =>
		selector({
			notification: {
				show: showNotification,
				update: updateNotification,
				dismiss: dismissNotification,
			},
		}),
	notificationId: () => 'create-tileshare-cluster',
	NotificationAction: { CreateTileshare: 'create-tileshare' },
}));

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router')>();
	return { ...actual, useNavigate: () => navigateMock };
});

// Replace the calendar DatePicker with a plain input so the date value can be typed.
vi.mock('@/core/common/components/date_picker', () => ({
	default: ({
		value,
		onChange,
		placeholder,
	}: {
		value: string;
		onChange: (v: string) => void;
		placeholder?: string;
	}) => (
		<input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
	),
}));

const createCluster = tileshareService.createCluster as Mock;

describe('TileshareCreate', () => {
	const fillSetup = (mode = TileshareMode.Project) => {
		render(<TileshareCreate mode={mode} onBack={vi.fn()} />);
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			{ target: { value: 'Launch' } }
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			{ target: { value: '2026-12-01' } }
		);
	};
	const openWorkspace = () => fireEvent.click(screen.getByText('tileShareModes.addTilettesNow'));
	const addTask = (name: string) => {
		fireEvent.click(
			screen.queryByRole('button', { name: 'tileShareModes.addTilette' }) ??
				screen.getByRole('button', { name: 'tileShareComposer.newTilette' })
		);
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
			{ target: { value: name } }
		);
		fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
	};
	it('prefills a seven day share deadline', () => {
		render(<TileshareCreate mode={TileshareMode.Project} onBack={vi.fn()} />);
		expect(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			)
		).toHaveValue(dayjs().add(7, 'day').format('YYYY-MM-DD'));
	});
	it('preserves tasks through Edit details and sends one final create request', async () => {
		fillSetup();
		openWorkspace();
		addTask('Draft announcement');
		expect(createCluster).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('tileShareComposer.editDetails'));
		fireEvent.click(screen.getByText('tileShareComposer.reviewTilettes'));
		expect(screen.getByText('Draft announcement')).toBeInTheDocument();
		fireEvent.click(screen.getByText('tileShareModes.project.submit'));
		await waitFor(() => expect(createCluster).toHaveBeenCalledOnce());
		expect(createCluster.mock.calls[0][0]).toMatchObject({
			Mode: 'project',
			ClusterTemplateTileModels: [
				{ Name: 'Draft announcement', DurationInMs: 3600000, Contacts: [] },
			],
		});
	});
	it('retains the draft workspace after a failed create', async () => {
		createCluster.mockRejectedValue(new Error('offline'));
		fillSetup();
		openWorkspace();
		addTask('Keep this work');
		fireEvent.click(screen.getByText('tileShareModes.project.submit'));
		await waitFor(() =>
			expect(updateNotification).toHaveBeenCalledWith(
				expect.any(String),
				'tilesharedemo.dashboard.create.toast.error',
				'error'
			)
		);
		expect(screen.getByText('Keep this work')).toBeInTheDocument();
		fireEvent.click(screen.getByText('tileShareModes.project.submit'));
		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(2));
	});
	it('validates the task before adding a card', () => {
		fillSetup();
		openWorkspace();
		fireEvent.click(screen.getByText('tileShareModes.addTilette'));
		fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
		expect(screen.getByRole('alert')).toHaveTextContent(
			'tilesharedemo.detail.add.validation.nameRequired'
		);
		expect(createCluster).not.toHaveBeenCalled();
		expect(screen.queryByRole('article')).not.toBeInTheDocument();
	});
	it('edits, reorders, and removes draft tasks before submitting', async () => {
		fillSetup();
		openWorkspace();
		expect(
			screen.getByRole('button', { name: 'tileShareModes.addTilette' })
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'tileShareComposer.newTilette' })
		).not.toBeInTheDocument();
		addTask('First');
		expect(
			screen.queryByRole('button', { name: 'tileShareModes.addTilette' })
		).not.toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'tileShareComposer.newTilette' })
		).toBeInTheDocument();
		addTask('Second');
		fireEvent.click(screen.getAllByLabelText('tileShareModes.moveUp')[1]);
		fireEvent.click(screen.getAllByLabelText('tileShareComposer.editTilette')[0]);
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
			{ target: { value: 'Updated second' } }
		);
		fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
		fireEvent.click(screen.getAllByLabelText('tileShareComposer.removeTilette')[1]);
		fireEvent.click(screen.getByText('tileShareModes.project.submit'));
		await waitFor(() => expect(createCluster).toHaveBeenCalledOnce());
		expect(createCluster.mock.calls[0][0].ClusterTemplateTileModels).toMatchObject([
			{ Name: 'Updated second', OrderedIndex: 0 },
		]);
	});
	it('confirms dirty modal close and keeps the other saved tasks', () => {
		fillSetup();
		openWorkspace();
		addTask('Saved task');
		fireEvent.click(screen.getByText('tileShareComposer.newTilette'));
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
			{ target: { value: 'Unsaved task' } }
		);
		fireEvent.click(screen.getByText('tilesharedemo.detail.add.cancel'));
		fireEvent.click(screen.getByText('tileShareComposer.keepEditing'));
		expect(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder')
		).toHaveValue('Unsaved task');
		fireEvent.click(screen.getByText('tilesharedemo.detail.add.cancel'));
		fireEvent.click(screen.getByText('tileShareComposer.discard'));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByText('Saved task')).toBeInTheDocument();
	});
	it.each([false, true])(
		'permits a later deadline with moving the share set to %s',
		async (move) => {
			fillSetup();
			openWorkspace();
			fireEvent.click(screen.getByText('tileShareModes.addTilette'));
			expect(
				screen.getByPlaceholderText('tilesharedemo.detail.add.fields.deadline.placeholder')
			).toHaveValue('2026-12-01');
			fireEvent.change(
				screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
				{ target: { value: 'Later task' } }
			);
			fireEvent.change(
				screen.getByPlaceholderText('tilesharedemo.detail.add.fields.deadline.placeholder'),
				{ target: { value: '2026-12-10' } }
			);
			if (move) fireEvent.click(screen.getByRole('checkbox'));
			fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
			fireEvent.click(screen.getByText('tileShareModes.project.submit'));
			await waitFor(() => expect(createCluster).toHaveBeenCalledOnce());
			const payload = createCluster.mock.calls[0][0];
			if (move) expect(payload.EndTime).toBe(payload.ClusterTemplateTileModels[0].EndTime);
			else expect(payload.EndTime).toBeLessThan(payload.ClusterTemplateTileModels[0].EndTime);
		}
	);
	it('uses direct location input and leaves a blank task location unset', async () => {
		fillSetup();
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.location.placeholder'
			),
			{ target: { value: 'Office' } }
		);
		openWorkspace();
		fireEvent.click(screen.getByText('tileShareModes.addTilette'));
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
		expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
			{ target: { value: 'Remote work' } }
		);
		fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
		fireEvent.click(screen.getByText('tileShareModes.project.submit'));
		await waitFor(() => expect(createCluster).toHaveBeenCalledOnce());
		expect(createCluster.mock.calls[0][0].AddressData).toMatchObject({
			Address: 'Office',
			AddressIsVerified: false,
		});
		expect(
			createCluster.mock.calls[0][0].ClusterTemplateTileModels[0].AddressData
		).toBeUndefined();
	});
	it('assigns Class tasks to the share participants without task-level assignees', async () => {
		fillSetup(TileshareMode.Class);
		const contacts = screen.getByPlaceholderText(
			'tilesharedemo.dashboard.create.shareTo.placeholder'
		);
		fireEvent.change(contacts, { target: { value: 'alice@example.com' } });
		fireEvent.keyDown(contacts, { key: 'Enter' });
		openWorkspace();
		fireEvent.click(screen.getByText('tileShareModes.addTilette'));
		expect(
			screen.queryByPlaceholderText('tilesharedemo.detail.add.shareTo.placeholder')
		).not.toBeInTheDocument();
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder'),
			{ target: { value: 'Lesson' } }
		);
		fireEvent.click(screen.getByText('tileShareComposer.saveTilette'));
		fireEvent.click(screen.getByText('tileShareModes.class.submit'));
		await waitFor(() => expect(createCluster).toHaveBeenCalledOnce());
		expect(createCluster.mock.calls[0][0].ClusterTemplateTileModels[0].Contacts).toEqual([
			{ Email: 'alice@example.com' },
		]);
	});
	it('prompts before leaving a dirty share and permits keeping the draft', () => {
		const onBack = vi.fn();
		render(<TileshareCreate mode={TileshareMode.Project} onBack={onBack} />);
		fireEvent.change(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			{ target: { value: 'Launch' } }
		);
		fireEvent.click(screen.getByText('tilesharedemo.dashboard.create.buttons.cancel'));
		expect(onBack).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('tileShareComposer.keepEditing'));
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toHaveValue('Launch');
		fireEvent.click(screen.getByText('tilesharedemo.dashboard.create.back'));
		fireEvent.click(screen.getByText('tileShareComposer.discard'));
		expect(onBack).toHaveBeenCalledOnce();
		expect(createCluster).not.toHaveBeenCalled();
	});
	beforeEach(() => {
		createCluster.mockReset();
		createCluster.mockResolvedValue({ id: 'cluster-1', name: 'Finish taxes' });
		showNotification.mockReset();
		updateNotification.mockReset();
		dismissNotification.mockReset();
		navigateMock.mockReset();
	});

	it('renders the single-mode copy, shared fields and the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={vi.fn()} />);

		expect(screen.getByText('tileShareModes.broadcast.title')).toBeInTheDocument();
		expect(screen.getByText('tileShareModes.broadcast.description')).toBeInTheDocument();
		expect(screen.getByText('tileShareModes.broadcast.submit')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).toBeInTheDocument();
	});

	it('renders the multi-mode copy and omits the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Project} onBack={vi.fn()} />);

		expect(screen.getByText('tileShareModes.project.title')).toBeInTheDocument();
		expect(screen.getByText('tileShareModes.project.description')).toBeInTheDocument();
		expect(screen.getByText('tileShareModes.project.submit')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).not.toBeInTheDocument();
	});

	it('adds multiple recipients as chips and removes them', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={vi.fn()} />);

		const recipientInput = screen.getByPlaceholderText(
			'tilesharedemo.dashboard.create.shareTo.placeholder'
		);
		const addButton = screen.getByLabelText('tilesharedemo.dashboard.create.shareTo.add');

		await user.type(recipientInput, 'jane@example.com');
		await user.click(addButton);
		await user.type(recipientInput, 'sam@example.com{Enter}');

		expect(screen.getByText('jane@example.com')).toBeInTheDocument();
		expect(screen.getByText('sam@example.com')).toBeInTheDocument();
		// Input is cleared after each add.
		expect(recipientInput).toHaveValue('');

		// Both remove buttons share the label under the identity-t mock; the first is jane's.
		await user.click(
			screen.getAllByLabelText('tilesharedemo.dashboard.create.shareTo.remove')[0]
		);

		expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
		expect(screen.getByText('sam@example.com')).toBeInTheDocument();
	});

	it('calls onBack from both the back button and the cancel button', async () => {
		const user = setupUser();
		const onBack = vi.fn();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={onBack} />);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.back'));
		await user.click(screen.getByText('tilesharedemo.dashboard.create.buttons.cancel'));

		expect(onBack).toHaveBeenCalledTimes(2);
	});

	it('blocks submit and shows an error notification when required fields are empty', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={vi.fn()} />);

		await user.click(screen.getByText('tileShareModes.broadcast.submit'));

		expect(showNotification).toHaveBeenCalledWith(
			expect.any(String),
			'tilesharedemo.dashboard.create.validation.nameRequired',
			'error'
		);
		// No inline error text is rendered under the fields.
		expect(
			screen.queryByText('tilesharedemo.dashboard.create.validation.nameRequired')
		).not.toBeInTheDocument();
		expect(createCluster).not.toHaveBeenCalled();
	});

	it('blocks submit with an error notification when a recipient is invalid', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={vi.fn()} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			{ target: { value: '2026-08-01' } }
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'not-an-email{Enter}'
		);

		await user.click(screen.getByText('tileShareModes.broadcast.submit'));

		expect(showNotification).toHaveBeenCalledWith(
			expect.any(String),
			'tilesharedemo.dashboard.create.validation.invalidRecipient',
			'error'
		);
		expect(createCluster).not.toHaveBeenCalled();
	});

	it('submits a mapped single-mode payload and returns to the dashboard on success', async () => {
		const user = setupUser();
		const onBack = vi.fn();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={onBack} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			{ target: { value: '2026-08-01' } }
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'jane@example.com{Enter}'
		);
		expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
		await user.click(screen.getByText('tileShareModes.broadcast.submit'));

		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(1));
		expect(createCluster).toHaveBeenCalledWith(
			expect.objectContaining({
				Name: 'Finish taxes',
				DurationInMs: 3600000,
				IsMultiTilette: false,
				IncludeMe: true,
				UserName: 'me@example.com',
				Contacts: [{ Email: 'jane@example.com' }],
				EndTime: expect.any(Number),
			})
		);

		// Success modal appears (not onBack); closing it redirects to the detail page.
		const viewAction = await screen.findByText('tilesharedemo.dashboard.create.success.view');
		expect(onBack).not.toHaveBeenCalled();
		await user.click(viewAction);
		expect(navigateMock).toHaveBeenCalledWith('/tileshare/cluster-1');
	});

	it('normalizes a bare phone recipient with the default calling code on submit', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Broadcast} onBack={vi.fn()} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			{ target: { value: '2026-08-01' } }
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'3035551212{Enter}'
		);

		await user.click(screen.getByText('tileShareModes.broadcast.submit'));

		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(1));
		expect(createCluster).toHaveBeenCalledWith(
			expect.objectContaining({
				Contacts: [{ PhoneNumber: '+13035551212' }],
			})
		);
	});

	it('submits a multi-mode payload with IsMultiTilette and empty contacts', async () => {
		const user = setupUser();
		const onBack = vi.fn();
		render(<TileshareCreate mode={TileshareMode.Project} onBack={onBack} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Product launch prep'
		);
		fireEvent.change(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			{ target: { value: '2026-08-01' } }
		);

		await user.click(screen.getByText('tileShareModes.project.submit'));

		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(1));
		expect(createCluster).toHaveBeenCalledWith(
			expect.objectContaining({
				Name: 'Product launch prep',
				IsMultiTilette: true,
				Contacts: [],
				EndTime: expect.any(Number),
			})
		);

		const viewAction = await screen.findByText('tilesharedemo.dashboard.create.success.view');
		expect(onBack).not.toHaveBeenCalled();
		await user.click(viewAction);
		expect(navigateMock).toHaveBeenCalledWith('/tileshare/cluster-1');
	});
});
