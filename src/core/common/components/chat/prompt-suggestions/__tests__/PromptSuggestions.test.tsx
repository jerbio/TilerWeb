import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import PromptSuggestions from '../PromptSuggestions';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

const SUGGESTIONS: Record<string, string> = {
	sug_a1b2c3: 'Plan my day',
	sug_d4e5f6: 'Add a task for tomorrow',
	sug_g7h8i9: 'What is on my schedule?',
};

describe('PromptSuggestions', () => {
	describe('Loading state', () => {
		it('renders skeleton pills when isLoading is true', () => {
			renderWithTheme(
				<PromptSuggestions suggestions={{}} isLoading={true} onPromptClick={vi.fn()} />
			);
			// Skeletons have role="presentation" and no text content
			const skeletons = screen.getAllByRole('presentation');
			expect(skeletons.length).toBeGreaterThan(0);
		});

		it('renders exactly 5 skeleton pills', () => {
			renderWithTheme(
				<PromptSuggestions suggestions={{}} isLoading={true} onPromptClick={vi.fn()} />
			);
			expect(screen.getAllByRole('presentation')).toHaveLength(5);
		});

		it('does not render suggestion pills while loading', () => {
			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={true}
					onPromptClick={vi.fn()}
				/>
			);
			expect(screen.queryByText('Plan my day')).not.toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders nothing when suggestions are empty and not loading', () => {
			const { container } = renderWithTheme(
				<PromptSuggestions suggestions={{}} isLoading={false} onPromptClick={vi.fn()} />
			);
			expect(container.firstChild).toBeNull();
		});
	});

	describe('Suggestions rendering', () => {
		it('renders a pill for each suggestion', () => {
			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={false}
					onPromptClick={vi.fn()}
				/>
			);
			expect(screen.getByText('Plan my day')).toBeInTheDocument();
			expect(screen.getByText('Add a task for tomorrow')).toBeInTheDocument();
			expect(screen.getByText('What is on my schedule?')).toBeInTheDocument();
		});

		it('renders the correct number of pills', () => {
			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={false}
					onPromptClick={vi.fn()}
				/>
			);
			expect(screen.getAllByRole('button')).toHaveLength(Object.keys(SUGGESTIONS).length);
		});

		it('each pill has a title attribute matching its text', () => {
			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={false}
					onPromptClick={vi.fn()}
				/>
			);
			Object.values(SUGGESTIONS).forEach((text) => {
				expect(screen.getByTitle(text)).toBeInTheDocument();
			});
		});
	});

	describe('Interaction', () => {
		it('calls onPromptClick with the correct key and text when a pill is clicked', async () => {
			const user = userEvent.setup();
			const onPromptClick = vi.fn();

			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={false}
					onPromptClick={onPromptClick}
				/>
			);

			await user.click(screen.getByText('Plan my day'));

			expect(onPromptClick).toHaveBeenCalledOnce();
			expect(onPromptClick).toHaveBeenCalledWith('sug_a1b2c3', 'Plan my day');
		});

		it('calls onPromptClick with the key matching the clicked suggestion', async () => {
			const user = userEvent.setup();
			const onPromptClick = vi.fn();

			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={false}
					onPromptClick={onPromptClick}
				/>
			);

			await user.click(screen.getByText('Add a task for tomorrow'));

			expect(onPromptClick).toHaveBeenCalledWith('sug_d4e5f6', 'Add a task for tomorrow');
		});

		it('does not call onPromptClick when loading', async () => {
			const user = userEvent.setup();
			const onPromptClick = vi.fn();

			renderWithTheme(
				<PromptSuggestions
					suggestions={SUGGESTIONS}
					isLoading={true}
					onPromptClick={onPromptClick}
				/>
			);

			// Skeletons are divs, not buttons — nothing clickable
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
			expect(onPromptClick).not.toHaveBeenCalled();
		});
	});

	describe('Transitions', () => {
		it('switches from skeleton to pills when loading completes', () => {
			const { rerender } = renderWithTheme(
				<PromptSuggestions suggestions={{}} isLoading={true} onPromptClick={vi.fn()} />
			);
			expect(screen.getAllByRole('presentation')).toHaveLength(5);

			rerender(
				<ThemeProvider defaultTheme="dark">
					<PromptSuggestions
						suggestions={SUGGESTIONS}
						isLoading={false}
						onPromptClick={vi.fn()}
					/>
				</ThemeProvider>
			);

			expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
			expect(screen.getAllByRole('button')).toHaveLength(Object.keys(SUGGESTIONS).length);
		});
	});
});
