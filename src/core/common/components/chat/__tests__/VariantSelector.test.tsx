import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import VariantSelector from '@/core/common/components/chat/VariantSelector';
import type { VariantPreview } from '@/core/common/types/chat';

const mockGetVariantPreviews = vi.fn();
const mockSelectVariant = vi.fn();

vi.mock('@/services', () => ({
	chatService: {
		getVariantPreviews: (...args: unknown[]) => mockGetVariantPreviews(...args),
		selectVariant: (...args: unknown[]) => mockSelectVariant(...args),
	},
}));

const renderSelector = (props: { vibeRequestId?: string; onResolved?: () => void } = {}) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<VariantSelector
					vibeRequestId={props.vibeRequestId ?? 'vibe-req-1'}
					onResolved={props.onResolved ?? vi.fn()}
				/>
			</ThemeProvider>
		</I18nextProvider>
	);

const buildPreview = (id: string, descriptions: string): VariantPreview => ({
	id,
	vibeRequestId: 'vibe-req-1',
	tilerUserId: 'user-1',
	creationTimeInMs: 1000,
	previewActions: [
		{
			action: {
				descriptions,
			} as unknown as VariantPreview['previewActions'] extends (infer A)[]
				? A extends { action?: infer X }
					? X
					: never
				: never,
		},
	],
});

describe('VariantSelector', () => {
	beforeEach(() => {
		mockGetVariantPreviews.mockReset();
		mockSelectVariant.mockReset();
	});

	it('shows loading state while fetching previews', () => {
		mockGetVariantPreviews.mockReturnValue(new Promise(() => {})); // never resolves
		renderSelector();
		// Loading message uses translation key — assert by partial text match
		expect(screen.getByText(/loading|Loading/i)).toBeInTheDocument();
	});

	it('renders one card per preview after load and labels them Variant 1, 2, ...', async () => {
		mockGetVariantPreviews.mockResolvedValue([
			buildPreview('p-1', 'Move workouts to evenings'),
			buildPreview('p-2', 'Move workouts to mornings'),
		]);

		renderSelector();

		await waitFor(() => {
			expect(screen.getByText('Variant 1')).toBeInTheDocument();
			expect(screen.getByText('Variant 2')).toBeInTheDocument();
		});
		expect(screen.getByText('Move workouts to evenings')).toBeInTheDocument();
		expect(screen.getByText('Move workouts to mornings')).toBeInTheDocument();
	});

	it('calls selectVariant and onResolved when a card is applied', async () => {
		const onResolved = vi.fn();
		mockGetVariantPreviews.mockResolvedValue([buildPreview('p-1', 'Plan A')]);
		mockSelectVariant.mockResolvedValue({ ok: true });

		renderSelector({ onResolved });
		const user = userEvent.setup();

		await waitFor(() => screen.getByText('Variant 1'));
		const applyButtons = screen
			.getAllByRole('button')
			.filter((b) => /apply/i.test(b.textContent ?? ''));
		await user.click(applyButtons[0]);

		await waitFor(() => {
			expect(mockSelectVariant).toHaveBeenCalledWith('vibe-req-1', 'p-1');
			expect(onResolved).toHaveBeenCalled();
		});
	});

	it('shows error state when fetching previews fails', async () => {
		mockGetVariantPreviews.mockRejectedValue(new Error('boom'));

		renderSelector();

		await waitFor(() => {
			// Error message uses translation key — partial match
			expect(screen.getByText(/error|failed|wrong/i)).toBeInTheDocument();
		});
	});

	it('dismisses without calling selectVariant when Dismiss All is clicked', async () => {
		const onResolved = vi.fn();
		mockGetVariantPreviews.mockResolvedValue([buildPreview('p-1', 'Plan A')]);

		renderSelector({ onResolved });
		const user = userEvent.setup();

		await waitFor(() => screen.getByText('Variant 1'));
		const dismissButton = screen
			.getAllByRole('button')
			.find((b) => /dismiss/i.test(b.textContent ?? ''));
		expect(dismissButton).toBeDefined();
		await user.click(dismissButton!);

		expect(mockSelectVariant).not.toHaveBeenCalled();
		expect(onResolved).toHaveBeenCalled();
	});
});
