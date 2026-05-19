import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import Pagination from '@/core/common/components/Pagination';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('Pagination', () => {
	describe('Rendering', () => {
		it('renders the navigation landmark', () => {
			renderWithTheme(<Pagination page={1} totalPages={5} onChange={vi.fn()} />);
			expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
		});

		it('renders page buttons for small totals', () => {
			renderWithTheme(<Pagination page={1} totalPages={5} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
		});

		it('renders first/last buttons by default', () => {
			renderWithTheme(<Pagination page={3} totalPages={10} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'First page' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Last page' })).toBeInTheDocument();
		});

		it('hides first/last buttons when showFirstLast is false', () => {
			renderWithTheme(
				<Pagination page={3} totalPages={10} onChange={vi.fn()} showFirstLast={false} />
			);
			expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Last page' })).not.toBeInTheDocument();
		});

		it('renders null when totalPages is 1', () => {
			const { container } = renderWithTheme(
				<Pagination page={1} totalPages={1} onChange={vi.fn()} />
			);
			expect(container).toBeEmptyDOMElement();
		});

		it('renders null when totalPages is 0', () => {
			const { container } = renderWithTheme(
				<Pagination page={1} totalPages={0} onChange={vi.fn()} />
			);
			expect(container).toBeEmptyDOMElement();
		});

		it('marks the current page with aria-current="page"', () => {
			renderWithTheme(<Pagination page={3} totalPages={5} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
				'aria-current',
				'page'
			);
		});

		it('renders ellipsis for large page ranges', () => {
			renderWithTheme(<Pagination page={5} totalPages={20} onChange={vi.fn()} />);
			const ellipses = screen.getAllByText('…');
			expect(ellipses.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Navigation', () => {
		it('calls onChange with the next page on Next click', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={3} totalPages={10} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
			expect(onChange).toHaveBeenCalledWith(4);
		});

		it('calls onChange with the previous page on Previous click', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={3} totalPages={10} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
			expect(onChange).toHaveBeenCalledWith(2);
		});

		it('calls onChange with 1 on First page click', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={5} totalPages={10} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'First page' }));
			expect(onChange).toHaveBeenCalledWith(1);
		});

		it('calls onChange with totalPages on Last page click', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={5} totalPages={10} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
			expect(onChange).toHaveBeenCalledWith(10);
		});

		it('calls onChange with the clicked page number', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={1} totalPages={5} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
			expect(onChange).toHaveBeenCalledWith(4);
		});

		it('does not call onChange when clicking the current page', () => {
			const onChange = vi.fn();
			renderWithTheme(<Pagination page={3} totalPages={5} onChange={onChange} />);
			fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('Boundary states', () => {
		it('disables Previous and First buttons on the first page', () => {
			renderWithTheme(<Pagination page={1} totalPages={5} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
			expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
		});

		it('disables Next and Last buttons on the last page', () => {
			renderWithTheme(<Pagination page={5} totalPages={5} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
			expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
		});

		it('disables all buttons when disabled prop is true', () => {
			renderWithTheme(<Pagination page={3} totalPages={5} onChange={vi.fn()} disabled />);
			screen.getAllByRole('button').forEach((btn) => {
				expect(btn).toBeDisabled();
			});
		});
	});

	describe('Page range algorithm', () => {
		it('shows all pages when totalPages is within the threshold', () => {
			renderWithTheme(<Pagination page={1} totalPages={7} onChange={vi.fn()} />);
			for (let i = 1; i <= 7; i++) {
				expect(screen.getByRole('button', { name: `Page ${i}` })).toBeInTheDocument();
			}
		});

		it('always shows the first and last page', () => {
			renderWithTheme(<Pagination page={10} totalPages={20} onChange={vi.fn()} />);
			expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
		});

		it('respects custom siblingCount', () => {
			renderWithTheme(
				<Pagination page={10} totalPages={20} onChange={vi.fn()} siblingCount={2} />
			);
			expect(screen.getByRole('button', { name: 'Page 8' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 9' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 11' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 12' })).toBeInTheDocument();
		});
	});
});
