import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@/test/test-utils';
import DatePicker from '@/core/common/components/date_picker';
import TileShareDialog from '../TileShareDialog';
import TileShareTransition from '../TileShareTransition';
import { TILESHARE_EXIT_MS } from '../tileshareMotion';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

afterEach(() => vi.restoreAllMocks());

function dialog(open: boolean, onClose = vi.fn(), dismissible = true) {
	return (
		<TileShareDialog
			title="Edit notes"
			open={open}
			onClose={onClose}
			dismissible={dismissible}
			footer={<button onClick={onClose}>Cancel</button>}
		>
			<textarea aria-label="Notes" defaultValue="Keep my **draft**" />
		</TileShareDialog>
	);
}

describe('TileShare dialog transitions', () => {
	it('keeps a selectable calendar inside the dialog and cleans it up on close', async () => {
		const changeDate = vi.fn();
		const content = (open: boolean) => (
			<TileShareDialog title="Edit deadline" open={open} onClose={vi.fn()} footer={null}>
				<DatePicker label="Deadline" value="2026-10-20" onChange={changeDate} />
			</TileShareDialog>
		);
		const { rerender } = render(content(true));
		fireEvent.click(screen.getByLabelText('Deadline'));
		const calendar = document.querySelector('.react-datepicker')!;
		expect(calendar.closest('dialog')).toBe(
			screen.getByRole('dialog', { name: 'Edit deadline' })
		);
		fireEvent.click(
			calendar.querySelector(
				'.react-datepicker__day--021:not(.react-datepicker__day--outside-month)'
			)!
		);
		expect(changeDate).toHaveBeenCalledWith('2026-10-21');
		rerender(content(false));
		await waitFor(() =>
			expect(document.querySelector('[data-tiler-datepicker-portal]')).toBeNull()
		);
	});
	it('keeps the closing content inert until the exit completes, then restores focus', () => {
		vi.useFakeTimers();
		const trigger = document.createElement('button');
		document.body.append(trigger);
		trigger.focus();
		const { rerender } = render(dialog(true));
		expect(screen.getByRole('textbox')).toHaveFocus();
		rerender(dialog(false));
		const fading = screen.getByRole('dialog', { hidden: true });
		expect(fading).toHaveAttribute('inert');
		expect(fading).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByRole('textbox', { hidden: true })).toHaveValue('Keep my **draft**');
		act(() => vi.advanceTimersByTime(TILESHARE_EXIT_MS));
		expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
		trigger.remove();
	});
	it('cancels pending removal if a dialog reopens during its exit', () => {
		vi.useFakeTimers();
		const { rerender } = render(dialog(true));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsaved edit' } });
		rerender(dialog(false));
		act(() => vi.advanceTimersByTime(50));
		rerender(dialog(true));
		act(() => vi.advanceTimersByTime(TILESHARE_EXIT_MS));
		expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');
		expect(screen.getByRole('textbox')).toHaveValue('Unsaved edit');
	});
	it('removes dialogs immediately when reduced motion is requested', () => {
		vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		const { rerender } = render(dialog(true));
		rerender(dialog(false));
		expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument();
	});
	it('prevents Escape and close-button dismissal while a save is in progress', () => {
		const close = vi.fn();
		render(dialog(true, close, false));
		fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
		expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
		expect(close).not.toHaveBeenCalled();
	});
	it('moves focus to the new step heading without reacting to ordinary form updates', () => {
		const { rerender } = render(
			<TileShareTransition viewKey="setup" focus>
				<h2>Project details</h2>
				<input aria-label="Name" />
			</TileShareTransition>
		);
		expect(screen.getByRole('heading')).toHaveFocus();
		screen.getByRole('textbox').focus();
		rerender(
			<TileShareTransition viewKey="setup" focus>
				<h2>Project details</h2>
				<input aria-label="Name" />
			</TileShareTransition>
		);
		expect(screen.getByRole('textbox')).toHaveFocus();
		rerender(
			<TileShareTransition viewKey="workspace" focus>
				<h2>Add tilettes</h2>
			</TileShareTransition>
		);
		expect(screen.getByRole('heading', { name: 'Add tilettes' })).toHaveFocus();
	});
});
