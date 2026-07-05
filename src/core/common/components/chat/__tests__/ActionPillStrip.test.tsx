import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { setupUser } from '@/test/test-utils.tsx';
import React from 'react';
import ActionPillStrip, { PILL_STRIP_INITIAL_COUNT } from '../ActionPillStrip';
import { VibeAction } from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Mock ActionPill so strip tests stay focused on collapse/expand logic.
// Each pill renders its action.descriptions as a data-testid anchor.
// ---------------------------------------------------------------------------
vi.mock('../ActionPill', () => ({
	default: ({ action }: { action: VibeAction }) => (
		<span data-testid={`pill-${action.id}`}>{action.descriptions}</span>
	),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (_key: string, fallback: string) => fallback,
		i18n: { language: 'en' },
	}),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAction(id: string, type: string = Actions.Add_New_Task): VibeAction {
	return {
		id,
		descriptions: `Action ${id}`,
		type: type as VibeAction['type'],
		creationTimeInMs: 0,
		status: Status.Parsed,
		beforeScheduleId: null,
		afterScheduleId: null,
		vibeRequest: null,
	};
}

function renderStrip(actions: VibeAction[]) {
	return render(
		<ThemeProvider>
			<ActionPillStrip actions={actions} />
		</ThemeProvider>
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActionPillStrip', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('when actions count is within the initial limit', () => {
		it('renders all pills when there are fewer than the limit', () => {
			const actions = [makeAction('a1'), makeAction('a2')];
			renderStrip(actions);
			expect(screen.getByTestId('pill-a1')).toBeInTheDocument();
			expect(screen.getByTestId('pill-a2')).toBeInTheDocument();
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('renders all pills when the count equals the initial limit exactly', () => {
			const actions = Array.from({ length: PILL_STRIP_INITIAL_COUNT }, (_, i) =>
				makeAction(`a${i}`)
			);
			renderStrip(actions);
			for (let i = 0; i < PILL_STRIP_INITIAL_COUNT; i++) {
				expect(screen.getByTestId(`pill-a${i}`)).toBeInTheDocument();
			}
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});
	});

	describe('when actions count exceeds the initial limit', () => {
		it('shows only the first PILL_STRIP_INITIAL_COUNT pills by default', () => {
			const total = PILL_STRIP_INITIAL_COUNT + 3;
			const actions = Array.from({ length: total }, (_, i) => makeAction(`a${i}`));
			renderStrip(actions);
			for (let i = 0; i < PILL_STRIP_INITIAL_COUNT; i++) {
				expect(screen.getByTestId(`pill-a${i}`)).toBeInTheDocument();
			}
			for (let i = PILL_STRIP_INITIAL_COUNT; i < total; i++) {
				expect(screen.queryByTestId(`pill-a${i}`)).not.toBeInTheDocument();
			}
		});

		it('shows a "+X more" button with the correct overflow count', () => {
			const overflow = 4;
			const actions = Array.from({ length: PILL_STRIP_INITIAL_COUNT + overflow }, (_, i) =>
				makeAction(`a${i}`)
			);
			renderStrip(actions);
			const btn = screen.getByRole('button', { name: /more/i });
			expect(btn).toBeInTheDocument();
			expect(btn.textContent).toContain(`+${overflow}`);
		});

		it('expands to show all pills after clicking the more button', async () => {
			const user = setupUser();
			const total = PILL_STRIP_INITIAL_COUNT + 2;
			const actions = Array.from({ length: total }, (_, i) => makeAction(`a${i}`));
			renderStrip(actions);
			await user.click(screen.getByRole('button', { name: /more/i }));
			for (let i = 0; i < total; i++) {
				expect(screen.getByTestId(`pill-a${i}`)).toBeInTheDocument();
			}
		});

		it('hides the more button after expanding', async () => {
			const user = setupUser();
			const actions = Array.from({ length: PILL_STRIP_INITIAL_COUNT + 1 }, (_, i) =>
				makeAction(`a${i}`)
			);
			renderStrip(actions);
			await user.click(screen.getByRole('button', { name: /more/i }));
			expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument();
		});

		it('shows a collapse button after expanding', async () => {
			const user = setupUser();
			const actions = Array.from({ length: PILL_STRIP_INITIAL_COUNT + 1 }, (_, i) =>
				makeAction(`a${i}`)
			);
			renderStrip(actions);
			await user.click(screen.getByRole('button', { name: /more/i }));
			expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
		});

		it('collapses back after clicking show less', async () => {
			const user = setupUser();
			const total = PILL_STRIP_INITIAL_COUNT + 2;
			const actions = Array.from({ length: total }, (_, i) => makeAction(`a${i}`));
			renderStrip(actions);
			await user.click(screen.getByRole('button', { name: /more/i }));
			await user.click(screen.getByRole('button', { name: /show less/i }));
			// Back to initial state
			for (let i = 0; i < PILL_STRIP_INITIAL_COUNT; i++) {
				expect(screen.getByTestId(`pill-a${i}`)).toBeInTheDocument();
			}
			for (let i = PILL_STRIP_INITIAL_COUNT; i < total; i++) {
				expect(screen.queryByTestId(`pill-a${i}`)).not.toBeInTheDocument();
			}
			expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
		});
	});

	describe('filtering', () => {
		it('excludes conversational_and_not_supported actions before applying the limit', () => {
			// 2 real + 5 conversational — only 2 real should render, no more button
			const actions = [
				makeAction('real1', Actions.Add_New_Task),
				makeAction('real2', Actions.Add_New_Task),
				...Array.from({ length: 5 }, (_, i) =>
					makeAction(`conv${i}`, Actions.Conversational_And_Not_Supported)
				),
			];
			renderStrip(actions);
			expect(screen.getByTestId('pill-real1')).toBeInTheDocument();
			expect(screen.getByTestId('pill-real2')).toBeInTheDocument();
			for (let i = 0; i < 5; i++) {
				expect(screen.queryByTestId(`pill-conv${i}`)).not.toBeInTheDocument();
			}
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('applies the limit to filtered actions only', () => {
			// PILL_STRIP_INITIAL_COUNT real + 1 extra real + some conversational
			const actions = [
				...Array.from({ length: PILL_STRIP_INITIAL_COUNT + 1 }, (_, i) =>
					makeAction(`real${i}`, Actions.Add_New_Task)
				),
				makeAction('conv0', Actions.Conversational_And_Not_Supported),
			];
			renderStrip(actions);
			// Overflow button should show for the 1 extra real action
			expect(screen.getByRole('button', { name: /\+1 more/i })).toBeInTheDocument();
		});
	});

	describe('edge cases', () => {
		it('renders nothing when actions array is empty', () => {
			const { container } = renderStrip([]);
			expect(container.firstChild).toBeNull();
		});

		it('renders nothing when all actions are conversational', () => {
			const actions = Array.from({ length: 5 }, (_, i) =>
				makeAction(`conv${i}`, Actions.Conversational_And_Not_Supported)
			);
			const { container } = renderStrip(actions);
			expect(container.firstChild).toBeNull();
		});
	});
});
