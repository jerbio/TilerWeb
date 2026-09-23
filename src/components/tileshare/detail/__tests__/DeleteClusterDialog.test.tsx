import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import DeleteClusterDialog from '../DeleteClusterDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { name?: string }) => (opts?.name ? `${key}:${opts.name}` : key),
	}),
}));

const renderDialog = (props: Partial<React.ComponentProps<typeof DeleteClusterDialog>> = {}) => {
	const onConfirm = vi.fn();
	const setShow = vi.fn();
	render(
		<ThemeProvider defaultTheme="dark">
			<DeleteClusterDialog
				show
				setShow={setShow}
				name="Design Sprint"
				onConfirm={onConfirm}
				{...props}
			/>
		</ThemeProvider>
	);
	return { onConfirm, setShow };
};

const confirmButton = () =>
	screen.getByRole('button', { name: 'tilesharedemo.detail.delete.confirm' });

describe('DeleteClusterDialog', () => {
	it('names the tileshare being deleted and warns it is shared', () => {
		renderDialog();
		expect(
			screen.getByText('tilesharedemo.detail.delete.body:Design Sprint')
		).toBeInTheDocument();
		expect(screen.getByText('tilesharedemo.detail.delete.warning')).toBeInTheDocument();
	});

	it('confirms only on the delete action', () => {
		const { onConfirm, setShow } = renderDialog();

		fireEvent.click(screen.getByRole('button', { name: 'tilesharedemo.detail.delete.cancel' }));
		expect(onConfirm).not.toHaveBeenCalled();
		expect(setShow).toHaveBeenCalledWith(false);

		fireEvent.click(confirmButton());
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it('blocks a second confirm while the delete is in flight', () => {
		const { onConfirm } = renderDialog({ deleting: true });

		const deleting = screen.getByRole('button', {
			name: 'tilesharedemo.detail.delete.deleting',
		});
		expect(deleting).toBeDisabled();
		fireEvent.click(deleting);
		expect(onConfirm).not.toHaveBeenCalled();
	});
});
