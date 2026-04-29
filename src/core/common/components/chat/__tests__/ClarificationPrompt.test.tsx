import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import ClarificationPrompt from '@/core/common/components/chat/ClarificationPrompt';

const mockSupplyClarification = vi.fn();

vi.mock('@/services', () => ({
	chatService: {
		supplyClarification: (...args: unknown[]) => mockSupplyClarification(...args),
	},
}));

const baseClarification = {
	stepId: 'step-1',
	providerMessage: 'I need a few more details before I can search flights.',
	missingParameters: [
		{
			parameterName: 'origin',
			description: 'Departure city',
			isRequired: true,
		},
		{
			parameterName: 'cabin',
			description: 'Cabin class',
			isRequired: false,
			suggestedValues: ['economy', 'business'],
		},
	],
};

const renderPrompt = (
	overrides: { onResolved?: () => void; clarification?: typeof baseClarification } = {}
) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<ClarificationPrompt
					vibeRequestId="vibe-req-1"
					clarification={overrides.clarification ?? baseClarification}
					onResolved={overrides.onResolved ?? vi.fn()}
				/>
			</ThemeProvider>
		</I18nextProvider>
	);

describe('ClarificationPrompt', () => {
	beforeEach(() => {
		mockSupplyClarification.mockReset();
	});

	it('renders the provider message and one input per missing parameter', () => {
		renderPrompt();
		expect(screen.getByText(baseClarification.providerMessage)).toBeInTheDocument();
		expect(screen.getByText('Departure city')).toBeInTheDocument();
		expect(screen.getByText('Cabin class')).toBeInTheDocument();
	});

	it('renders a select for parameters with suggestedValues', () => {
		renderPrompt();
		const selects = screen.getAllByRole('combobox');
		expect(selects).toHaveLength(1);
		expect(screen.getByRole('option', { name: 'economy' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'business' })).toBeInTheDocument();
	});

	it('disables Submit while required fields are empty', () => {
		renderPrompt();
		const submit = screen.getByRole('button', { name: /submit/i });
		expect(submit).toBeDisabled();
	});

	it('enables Submit once all required fields have values', async () => {
		renderPrompt();
		const user = userEvent.setup();

		const originInput = screen.getByPlaceholderText('Departure city');
		await user.type(originInput, 'NYC');

		const submit = screen.getByRole('button', { name: /submit/i });
		expect(submit).toBeEnabled();
	});

	it('calls supplyClarification with collected values and onResolved on submit', async () => {
		const onResolved = vi.fn();
		mockSupplyClarification.mockResolvedValue({ ok: true });

		renderPrompt({ onResolved });
		const user = userEvent.setup();

		await user.type(screen.getByPlaceholderText('Departure city'), 'NYC');
		await user.selectOptions(screen.getByRole('combobox'), 'business');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			expect(mockSupplyClarification).toHaveBeenCalledWith('vibe-req-1', 'step-1', {
				origin: 'NYC',
				cabin: 'business',
			});
			expect(onResolved).toHaveBeenCalled();
		});
	});

	it('calls onResolved without supplyClarification on dismiss', async () => {
		const onResolved = vi.fn();
		renderPrompt({ onResolved });
		const user = userEvent.setup();

		await user.click(screen.getByRole('button', { name: /dismiss/i }));

		expect(mockSupplyClarification).not.toHaveBeenCalled();
		expect(onResolved).toHaveBeenCalled();
	});

	it('returns to ready state when supplyClarification fails', async () => {
		mockSupplyClarification.mockRejectedValue(new Error('boom'));
		renderPrompt();
		const user = userEvent.setup();

		await user.type(screen.getByPlaceholderText('Departure city'), 'NYC');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			// Submit button should be re-enabled (state returned to 'ready')
			expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
		});
	});
});
