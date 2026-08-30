import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import TagInput from '@/core/common/components/TagInput';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('TagInput', () => {
	describe('Rendering', () => {
		it('renders the placeholder', () => {
			renderWithTheme(<TagInput value={[]} onChange={vi.fn()} placeholder="Add recipient" />);
			expect(screen.getByPlaceholderText('Add recipient')).toBeInTheDocument();
		});

		it('renders a chip for each value', () => {
			renderWithTheme(<TagInput value={['a@x.com', 'b@x.com']} onChange={vi.fn()} />);
			expect(screen.getByText('a@x.com')).toBeInTheDocument();
			expect(screen.getByText('b@x.com')).toBeInTheDocument();
		});

		it('renders no chips when empty', () => {
			renderWithTheme(
				<TagInput value={[]} onChange={vi.fn()} removeLabel={(v) => `Remove ${v}`} />
			);
			expect(screen.queryByLabelText(/Remove/)).not.toBeInTheDocument();
		});
	});

	describe('Adding', () => {
		it('commits the draft on Enter with the appended value', () => {
			const onChange = vi.fn();
			renderWithTheme(<TagInput value={[]} onChange={onChange} placeholder="Add" />);
			const input = screen.getByPlaceholderText('Add');
			fireEvent.change(input, { target: { value: 'a@x.com' } });
			fireEvent.keyDown(input, { key: 'Enter' });
			expect(onChange).toHaveBeenCalledWith(['a@x.com']);
		});

		it('commits the draft on comma', () => {
			const onChange = vi.fn();
			renderWithTheme(<TagInput value={['a@x.com']} onChange={onChange} placeholder="Add" />);
			const input = screen.getByPlaceholderText('Add');
			fireEvent.change(input, { target: { value: 'b@x.com' } });
			fireEvent.keyDown(input, { key: ',' });
			expect(onChange).toHaveBeenCalledWith(['a@x.com', 'b@x.com']);
		});

		it('commits the draft when the add button is clicked', () => {
			const onChange = vi.fn();
			renderWithTheme(
				<TagInput
					value={[]}
					onChange={onChange}
					placeholder="Add"
					addLabel="Add recipient"
				/>
			);
			fireEvent.change(screen.getByPlaceholderText('Add'), {
				target: { value: 'a@x.com' },
			});
			fireEvent.click(screen.getByLabelText('Add recipient'));
			expect(onChange).toHaveBeenCalledWith(['a@x.com']);
		});

		it('trims whitespace before committing', () => {
			const onChange = vi.fn();
			renderWithTheme(<TagInput value={[]} onChange={onChange} placeholder="Add" />);
			const input = screen.getByPlaceholderText('Add');
			fireEvent.change(input, { target: { value: '  a@x.com  ' } });
			fireEvent.keyDown(input, { key: 'Enter' });
			expect(onChange).toHaveBeenCalledWith(['a@x.com']);
		});

		it('ignores empty and whitespace-only input', () => {
			const onChange = vi.fn();
			renderWithTheme(<TagInput value={[]} onChange={onChange} placeholder="Add" />);
			const input = screen.getByPlaceholderText('Add');
			fireEvent.change(input, { target: { value: '   ' } });
			fireEvent.keyDown(input, { key: 'Enter' });
			expect(onChange).not.toHaveBeenCalled();
		});

		it('ignores duplicate values', () => {
			const onChange = vi.fn();
			renderWithTheme(<TagInput value={['a@x.com']} onChange={onChange} placeholder="Add" />);
			const input = screen.getByPlaceholderText('Add');
			fireEvent.change(input, { target: { value: 'a@x.com' } });
			fireEvent.keyDown(input, { key: 'Enter' });
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('Removing', () => {
		it('removes a chip via its remove button', () => {
			const onChange = vi.fn();
			renderWithTheme(
				<TagInput
					value={['a@x.com', 'b@x.com']}
					onChange={onChange}
					removeLabel={(v) => `Remove ${v}`}
				/>
			);
			fireEvent.click(screen.getByLabelText('Remove a@x.com'));
			expect(onChange).toHaveBeenCalledWith(['b@x.com']);
		});

		it('removes the last tag on Backspace when the draft is empty', () => {
			const onChange = vi.fn();
			renderWithTheme(
				<TagInput value={['a@x.com', 'b@x.com']} onChange={onChange} placeholder="Add" />
			);
			fireEvent.keyDown(screen.getByPlaceholderText('Add'), { key: 'Backspace' });
			expect(onChange).toHaveBeenCalledWith(['a@x.com']);
		});
	});

	describe('Disabled state', () => {
		it('disables the add and remove buttons', () => {
			renderWithTheme(
				<TagInput
					value={['a@x.com']}
					onChange={vi.fn()}
					addLabel="Add recipient"
					removeLabel={(v) => `Remove ${v}`}
					disabled
				/>
			);
			expect(screen.getByLabelText('Add recipient')).toBeDisabled();
			expect(screen.getByLabelText('Remove a@x.com')).toBeDisabled();
		});
	});
});
