import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import ClarificationPrompt from '@/core/common/components/chat/ClarificationPrompt';
import ServerError from '@/core/error/server';
import { normalizeError } from '@/core/error';

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
	overrides: {
		onResolved?: () => void;
		clarification?: ComponentProps<typeof ClarificationPrompt>['clarification'];
	} = {}
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

	it('displays readable choices and submits machine values with the question identity', async () => {
		mockSupplyClarification.mockResolvedValue({ ok: true });
		renderPrompt({
			clarification: {
				stepId: 'travel',
				clarificationId: 'question-2',
				providerMessage: 'How will you travel?',
				missingParameters: [
					{
						parameterName: 'travel_mode',
						description: 'How you will travel',
						isRequired: true,
						choices: [{ label: 'Public transport', value: 'transit' }],
					},
				],
			},
		});
		const user = userEvent.setup();
		expect(screen.getByRole('option', { name: 'Public transport' })).toHaveValue('transit');
		expect(screen.queryByText('transit')).not.toBeInTheDocument();
		await user.selectOptions(
			screen.getByRole('combobox', { name: /How you will travel/ }),
			'transit'
		);
		await user.click(screen.getByRole('button', { name: /submit/i }));
		expect(mockSupplyClarification).toHaveBeenCalledWith(
			'vibe-req-1',
			'travel',
			{ travel_mode: 'transit' },
			{ clarificationId: 'question-2', anonymousUserId: undefined }
		);
	});

	it('uses the provider declared input type', () => {
		renderPrompt({
			clarification: {
				stepId: 'date',
				providerMessage: 'When will you leave?',
				missingParameters: [
					{
						parameterName: 'date',
						description: 'Departure date',
						isRequired: true,
						inputType: 'date',
					},
				],
			},
		});
		expect(screen.getByLabelText(/Departure date/)).toHaveAttribute('type', 'date');
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

	it.each([false, true])(
		'shows a known rejection and preserves both answers (camel case: %s)',
		async (camelCase) => {
			const message =
				'Please be more specific about: Departure airport. Your other entries are retained.';
			const details = camelCase
				? { code: 'ClarificationAnswerRejected', reason: 'ModelAmbiguous', message }
				: {
						Code: 'ClarificationAnswerRejected',
						Reason: 'ModelAmbiguous',
						Message: message,
					};
			mockSupplyClarification.mockRejectedValue(
				normalizeError(
					new ServerError('HTTP error! status: 400', '/SupplyClarification', details, 400)
				)
			);
			const onResolved = vi.fn();
			renderPrompt({
				onResolved,
				clarification: {
					stepId: '1',
					clarificationId: 'q1',
					providerMessage: 'Where and when will you depart?',
					missingParameters: [
						{
							parameterName: 'origin',
							description: 'Departure airport',
							isRequired: true,
						},
						{
							parameterName: 'travel_date',
							description: 'Departure date',
							isRequired: true,
							inputType: 'date',
						},
					],
				},
			});
			const user = userEvent.setup();
			await user.type(screen.getByLabelText(/Departure airport/), 'utah');
			fireEvent.change(screen.getByLabelText(/Departure date/), {
				target: { value: '2026-10-16' },
			});
			await user.click(screen.getByRole('button', { name: /submit/i }));
			expect(await screen.findByRole('alert')).toHaveTextContent(message);
			expect(screen.getByRole('alert')).not.toHaveTextContent('Unable to confirm');
			expect(screen.getByLabelText(/Departure airport/)).toHaveValue('utah');
			expect(screen.getByLabelText(/Departure date/)).toHaveValue('2026-10-16');
			expect(onResolved).not.toHaveBeenCalled();
			mockSupplyClarification.mockResolvedValue({ ok: true });
			await user.clear(screen.getByLabelText(/Departure airport/));
			await user.type(screen.getByLabelText(/Departure airport/), 'Salt Lake City airport');
			await user.click(screen.getByRole('button', { name: /submit/i }));
			await waitFor(() => expect(onResolved).toHaveBeenCalledTimes(1));
			expect(mockSupplyClarification).toHaveBeenLastCalledWith(
				'vibe-req-1',
				'1',
				{ origin: 'Salt Lake City airport', travel_date: '2026-10-16' },
				{ clarificationId: 'q1', anonymousUserId: undefined }
			);
		}
	);

	it('shows a stale-question response as a refresh instruction', async () => {
		mockSupplyClarification.mockRejectedValue(
			new ServerError(
				'HTTP 400',
				'/SupplyClarification',
				{
					Code: 'ClarificationQuestionChanged',
					Message:
						'This question is no longer current. Refresh the chat before answering again.',
				},
				400
			)
		);
		renderPrompt();
		const user = userEvent.setup();
		await user.type(screen.getByPlaceholderText('Departure city'), 'utah');
		await user.click(screen.getByRole('button', { name: /submit/i }));
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'This question is no longer current.'
		);
	});

	it.each([400, 500])(
		'keeps reconciliation messaging for unknown HTTP %s errors',
		async (status) => {
			mockSupplyClarification.mockRejectedValue(
				new ServerError(
					'HTTP failure',
					'/SupplyClarification',
					{
						Code: 'UnknownError',
						Message: 'PRIVATE_EXCEPTION',
					},
					status
				)
			);
			renderPrompt();
			const user = userEvent.setup();
			await user.type(screen.getByPlaceholderText('Departure city'), 'utah');
			await user.click(screen.getByRole('button', { name: /submit/i }));
			expect(await screen.findByRole('alert')).toHaveTextContent(
				'Unable to confirm the result.'
			);
			expect(screen.getByRole('alert')).not.toHaveTextContent('PRIVATE_EXCEPTION');
		}
	);

	it('returns to ready state when supplyClarification fails', async () => {
		mockSupplyClarification.mockRejectedValue(new Error('boom'));
		renderPrompt();
		const user = userEvent.setup();

		await user.type(screen.getByPlaceholderText('Departure city'), 'NYC');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			// Submit button should be re-enabled (state returned to 'ready')
			expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
			expect(screen.getByRole('alert')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Departure city')).toHaveValue('NYC');
		});
	});
});
