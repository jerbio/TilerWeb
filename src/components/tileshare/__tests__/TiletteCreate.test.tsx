import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { useUiStore } from '@/core/ui';
import { Routes } from '@/core/constants/routes';
import TiletteCreate from '../TiletteCreate';

const navigate = vi.fn();
vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return { ...actual, useNavigate: () => navigate };
});

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { name?: string; recipient?: string }) => {
			const suffix = opts?.name ?? opts?.recipient;
			return suffix ? `${key}:${suffix}` : key;
		},
	}),
}));

vi.mock('@/core/auth/useAuth', () => ({
	useAuth: () => ({ user: { countryCode: '1' } }),
}));

const createTilette = vi.fn();
vi.mock('@/services', () => ({
	tileshareService: {
		createTilette: (...args: unknown[]) => createTilette(...args),
	},
}));

const renderForm = (props: Partial<React.ComponentProps<typeof TiletteCreate>> = {}) => {
	const onBack = vi.fn();
	const onCreated = vi.fn();
	render(
		<MemoryRouter>
			<ThemeProvider defaultTheme="dark">
				<TiletteCreate
					clusterId="cluster-1"
					clusterName="Design Sprint"
					onBack={onBack}
					onCreated={onCreated}
					{...props}
				/>
			</ThemeProvider>
		</MemoryRouter>
	);
	return { onBack, onCreated };
};

const nameInput = () =>
	screen.getByPlaceholderText('tilesharedemo.detail.add.fields.name.placeholder');
const shareToInput = () =>
	screen.getByPlaceholderText('tilesharedemo.detail.add.shareTo.placeholder');
const submit = () => screen.getByRole('button', { name: 'tilesharedemo.detail.add.submit' });

const notificationMessages = () => useUiStore.getState().notification.items.map((n) => n.message);

describe('TiletteCreate', () => {
	beforeEach(() => {
		createTilette.mockReset();
		navigate.mockReset();
		createTilette.mockResolvedValue({ id: 'tpl-1', name: 'Backend work' });
		useUiStore.getState().notification.clear();
	});

	it('names the parent cluster in the description', () => {
		renderForm();
		expect(
			screen.getByText('tilesharedemo.detail.add.description:Design Sprint')
		).toBeInTheDocument();
	});

	it('creates with ClusterId and the trimmed name', async () => {
		renderForm();

		fireEvent.change(nameInput(), { target: { value: '  Backend work  ' } });
		fireEvent.click(submit());

		await waitFor(() => expect(createTilette).toHaveBeenCalledOnce());
		expect(createTilette).toHaveBeenCalledWith(
			expect.objectContaining({ ClusterId: 'cluster-1', Name: 'Backend work' })
		);
	});

	// Success is a modal, not a toast — matching the tileshare create flow.
	it('confirms with the success modal rather than a success toast', async () => {
		const { onCreated } = renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.click(submit());

		await waitFor(() =>
			expect(
				screen.getByText('tilesharedemo.detail.add.success.message:Backend work')
			).toBeInTheDocument()
		);
		// The loading toast is dismissed, and no success toast replaces it.
		expect(notificationMessages()).toEqual([]);
		// The form stays put until the modal is closed.
		expect(onCreated).not.toHaveBeenCalled();
	});

	it('opens the new tilette when the success modal is closed', async () => {
		renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.click(submit());
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'tilesharedemo.detail.add.success.view' })
			).toBeInTheDocument()
		);

		fireEvent.click(
			screen.getByRole('button', { name: 'tilesharedemo.detail.add.success.view' })
		);

		expect(navigate).toHaveBeenCalledWith(Routes.Tileshare.tilette('cluster-1', 'tpl-1'));
	});

	it('falls back to the caller when the created tilette has no id', async () => {
		createTilette.mockResolvedValue({ id: null, name: 'Backend work' });
		const { onCreated } = renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.click(submit());
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'tilesharedemo.detail.add.success.view' })
			).toBeInTheDocument()
		);

		fireEvent.click(
			screen.getByRole('button', { name: 'tilesharedemo.detail.add.success.view' })
		);

		expect(navigate).not.toHaveBeenCalled();
		expect(onCreated).toHaveBeenCalled();
	});

	// The route binds ContactModel objects, not bare strings.
	it('sends recipients as ContactModel objects, splitting email from phone', async () => {
		renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.change(shareToInput(), { target: { value: 'a@x.com' } });
		fireEvent.keyDown(shareToInput(), { key: 'Enter' });
		fireEvent.change(shareToInput(), { target: { value: '5551234567' } });
		fireEvent.keyDown(shareToInput(), { key: 'Enter' });
		fireEvent.click(submit());

		await waitFor(() => expect(createTilette).toHaveBeenCalledOnce());
		expect(createTilette.mock.calls[0][0].Contacts).toEqual([
			{ Email: 'a@x.com' },
			{ PhoneNumber: '+15551234567' },
		]);
	});

	it('reports a missing name instead of submitting', async () => {
		renderForm();

		fireEvent.click(submit());

		expect(createTilette).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(notificationMessages()).toContain(
				'tilesharedemo.detail.add.validation.nameRequired'
			)
		);
	});

	it('rejects an invalid recipient', async () => {
		renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.change(shareToInput(), { target: { value: 'not-an-email' } });
		fireEvent.keyDown(shareToInput(), { key: 'Enter' });
		fireEvent.click(submit());

		expect(createTilette).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(notificationMessages()).toContain(
				'tilesharedemo.detail.add.validation.invalidRecipient:not-an-email'
			)
		);
	});

	it('leaves times unset when no deadline is given, falling back to the cluster', async () => {
		renderForm();

		fireEvent.change(nameInput(), { target: { value: 'Backend work' } });
		fireEvent.click(submit());

		await waitFor(() => expect(createTilette).toHaveBeenCalledOnce());
		expect(createTilette.mock.calls[0][0].EndTime).toBeUndefined();
	});

	it('goes back without creating when cancelled', () => {
		const { onBack } = renderForm();

		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.add.cancel' }));

		expect(onBack).toHaveBeenCalledOnce();
		expect(createTilette).not.toHaveBeenCalled();
	});
});
