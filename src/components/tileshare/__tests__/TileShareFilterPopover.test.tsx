import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, setupUser, waitFor } from '@/test/test-utils';
import TileShareFilterPopover from '../TileShareFilterPopover';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

function Controls() {
	const [open, setOpen] = useState<string | null>(null);
	const [checked, setChecked] = useState(false);
	const change = (name: string, value: boolean) =>
		setOpen((current) => (value ? name : current === name ? null : current));
	return (
		<>
			<TileShareFilterPopover
				label="Status"
				open={open === 'status'}
				onOpenChange={(value) => change('status', value)}
			>
				<fieldset>
					<legend>Status</legend>
					<label>
						<input
							type="checkbox"
							checked={checked}
							onChange={(event) => setChecked(event.target.checked)}
						/>
						Delegated
					</label>
				</fieldset>
			</TileShareFilterPopover>
			<TileShareFilterPopover
				label="Response"
				open={open === 'response'}
				onOpenChange={(value) => change('response', value)}
			>
				<label>
					<input type="checkbox" />
					Awaiting response
				</label>
			</TileShareFilterPopover>
			<button type="button">Elsewhere</button>
		</>
	);
}
afterEach(() => vi.restoreAllMocks());

describe('floating TileShare filters', () => {
	it('mounts one floating panel at a time and keeps selected values after closing', async () => {
		render(<Controls />);
		const user = setupUser();
		await user.click(screen.getByRole('button', { name: 'Status' }));
		expect(screen.getByRole('dialog', { name: 'Status' })).toHaveStyle({ position: 'fixed' });
		await user.click(screen.getByRole('checkbox', { name: 'Delegated' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Response' }));
		expect(screen.getAllByRole('dialog')).toHaveLength(1);
		expect(screen.getByRole('dialog', { name: 'Response' })).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Status' }));
		expect(screen.getByRole('checkbox', { name: 'Delegated' })).toBeChecked();
	});
	it('closes on Escape and returns focus to the trigger', async () => {
		render(<Controls />);
		const user = setupUser();
		const trigger = screen.getByRole('button', { name: 'Status' });
		await user.click(trigger);
		expect(screen.getByRole('checkbox', { name: 'Delegated' })).toHaveFocus();
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
	});
	it('closes on an outside click without stealing focus', async () => {
		render(<Controls />);
		const user = setupUser();
		await user.click(screen.getByRole('button', { name: 'Status' }));
		const outside = screen.getByRole('button', { name: 'Elsewhere' });
		await user.click(outside);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(outside).toHaveFocus();
	});
	it('supports arrow opening, Shift+Tab back, and Tab to the next filter', async () => {
		render(<Controls />);
		const user = setupUser();
		const trigger = screen.getByRole('button', { name: 'Status' });
		trigger.focus();
		await user.keyboard('{ArrowDown}');
		expect(screen.getByRole('checkbox', { name: 'Delegated' })).toHaveFocus();
		await user.tab({ shift: true });
		expect(trigger).toHaveFocus();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		await user.keyboard('{Enter}');
		await user.tab();
		expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
		await user.tab();
		expect(screen.getByRole('button', { name: 'Response' })).toHaveFocus();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
	it('flips above its trigger and stays inside the viewport at the right edge', async () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
			this: HTMLElement
		) {
			return {
				left: this.tagName === 'BUTTON' ? 950 : 0,
				right: 1010,
				top: 700,
				bottom: 736,
				width: 60,
				height: 36,
				x: 950,
				y: 700,
				toJSON: () => ({}),
			};
		});
		vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(260);
		render(<Controls />);
		fireEvent.click(screen.getByRole('button', { name: 'Status' }));
		await waitFor(() => expect(screen.getByRole('dialog').style.visibility).toBe('visible'));
		const panel = screen.getByRole('dialog');
		expect(parseFloat(panel.style.top)).toBeLessThan(700);
		expect(parseFloat(panel.style.left) + parseFloat(panel.style.width)).toBeLessThanOrEqual(
			window.innerWidth - 12
		);
	});
});
