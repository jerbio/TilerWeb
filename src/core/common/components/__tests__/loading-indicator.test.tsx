import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import LoadingIndicator from '@/core/common/components/loading-indicator';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

describe('LoadingIndicator', () => {
	describe('Simple mode (no wsStatus prop)', () => {
		it('renders the message text', () => {
			renderWithTheme(<LoadingIndicator message="Loading messages..." />);
			expect(screen.getByText('Loading messages...')).toBeInTheDocument();
		});

		it('uses default message when none provided', () => {
			renderWithTheme(<LoadingIndicator />);
			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('does NOT render the research progress counter in simple mode', () => {
			renderWithTheme(
				<LoadingIndicator
					message="Loading"
					researchProgress={{ completedSteps: 2, totalSteps: 5 }}
				/>
			);
			// Counter is gated on reveal mode (wsStatus !== undefined)
			expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
		});
	});

	describe('Reveal mode (wsStatus prop provided)', () => {
		it('renders progress counter when researchProgress has totalSteps > 0', () => {
			renderWithTheme(
				<LoadingIndicator
					message="Searching flights"
					wsStatus="research_step_starting"
					researchProgress={{ completedSteps: 2, totalSteps: 5 }}
				/>
			);
			expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
		});

		it('does NOT render counter when totalSteps is 0', () => {
			renderWithTheme(
				<LoadingIndicator
					message="Working"
					wsStatus="action_initialization_start"
					researchProgress={{ completedSteps: 0, totalSteps: 0 }}
				/>
			);
			expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
		});

		it('does NOT render counter when researchProgress is null', () => {
			renderWithTheme(
				<LoadingIndicator
					message="Working"
					wsStatus="action_initialization_start"
					researchProgress={null}
				/>
			);
			expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
		});

		it('does NOT render counter when researchProgress is omitted', () => {
			renderWithTheme(
				<LoadingIndicator message="Working" wsStatus="action_initialization_start" />
			);
			expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
		});

		it('still renders counter when wsStatus is null (reveal mode)', () => {
			// wsStatus === null is reveal mode (only undefined falls back to simple)
			renderWithTheme(
				<LoadingIndicator
					message="Working"
					wsStatus={null}
					researchProgress={{ completedSteps: 1, totalSteps: 3 }}
				/>
			);
			expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
		});
	});
});
