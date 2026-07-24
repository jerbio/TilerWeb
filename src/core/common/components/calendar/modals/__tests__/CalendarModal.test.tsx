import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { createPortal } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { lightTheme } from '@/core/theme/light';
import CalendarModal from '..';

function StatefulChild({ onMount }: { onMount: () => void }) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		onMount();
	}, [onMount]);

	return (
		<button type="button" onClick={() => setCount((prev) => prev + 1)}>
			Count {count}
		</button>
	);
}

function Harness({ expanded, onMount }: { expanded: boolean; onMount: () => void }) {
	const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);

	return (
		<ThemeProvider theme={lightTheme}>
			<CalendarModal open containerRef={setPortalTarget} expanded={expanded} width={480} />
			{portalTarget && createPortal(<StatefulChild onMount={onMount} />, portalTarget)}
		</ThemeProvider>
	);
}

describe('CalendarModal portal host', () => {
	it('preserves portaled child state when toggling expanded layout', async () => {
		const user = userEvent.setup();
		const onMount = vi.fn();
		const { rerender } = render(<Harness expanded={false} onMount={onMount} />);

		await user.click(screen.getByRole('button', { name: 'Count 0' }));
		expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();

		rerender(<Harness expanded onMount={onMount} />);

		expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
		expect(onMount).toHaveBeenCalledTimes(1);
	});
});
