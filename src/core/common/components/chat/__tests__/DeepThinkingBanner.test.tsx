import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import DeepThinkingBanner from '@/core/common/components/chat/DeepThinkingBanner';

/**
 * Unified Research Path M6.4 tests.
 *
 * The banner is purely presentational: hidden when visible=false, rendered
 * with a polite live-region announcement when visible=true. The chat
 * composer drives visibility from the same `deepThinking` state that
 * powers the toggle, so the banner appears the moment the user enables
 * Deep mode and disappears when they turn it off.
 */
const renderBanner = (visible: boolean) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<DeepThinkingBanner visible={visible} />
			</ThemeProvider>
		</I18nextProvider>
	);

describe('DeepThinkingBanner (M6.4)', () => {
	it('renders nothing when visible=false', () => {
		renderBanner(false);
		expect(screen.queryByTestId('deep-thinking-banner')).toBeNull();
	});

	it('renders the banner with role=status when visible=true', () => {
		renderBanner(true);
		const banner = screen.getByTestId('deep-thinking-banner');
		expect(banner).toBeInTheDocument();
		expect(banner).toHaveAttribute('role', 'status');
		expect(banner).toHaveAttribute('aria-live', 'polite');
	});

	it('announces that deep thinking is on', () => {
		renderBanner(true);
		// The default message must mention "deep" so screen-reader users
		// understand why the next response may be slower.
		expect(screen.getByTestId('deep-thinking-banner').textContent).toMatch(/deep/i);
	});
});
