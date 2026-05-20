import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { Send } from 'lucide-react';
import EmptyState from '../EmptyState';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('EmptyState', () => {
	describe('Rendering', () => {
		it('renders without crashing', () => {
			renderWithTheme(<EmptyState />);
			expect(screen.getByRole('paragraph')).toBeInTheDocument();
		});

		it('renders custom text when provided', () => {
			renderWithTheme(<EmptyState text="No results found" />);
			expect(screen.getByText('No results found')).toBeInTheDocument();
		});

		it('falls back to i18n key text when no text prop is given', () => {
			renderWithTheme(<EmptyState />);
			expect(screen.getByText('common.emptyState.defaultText')).toBeInTheDocument();
		});

		it('renders a custom icon', () => {
			const { container } = renderWithTheme(<EmptyState icon={Send} />);
			expect(container.querySelector('svg')).toBeInTheDocument();
		});
	});

	describe('className', () => {
		it('forwards className to the container', () => {
			const { container } = renderWithTheme(<EmptyState className="custom-class" />);
			expect(container.firstChild).toHaveClass('custom-class');
		});
	});
});
