import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { setupUser } from '@/test/test-utils';
import TileshareCreate, { TileshareMode } from '../TileshareCreate';
import { tileshareService } from '@/services';

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

const { showNotification, updateNotification } = vi.hoisted(() => ({
	showNotification: vi.fn(),
	updateNotification: vi.fn(),
}));

vi.mock('@/core/ui', () => ({
	useUiStore: (selector: (s: unknown) => unknown) =>
		selector({ notification: { show: showNotification, update: updateNotification } }),
	notificationId: () => 'create-tileshare-cluster',
	NotificationAction: { CreateTileshare: 'create-tileshare' },
}));

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
	beforeEach(() => {
		createCluster.mockReset();
		createCluster.mockResolvedValue({ cluster: { id: 'cluster-1' } });
		showNotification.mockReset();
		updateNotification.mockReset();
	});

	it('renders the single-mode copy, shared fields and the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

		expect(screen.getByText('tilesharedemo.dashboard.create.single.title')).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.single.description')
		).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.single.submit')
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).toBeInTheDocument();
	});

	it('renders the multi-mode copy and omits the share-to field', () => {
		render(<TileshareCreate mode={TileshareMode.Multi} onBack={vi.fn()} />);

		expect(screen.getByText('tilesharedemo.dashboard.create.multi.title')).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.dashboard.create.multi.description')
		).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.dashboard.create.multi.submit')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder')
		).toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder')
		).not.toBeInTheDocument();
	});

	it('adds multiple recipients as chips and removes them', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

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
		render(<TileshareCreate mode={TileshareMode.Single} onBack={onBack} />);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.back'));
		await user.click(screen.getByText('tilesharedemo.dashboard.create.buttons.cancel'));

		expect(onBack).toHaveBeenCalledTimes(2);
	});

	it('blocks submit and shows an error notification when required fields are empty', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.single.submit'));

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
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		await user.type(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			'2026-08-01'
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'not-an-email{Enter}'
		);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.single.submit'));

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
		render(<TileshareCreate mode={TileshareMode.Single} onBack={onBack} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		await user.type(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			'2026-08-01'
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'jane@example.com{Enter}'
		);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.single.submit'));

		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(1));
		expect(createCluster).toHaveBeenCalledWith(
			expect.objectContaining({
				Name: 'Finish taxes',
				IsMultiTilette: false,
				IncludeMe: true,
				UserName: 'me@example.com',
				Contacts: [{ Email: 'jane@example.com' }],
				EndTime: expect.any(Number),
			})
		);
		await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
	});

	it('normalizes a bare phone recipient with the default calling code on submit', async () => {
		const user = setupUser();
		render(<TileshareCreate mode={TileshareMode.Single} onBack={vi.fn()} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Finish taxes'
		);
		await user.type(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			'2026-08-01'
		);
		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.shareTo.placeholder'),
			'3035551212{Enter}'
		);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.single.submit'));

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
		render(<TileshareCreate mode={TileshareMode.Multi} onBack={onBack} />);

		await user.type(
			screen.getByPlaceholderText('tilesharedemo.dashboard.create.fields.name.placeholder'),
			'Product launch prep'
		);
		await user.type(
			screen.getByPlaceholderText(
				'tilesharedemo.dashboard.create.fields.deadline.placeholder'
			),
			'2026-08-01'
		);

		await user.click(screen.getByText('tilesharedemo.dashboard.create.multi.submit'));

		await waitFor(() => expect(createCluster).toHaveBeenCalledTimes(1));
		expect(createCluster).toHaveBeenCalledWith(
			expect.objectContaining({
				Name: 'Product launch prep',
				IsMultiTilette: true,
				Contacts: [],
				EndTime: expect.any(Number),
			})
		);
		await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
	});
});
