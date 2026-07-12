import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import GateResolutionPrompt from '@/core/common/components/chat/GateResolutionPrompt';

const mockResolveGate = vi.fn();

vi.mock('@/services', () => ({
	chatService: {
		resolveGate: (...args: unknown[]) => mockResolveGate(...args),
	},
}));

const baseGate = {
	gateId: 'gate-abc',
	gateKind: 'SubjectDisambiguation',
	stepDescription: 'Resolve subject "Ashley"',
	resultSummary: 'There are two Ashleys — Ashley Chen or Ashley Park?',
};

const renderPrompt = (overrides: { onResolved?: () => void } = {}) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<GateResolutionPrompt
					vibeRequestId="vibe-req-1"
					gate={baseGate}
					onResolved={overrides.onResolved ?? vi.fn()}
				/>
			</ThemeProvider>
		</I18nextProvider>
	);

describe('GateResolutionPrompt', () => {
	beforeEach(() => {
		mockResolveGate.mockReset();
	});

	it('renders the prompt text and a free-form input', () => {
		renderPrompt();
		expect(screen.getByText(baseGate.resultSummary)).toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('disables Submit until the user types a selection', async () => {
		renderPrompt();
		const submit = screen.getByRole('button', { name: /submit/i });
		expect(submit).toBeDisabled();

		const user = userEvent.setup();
		await user.type(screen.getByRole('textbox'), 'Ashley Chen');
		expect(submit).toBeEnabled();
	});

	it('calls resolveGate with the trimmed selection and notifies onResolved', async () => {
		const onResolved = vi.fn();
		mockResolveGate.mockResolvedValue({ ok: true });
		renderPrompt({ onResolved });

		const user = userEvent.setup();
		await user.type(screen.getByRole('textbox'), '  Ashley Park  ');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			expect(mockResolveGate).toHaveBeenCalledWith('vibe-req-1', 'gate-abc', 'Ashley Park');
			expect(onResolved).toHaveBeenCalled();
		});
	});

	it('dismisses without calling resolveGate', async () => {
		const onResolved = vi.fn();
		renderPrompt({ onResolved });
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /dismiss/i }));
		expect(mockResolveGate).not.toHaveBeenCalled();
		expect(onResolved).toHaveBeenCalled();
	});

	it('returns to ready state when resolveGate fails', async () => {
		mockResolveGate.mockRejectedValue(new Error('boom'));
		renderPrompt();
		const user = userEvent.setup();
		await user.type(screen.getByRole('textbox'), 'Ashley Chen');
		await user.click(screen.getByRole('button', { name: /submit/i }));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
		});
	});

	it('renders candidate chips and clicking one fills the input', async () => {
		const onResolved = vi.fn();
		mockResolveGate.mockResolvedValue({ ok: true });
		render(
			<I18nextProvider i18n={i18n}>
				<ThemeProvider defaultTheme="dark">
					<GateResolutionPrompt
						vibeRequestId="vibe-req-1"
						gate={{
							...baseGate,
							gateKind: 'ArtifactSelection',
							candidateArtifactIds: ['flight_opt_1', 'flight_opt_2', 'flight_opt_3'],
						}}
						onResolved={onResolved}
					/>
				</ThemeProvider>
			</I18nextProvider>
		);

		const chip = screen.getByRole('button', { name: 'flight_opt_2' });
		expect(chip).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'flight_opt_1' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'flight_opt_3' })).toBeInTheDocument();

		const user = userEvent.setup();
		await user.click(chip);
		expect(screen.getByRole('textbox')).toHaveValue('flight_opt_2');

		await user.click(screen.getByRole('button', { name: /submit/i }));
		await waitFor(() => {
			expect(mockResolveGate).toHaveBeenCalledWith('vibe-req-1', 'gate-abc', 'flight_opt_2');
		});
	});
});
