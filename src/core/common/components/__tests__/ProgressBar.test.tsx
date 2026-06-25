import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import ProgressBar from '@/core/common/components/ProgressBar';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('ProgressBar', () => {
	describe('Rendering', () => {
		it('renders the label', () => {
			renderWithTheme(<ProgressBar label="Loading" percentage={50} />);
			expect(screen.getByText('Loading')).toBeInTheDocument();
		});

		it('renders the default label when none is provided', () => {
			renderWithTheme(<ProgressBar percentage={50} />);
			expect(screen.getByText('Progress')).toBeInTheDocument();
		});

		it('renders the percentage value', () => {
			renderWithTheme(<ProgressBar percentage={75} />);
			expect(screen.getByText('75%')).toBeInTheDocument();
		});
	});

	describe('Clamping', () => {
		it('clamps percentage above 100 to 100', () => {
			renderWithTheme(<ProgressBar percentage={150} />);
			expect(screen.getByText('100%')).toBeInTheDocument();
		});

		it('clamps percentage below 0 to 0', () => {
			renderWithTheme(<ProgressBar percentage={-20} />);
			expect(screen.getByText('0%')).toBeInTheDocument();
		});

		it('renders 0% correctly', () => {
			renderWithTheme(<ProgressBar percentage={0} />);
			expect(screen.getByText('0%')).toBeInTheDocument();
		});

		it('renders 100% correctly', () => {
			renderWithTheme(<ProgressBar percentage={100} />);
			expect(screen.getByText('100%')).toBeInTheDocument();
		});
	});

	describe('className', () => {
		it('forwards className to the container', () => {
			const { container } = renderWithTheme(
				<ProgressBar percentage={50} className="custom-class" />
			);
			expect(container.firstChild).toHaveClass('custom-class');
		});
	});
});
