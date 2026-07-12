import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import DeepThinkingToggle from '@/core/common/components/chat/DeepThinkingToggle';

/**
 * Unified Research Path M6.2 tests.
 *
 * The toggle is a pure controlled component. These tests pin the contract
 * that the chat composer relies on:
 *   - Off by default (parent passes enabled=false initially).
 *   - aria-pressed/aria-checked reflect the current `enabled` prop.
 *   - Clicking calls onToggle with the inverted value (so the parent can
 *     forward it as the 10th positional arg to chatService.sendMessage).
 *   - disabled prevents interaction (used while a message is in flight).
 */

const renderToggle = (props: Partial<React.ComponentProps<typeof DeepThinkingToggle>> = {}) => {
	const onToggle = props.onToggle ?? vi.fn();
	const utils = render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="dark">
				<DeepThinkingToggle
					enabled={props.enabled ?? false}
					onToggle={onToggle}
					disabled={props.disabled}
				/>
			</ThemeProvider>
		</I18nextProvider>
	);
	return { ...utils, onToggle };
};

describe('DeepThinkingToggle (M6.2)', () => {
	it('renders with aria-pressed=false when enabled is false', () => {
		renderToggle({ enabled: false });
		const btn = screen.getByTestId('deep-thinking-toggle');
		expect(btn).toHaveAttribute('aria-pressed', 'false');
		expect(btn).toHaveAttribute('aria-checked', 'false');
	});

	it('renders with aria-pressed=true when enabled is true', () => {
		renderToggle({ enabled: true });
		const btn = screen.getByTestId('deep-thinking-toggle');
		expect(btn).toHaveAttribute('aria-pressed', 'true');
		expect(btn).toHaveAttribute('aria-checked', 'true');
	});

	it('invokes onToggle(true) when clicked while off', async () => {
		const user = userEvent.setup();
		const { onToggle } = renderToggle({ enabled: false });
		await user.click(screen.getByTestId('deep-thinking-toggle'));
		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it('invokes onToggle(false) when clicked while on', async () => {
		const user = userEvent.setup();
		const { onToggle } = renderToggle({ enabled: true });
		await user.click(screen.getByTestId('deep-thinking-toggle'));
		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it('does not invoke onToggle when disabled', async () => {
		const user = userEvent.setup();
		const { onToggle } = renderToggle({ enabled: false, disabled: true });
		await user.click(screen.getByTestId('deep-thinking-toggle'));
		expect(onToggle).not.toHaveBeenCalled();
	});
});
