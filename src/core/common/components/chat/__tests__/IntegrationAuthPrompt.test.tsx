import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import IntegrationAuthPrompt from '@/core/common/components/chat/IntegrationAuthPrompt';

const mockCompleteIntegrationAuth = vi.fn();

vi.mock('@/services', () => ({
	chatService: {
		completeIntegrationAuth: (...args: unknown[]) => mockCompleteIntegrationAuth(...args),
	},
}));

const baseGate = {
	gateId: 'gate-int-1',
	integrationKey: 'jira',
	oauthInitiationUrl: 'https://example.com/oauth/authorize?client_id=abc',
	stepDescription: 'Search Jira issues',
};

const renderPrompt = (overrides: { onResolved?: () => void; gate?: typeof baseGate } = {}) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<IntegrationAuthPrompt
					vibeRequestId="vibe-req-1"
					gate={overrides.gate ?? baseGate}
					onResolved={overrides.onResolved ?? vi.fn()}
				/>
			</ThemeProvider>
		</I18nextProvider>
	);

describe('IntegrationAuthPrompt', () => {
	const originalOpen = window.open;

	beforeEach(() => {
		mockCompleteIntegrationAuth.mockReset();
		window.open = vi.fn() as unknown as typeof window.open;
	});

	afterEach(() => {
		window.open = originalOpen;
	});

	it('renders the integration name and the authorization link', () => {
		renderPrompt();
		expect(screen.getByText(/jira requires authorization/i)).toBeInTheDocument();
		const link = screen.getByRole('link', { name: /open authorization page/i });
		expect(link).toHaveAttribute('href', baseGate.oauthInitiationUrl);
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('keeps the completion button disabled until the user opens the auth page', async () => {
		renderPrompt();
		const completeBtn = screen.getByRole('button', { name: /completed authorization/i });
		expect(completeBtn).toBeDisabled();

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /^authorize$/i }));
		expect(window.open).toHaveBeenCalledWith(
			baseGate.oauthInitiationUrl,
			'_blank',
			'noopener,noreferrer'
		);
		expect(completeBtn).toBeEnabled();
	});

	it('completion button is enabled immediately when no oauth URL is provided', () => {
		renderPrompt({
			gate: { ...baseGate, oauthInitiationUrl: undefined as unknown as string },
		});
		const completeBtn = screen.getByRole('button', { name: /completed authorization/i });
		expect(completeBtn).toBeEnabled();
	});

	it('calls completeIntegrationAuth with the sentinel payload and notifies onResolved', async () => {
		const onResolved = vi.fn();
		mockCompleteIntegrationAuth.mockResolvedValue({ ok: true });
		renderPrompt({ onResolved });

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /^authorize$/i }));
		await user.click(screen.getByRole('button', { name: /completed authorization/i }));

		await waitFor(() => {
			expect(mockCompleteIntegrationAuth).toHaveBeenCalledWith(
				'vibe-req-1',
				'gate-int-1',
				'jira',
				'fe_user_completed=1'
			);
			expect(onResolved).toHaveBeenCalled();
		});
	});

	it('dismisses without calling completeIntegrationAuth', async () => {
		const onResolved = vi.fn();
		renderPrompt({ onResolved });
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /dismiss/i }));
		expect(mockCompleteIntegrationAuth).not.toHaveBeenCalled();
		expect(onResolved).toHaveBeenCalled();
	});

	it('shows an error message when completeIntegrationAuth fails', async () => {
		mockCompleteIntegrationAuth.mockRejectedValue(new Error('boom'));
		renderPrompt();
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /^authorize$/i }));
		await user.click(screen.getByRole('button', { name: /completed authorization/i }));
		await waitFor(() => {
			expect(screen.getByRole('alert')).toBeInTheDocument();
		});
	});
});
