import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { useUiStore } from '@/core/ui';
import EditTileshareModal from '../EditTileshareModal';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

// 14 Mar 2026, 17:30 local — a due time worth preserving across a date edit.
const DUE = dayjs('2026-03-14T17:30:00').valueOf();

const renderModal = (props: Partial<React.ComponentProps<typeof EditTileshareModal>> = {}) => {
	const onSubmit = vi.fn();
	const setShow = vi.fn();
	const utils = render(
		<ThemeProvider defaultTheme="dark">
			<EditTileshareModal
				show
				setShow={setShow}
				headerText="edit.clusterTitle"
				initial={{ name: 'Design Sprint', description: 'Ship the redesign', dueDate: DUE }}
				onSubmit={onSubmit}
				{...props}
			/>
		</ThemeProvider>
	);
	return { ...utils, onSubmit, setShow };
};

const nameInput = () =>
	screen.getByPlaceholderText('tilesharedemo.detail.edit.fields.name.placeholder');
const noteInput = () =>
	screen.getByPlaceholderText('tilesharedemo.detail.edit.fields.note.placeholder');
const saveButton = () => screen.getByRole('button', { name: 'tilesharedemo.detail.edit.save' });

/** Messages currently queued in the shared notification store. */
const notificationMessages = () => useUiStore.getState().notification.items.map((n) => n.message);

describe('EditTileshareModal', () => {
	beforeEach(() => {
		useUiStore.getState().notification.clear();
	});

	it('seeds the fields from the entity being edited', () => {
		renderModal();
		expect(nameInput()).toHaveValue('Design Sprint');
		expect(noteInput()).toHaveValue('Ship the redesign');
	});

	it('labels every field', () => {
		renderModal();

		// Name and note label their control; the date picker renders its own label.
		expect(
			screen.getByLabelText('tilesharedemo.detail.edit.fields.name.label')
		).toBeInTheDocument();
		expect(
			screen.getByLabelText('tilesharedemo.detail.edit.fields.note.label')
		).toBeInTheDocument();
		expect(
			screen.getByText('tilesharedemo.detail.edit.fields.deadline.label')
		).toBeInTheDocument();
	});

	it('submits trimmed values', () => {
		const { onSubmit } = renderModal();

		fireEvent.change(nameInput(), { target: { value: '  Renamed sprint  ' } });
		fireEvent.click(saveButton());

		expect(onSubmit).toHaveBeenCalledWith({
			name: 'Renamed sprint',
			description: 'Ship the redesign',
			dueDate: DUE,
		});
	});

	it('keeps the original time of day when the due date is unchanged', () => {
		const { onSubmit } = renderModal();

		fireEvent.click(saveButton());

		const submitted = onSubmit.mock.calls[0][0].dueDate as number;
		expect(dayjs(submitted).hour()).toBe(17);
		expect(dayjs(submitted).minute()).toBe(30);
	});

	// Matches the create form: the button stays enabled and submitting surfaces
	// the problem as a notification rather than silently doing nothing.
	it('reports a missing name instead of submitting', () => {
		const { onSubmit } = renderModal();

		fireEvent.change(nameInput(), { target: { value: '   ' } });
		fireEvent.click(saveButton());

		expect(onSubmit).not.toHaveBeenCalled();
		expect(notificationMessages()).toContain(
			'tilesharedemo.detail.edit.validation.nameRequired'
		);
	});

	it('reports a missing deadline instead of submitting', () => {
		const { onSubmit } = renderModal({
			initial: { name: 'No date', description: null, dueDate: null },
		});

		fireEvent.click(saveButton());

		expect(onSubmit).not.toHaveBeenCalled();
		expect(notificationMessages()).toContain(
			'tilesharedemo.detail.edit.validation.deadlineRequired'
		);
	});

	it('shows a saving state and blocks a second submit while in flight', () => {
		const { onSubmit } = renderModal({ saving: true });

		const saving = screen.getByRole('button', { name: 'tilesharedemo.detail.edit.saving' });
		expect(saving).toBeDisabled();
		fireEvent.click(saving);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('discards abandoned edits when reopened', () => {
		const { setShow, rerender } = renderModal();

		fireEvent.change(nameInput(), { target: { value: 'abandoned' } });
		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.edit.cancel' }));
		expect(setShow).toHaveBeenCalledWith(false);

		const reopen = (show: boolean) =>
			rerender(
				<ThemeProvider defaultTheme="dark">
					<EditTileshareModal
						show={show}
						setShow={setShow}
						headerText="edit.clusterTitle"
						initial={{
							name: 'Design Sprint',
							description: 'Ship the redesign',
							dueDate: DUE,
						}}
						onSubmit={vi.fn()}
					/>
				</ThemeProvider>
			);

		reopen(false);
		reopen(true);

		expect(nameInput()).toHaveValue('Design Sprint');
	});
});
