import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import Select from '@/core/common/components/select';

const options = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'archived', label: 'Archived' },
];

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('Select', () => {
	describe('Rendering', () => {
		it('shows the label of the selected option', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			expect(screen.getByText('All')).toBeInTheDocument();
		});

		it('shows the placeholder when no matching option exists', () => {
			renderWithTheme(
				<Select
					value={'unknown' as string}
					onChange={vi.fn()}
					options={options}
					placeholder="Pick one"
				/>
			);
			expect(screen.getByText('Pick one')).toBeInTheDocument();
		});

		it('does not render the dropdown initially', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('renders with aria-label on the trigger', () => {
			renderWithTheme(
				<Select value="all" onChange={vi.fn()} options={options} aria-label="Filter" />
			);
			expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
		});
	});

	describe('Opening and closing', () => {
		it('opens the dropdown on trigger click', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('shows all options when open', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));
			expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Archived' })).toBeInTheDocument();
		});

		it('closes the dropdown after selecting an option', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));
			fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('closes the dropdown on outside mousedown', () => {
			renderWithTheme(
				<div>
					<Select value="all" onChange={vi.fn()} options={options} />
					<button>Outside</button>
				</div>
			);
			fireEvent.click(screen.getByRole('button', { name: /all/i }));
			expect(screen.getByRole('listbox')).toBeInTheDocument();
			fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('toggles closed when trigger is clicked again', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			const trigger = screen.getByRole('button');
			fireEvent.click(trigger);
			expect(screen.getByRole('listbox')).toBeInTheDocument();
			fireEvent.click(trigger);
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	describe('Selection', () => {
		it('calls onChange with the selected value', () => {
			const onChange = vi.fn();
			renderWithTheme(<Select value="all" onChange={onChange} options={options} />);
			fireEvent.click(screen.getByRole('button'));
			fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange).toHaveBeenCalledWith('active');
		});

		it('marks the current value as aria-selected', () => {
			renderWithTheme(<Select value="active" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));
			expect(screen.getByRole('option', { name: 'Active' })).toHaveAttribute(
				'aria-selected',
				'true'
			);
			expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute(
				'aria-selected',
				'false'
			);
		});
	});

	describe('Placement', () => {
		const stubRect = (top: number, bottom: number) =>
			vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
				top,
				bottom,
				left: 0,
				right: 0,
				width: 100,
				height: bottom - top,
				x: 0,
				y: top,
				toJSON: () => ({}),
			} as DOMRect);

		const stubDropdownHeight = (height: number) =>
			vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(height);

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('drops downwards when there is room below', () => {
			window.innerHeight = 800;
			stubRect(100, 132);
			stubDropdownHeight(120);

			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));

			const style = getComputedStyle(screen.getByRole('listbox'));
			expect(style.top).toBe('calc(100% + 4px)');
			expect(style.bottom).toBe('');
		});

		it('flips upwards when the list would overflow the bottom of the viewport', () => {
			window.innerHeight = 800;
			// Trigger sits at the very bottom, e.g. inside a sticky pagination footer.
			stubRect(750, 782);
			stubDropdownHeight(120);

			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));

			const style = getComputedStyle(screen.getByRole('listbox'));
			expect(style.bottom).toBe('calc(100% + 4px)');
			expect(style.top).toBe('');
		});

		it('caps the height to the space available on the chosen side', () => {
			window.innerHeight = 800;
			stubRect(750, 782);
			stubDropdownHeight(2000);

			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} />);
			fireEvent.click(screen.getByRole('button'));

			// 750 above the trigger, less the 4px gap and 8px viewport margin.
			expect(getComputedStyle(screen.getByRole('listbox')).maxHeight).toBe('738px');
		});
	});

	describe('Disabled state', () => {
		it('does not open the dropdown when disabled', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} disabled />);
			fireEvent.click(screen.getByRole('button'));
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('disables the trigger button', () => {
			renderWithTheme(<Select value="all" onChange={vi.fn()} options={options} disabled />);
			expect(screen.getByRole('button')).toBeDisabled();
		});
	});
});
