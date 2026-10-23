/**
 * Integration tests for Chat review-mode transition behaviors (TDD).
 *
 * The two critical UX contracts verified here:
 *
 * 1. Clicking "Apply now" in SimulationReviewPanel must exit review mode
 *    SYNCHRONOUSLY (before any await / API call resolves).  The existing
 *    LoadingIndicator + WebSocket infrastructure then provides live
 *    feedback — there is no separate "applying" state inside the panel.
 *
 * 2. Submitting a new chat message while in review must also exit review
 *    SYNCHRONOUSLY before the sendMessage API call is awaited.
 *
 * Both tests use a deferred promise for the API call so they can assert
 * on the store state BEFORE the call resolves.
 *
 * Setup summary
 * ─────────────
 * The tests render the real <Chat> component with all heavyweight
 * dependencies mocked.  State is seeded by having the mock services
 * return the right data in the normal component-mount flow:
 *
 *   getVibeSessions  → session-1
 *   getMessages      → msg-1 (requestId=req-1, embedded vibeRequest cached)
 *   requestId effect → setVibeRequest(mockVibeRequest) from cache
 *   getSimulationForRequest → mockSimulation (state: Ready)
 *   prefetch effect  → getSimulationResult → setSimulationResult
 *   SimulationStatusStrip renders [data-testid="review-simulation-button"]
 *   click it         → Chat.enterReview → store.enterReview → inReview=true
 *   SimulationReviewPanel renders "Apply now" button
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import Chat from './chat';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import { SimulationState } from '@/core/common/types/chat';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarRequestProvider } from '@/core/common/components/calendar/CalendarRequestProvider';
import { locationService } from '@/services/locationService';
import { LocationPicker } from '@/components/location/LocationSelector';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_REQUEST_ID = 'req-1';
const MOCK_SESSION_ID = 'session-1';
const MOCK_SIM_ID = 'sim-1';

const MOCK_VIBE_REQUEST = {
	id: MOCK_REQUEST_ID,
	creationTimeInMs: 1,
	activeAction: null,
	isClosed: false,
	beforeScheduleId: null,
	afterScheduleId: null,
	actions: [],
	previews: [], // no embedded preview → simulation comes from getSimulationForRequest
};

const MOCK_SIMULATION = {
	id: MOCK_SIM_ID,
	vibeRequestId: MOCK_REQUEST_ID,
	tilerUserId: 'user-1',
	creationTimeInMs: 1,
	state: SimulationState.Ready,
	previewActions: [],
};

const MOCK_SIMULATION_RESULT = {
	preview: { subEvents: [], calendarEvents: [] },
};

const MOCK_MESSAGE = {
	id: 'msg-000000000000000001',
	content: 'Test message',
	requestId: MOCK_REQUEST_ID,
	sessionId: MOCK_SESSION_ID,
	origin: 'user' as const,
	actionId: null,
	actionIds: [], // empty → no extra getActions round-trip
	actions: [],
};

// ---------------------------------------------------------------------------
// i18n (global mock via setup.ts, augmented here for completeness)
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => {
	// Define `t` ONCE so every call to useTranslation() returns the same
	// stable reference. If `t` were an inline arrow, it would be a new object
	// on each render, making useCallback([..., t]) unstable → infinite loop.
	const t = (_k: string, fallback?: string) => fallback ?? _k;
	const i18nObj = { language: 'en' };
	return {
		// i18n config (src/i18n/config.ts) calls .use(initReactI18next)
		initReactI18next: { type: '3rdParty', init: vi.fn() },
		useTranslation: () => ({ t, i18n: i18nObj }),
		Trans: ({ children }: { children: React.ReactNode }) => children,
	};
});

// ---------------------------------------------------------------------------
// Hoisted mock objects (must be created with vi.hoisted so they are available
// when vi.mock factories run — vi.mock calls are hoisted to file top).
// ---------------------------------------------------------------------------

const mockGetActivePersonaSession = vi.hoisted(() =>
	vi.fn(() => ({
		userId: 'user-1',
		personaId: 'persona-1',
		userInfo: { id: 'user-1', email: 'test@test.com' },
		chatContext: [],
		scheduleId: null,
		chatSessionId: null,
	}))
);
const mockUpdateActivePersonaSession = vi.hoisted(() => vi.fn());
const mockSetScheduleId = vi.hoisted(() => vi.fn());

const mockChatService = vi.hoisted(() => ({
	getVibeSessions: vi.fn(),
	getMessages: vi.fn(),
	getVibeRequest: vi.fn(),
	getSimulationForRequest: vi.fn(),
	getSimulationResult: vi.fn(),
	getActions: vi.fn(),
	sendChatAcceptChanges: vi.fn(),
	sendMessage: vi.fn(),
	getAutoSuggestions: vi.fn(async () => ({ suggestions: {}, isStale: false })),
	refreshAutoSuggestions: vi.fn(async () => ({ suggestions: {}, isStale: false })),
}));

// ---------------------------------------------------------------------------
// Global-state (useAppStore)
// ---------------------------------------------------------------------------

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector: (state: unknown) => unknown) => {
			const state = {
				getActivePersonaSession: mockGetActivePersonaSession,
				updateActivePersonaSession: mockUpdateActivePersonaSession,
				setScheduleId: mockSetScheduleId,
			};
			return selector(state);
		},
		{
			getState: () => ({
				getActivePersonaSession: mockGetActivePersonaSession,
				devUserIdOverride: null,
			}),
		}
	),
	SessionType: { ANONYMOUS: 'ANONYMOUS', AUTHENTICATED: 'AUTHENTICATED' },
}));

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

vi.mock('@/services', () => ({
	chatService: mockChatService,
}));

vi.mock('@/services/locationService', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/services/locationService')>();
	const service = new actual.LocationService();
	vi.spyOn(service, 'hasSelectionDecision').mockReturnValue(true);
	vi.spyOn(service, 'openPicker');
	vi.spyOn(service, 'requestSelectionDecision');
	return { ...actual, locationService: service, default: service };
});

vi.mock('@/services/SocketService', () => ({
	// Must be a class (not an arrow function) so `new SignalRService()` works.
	SignalRService: class {
		createConnection = vi.fn();
		subscribe = vi.fn();
		dispose = vi.fn();
	},
	Hubs: {
		VibeUpdate: {
			name: 'vibeUpdateHub',
			events: { RefreshData: 'refreshDataFromSockets', PreviewReady: 'previewReady' },
			server: { JoinUserGroup: 'joinUserGroup' },
		},
		ScheduleChange: {
			name: 'scheduleChange',
			events: { RefreshData: 'refereshDataFromSockets' },
		},
	},
}));

// ---------------------------------------------------------------------------
// Analytics & feature flags
// ---------------------------------------------------------------------------

vi.mock('@/core/util/analytics', () => ({
	default: {
		trackChatEvent: vi.fn(),
		trackError: vi.fn(),
		trackEvent: vi.fn(),
	},
}));

vi.mock('@/config/demo_config', () => ({
	isDemoMode: vi.fn().mockReturnValue(false),
	getDemoData: vi.fn().mockReturnValue({ chatMessages: [] }),
}));

// ---------------------------------------------------------------------------
// Simulation polling — no-op so we rely on requestId-effect for simulation
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useSimulationPolling', () => ({
	default: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Heavy sub-components that would require extra setup
// ---------------------------------------------------------------------------

vi.mock('@/core/common/components/chat/session-history/SessionHistory', () => ({
	default: () => null,
}));

vi.mock('@/core/common/components/chat/MarkdownRenderer', () => ({
	MarkdownRenderer: ({ content }: { content: string }) => <>{content}</>,
}));

vi.mock('@/core/common/components/chat/prompt-suggestions/PromptSuggestions', () => ({
	default: ({ onPromptClick }: { onPromptClick: (key: string, text: string) => void }) => (
		<button onClick={() => onPromptClick('lunch', 'Find lunch near me')}>Sample prompt</button>
	),
}));

vi.mock('@/core/common/components/error-popup/ErrorPopup', () => ({
	default: () => null,
}));

vi.mock('@/core/common/components/email-confirmation/EmailConfirmationModal', () => ({
	default: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<CalendarRequestProvider>
				{children}
				<LocationPicker />
			</CalendarRequestProvider>
		</ThemeProvider>
	);
}

function renderChat() {
	return render(<Chat />, { wrapper: Providers });
}

/**
 * Seed all mock service calls so Chat bootstraps into a state where the
 * SimulationStatusStrip shows the "Review simulation" button.
 */
function seedMockServices() {
	// Session lookup → session-1
	mockChatService.getVibeSessions.mockResolvedValue({
		Content: {
			vibeSessions: [{ id: MOCK_SESSION_ID, creationTimeInMs: 1000, title: 'Test' }],
		},
	});

	// Message history → one message with requestId + embedded vibeRequest
	mockChatService.getMessages.mockResolvedValue({
		Content: {
			chats: [MOCK_MESSAGE],
			vibeRequests: [MOCK_VIBE_REQUEST],
		},
	});

	// Simulation for request → used by the requestId effect
	mockChatService.getSimulationForRequest.mockResolvedValue({
		Content: { preview: MOCK_SIMULATION },
	});

	// Preview schedule → used by the background prefetch (simulation state: Ready)
	mockChatService.getSimulationResult.mockResolvedValue({
		Content: MOCK_SIMULATION_RESULT,
	});

	// VibeRequest → used by useHasUnexecutedActions (returns isClosed: true → no unexecuted)
	mockChatService.getVibeRequest.mockResolvedValue({
		Content: { vibeRequest: { isClosed: true } },
	});

	// getActions → called only when messages have actionIds (ours don't)
	mockChatService.getActions.mockResolvedValue([]);
}

/**
 * Wait for Chat to finish bootstrapping and enter review mode.
 * Returns after "Apply now" is visible in the DOM.
 */
async function waitForReviewMode() {
	// 1. SimulationStatusStrip should appear once simulation is Ready
	await waitFor(
		() => {
			expect(screen.getByTestId('review-simulation-button')).toBeInTheDocument();
		},
		{ timeout: 5000 }
	);

	// 2. Click the review button → Chat.enterReview → store.enterReview → inReview=true
	fireEvent.click(screen.getByTestId('review-simulation-button'));

	// 3. SimulationReviewPanel renders with "Apply now"
	await waitFor(
		() => {
			expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
		},
		{ timeout: 5000 }
	);
}

// ---------------------------------------------------------------------------
// Store reset between tests
// ---------------------------------------------------------------------------

const initialStoreState = useSimulationOverlayStore.getState();

beforeEach(() => {
	locationService.initialize();
	locationService.closePicker();
	locationService.store.setState(locationService.store.getInitialState(), true);
	vi.clearAllMocks();
	vi.mocked(locationService.hasSelectionDecision).mockReturnValue(true);
	seedMockServices();
	useSimulationOverlayStore.setState(initialStoreState, true);
});

afterEach(() => {
	locationService.closePicker();
	useSimulationOverlayStore.setState(initialStoreState, true);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Chat review transitions', () => {
	it('preserves the message and opens location selection before sending without a decision', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Find lunch near me' } });
		fireEvent.submit(input.closest('form')!);
		expect(locationService.openPicker).toHaveBeenCalledWith(true);
		expect(mockChatService.sendMessage).not.toHaveBeenCalled();
		expect(input).toHaveValue('Find lunch near me');
		expect(useSimulationOverlayStore.getState().inReview).toBe(true);
	});

	it('requires a location decision before accepting changes and preserves the review', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await waitForReviewMode();
		fireEvent.click(screen.getByRole('button', { name: /apply now/i }));
		expect(locationService.openPicker).toHaveBeenCalledWith(true);
		expect(mockChatService.sendChatAcceptChanges).not.toHaveBeenCalled();
		expect(useSimulationOverlayStore.getState().inReview).toBe(true);
	});

	it('automatically sends the pending message once after address confirmation', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		mockChatService.sendMessage.mockResolvedValueOnce({
			Content: {
				vibeResponse: {
					prompts: {
						sent: { ...MOCK_MESSAGE, id: 'sent', content: 'Find lunch near me' },
					},
				},
			},
		});
		renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Find lunch near me' } });
		fireEvent.submit(input.closest('form')!);
		fireEvent.submit(input.closest('form')!);
		expect(locationService.requestSelectionDecision).toHaveBeenCalledOnce();
		expect(mockChatService.sendMessage).not.toHaveBeenCalled();
		act(() => {
			locationService.previewAddress({
				id: 'office',
				address: '350 Fifth Avenue',
				latitude: 40.7484,
				longitude: -73.9857,
				isVerified: true,
				isDefault: false,
				isNull: false,
				description: '',
				thirdPartyId: '',
				userId: null,
				source: 'google',
				nickname: '',
			});
		});
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.confirm' }));
		await waitFor(() => expect(mockChatService.sendMessage).toHaveBeenCalledOnce());
		expect(mockChatService.sendMessage).toHaveBeenCalledWith(
			'Find lunch near me',
			'',
			MOCK_SESSION_ID,
			'user-1',
			'-73.9857',
			'40.7484',
			'true',
			'',
			'',
			expect.anything()
		);
		await waitFor(() => expect(input).toHaveValue(''));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(await screen.findByText('Find lunch near me')).toBeVisible();
	});

	it('automatically sends the pending message after continuing without location', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Plan my afternoon' } });
		fireEvent.submit(input.closest('form')!);
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.continueWithout' }));
		await waitFor(() => expect(mockChatService.sendMessage).toHaveBeenCalledOnce());
		expect(mockChatService.sendMessage).toHaveBeenCalledWith(
			'Plan my afternoon',
			'',
			MOCK_SESSION_ID,
			'user-1',
			'',
			'',
			'false',
			'',
			'',
			expect.anything()
		);
	});

	it('keeps a cancelled draft unsent even after a later location choice', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Keep this draft' } });
		fireEvent.submit(input.closest('form')!);
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.close' }));
		await act(async () => {
			locationService.continueWithoutLocation();
		});
		expect(mockChatService.sendMessage).not.toHaveBeenCalled();
		expect(input).toHaveValue('Keep this draft');
		expect(useSimulationOverlayStore.getState().inReview).toBe(true);
		fireEvent.submit(input.closest('form')!);
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.continueWithout' }));
		await waitFor(() => expect(mockChatService.sendMessage).toHaveBeenCalledOnce());
	});

	it('resumes a pending acceptance after a location decision', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await waitForReviewMode();
		fireEvent.click(screen.getByRole('button', { name: /apply now/i }));
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.continueWithout' }));
		await waitFor(() => expect(mockChatService.sendChatAcceptChanges).toHaveBeenCalledOnce());
		expect(useSimulationOverlayStore.getState().inReview).toBe(false);
	});

	it('resumes a suggested prompt with its original text after the location choice', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		renderChat();
		await screen.findByTestId('review-simulation-button');
		fireEvent.click(screen.getByRole('button', { name: 'Sample prompt' }));
		expect(mockChatService.sendMessage).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.continueWithout' }));
		await waitFor(() => expect(mockChatService.sendMessage).toHaveBeenCalledOnce());
		expect(mockChatService.sendMessage.mock.calls[0][0]).toBe('Find lunch near me');
	});

	it('preserves the draft on a resumed send failure and allows an explicit retry', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		mockChatService.sendMessage.mockRejectedValueOnce(new Error('Message could not be sent'));
		renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Retry this message' } });
		fireEvent.submit(input.closest('form')!);
		fireEvent.click(screen.getByRole('button', { name: 'schedulingLocation.continueWithout' }));
		await screen.findByText(/Message could not be sent/);
		expect(input).toHaveValue('Retry this message');
		expect(mockChatService.sendMessage).toHaveBeenCalledOnce();
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(true);
		fireEvent.submit(input.closest('form')!);
		await waitFor(() => expect(mockChatService.sendMessage).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(input).toHaveValue(''));
	});

	it('does not send the pending draft after switching personas', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		const originalSession = mockGetActivePersonaSession();
		const view = renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Do not send in another persona' } });
		fireEvent.submit(input.closest('form')!);
		try {
			mockGetActivePersonaSession.mockReturnValue({
				...originalSession,
				personaId: 'persona-2',
			});
			view.rerender(<Chat />);
			await act(async () => {
				locationService.continueWithoutLocation();
			});
			expect(mockChatService.sendMessage).not.toHaveBeenCalled();
			expect(locationService.store.getState().pickerOpen).toBe(false);
		} finally {
			mockGetActivePersonaSession.mockReturnValue(originalSession);
		}
	});

	it('cancels the pending send when chat unmounts', async () => {
		vi.mocked(locationService.hasSelectionDecision).mockReturnValue(false);
		const view = renderChat();
		await waitForReviewMode();
		const input = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
		fireEvent.change(input, { target: { value: 'Do not send after closing chat' } });
		fireEvent.submit(input.closest('form')!);
		view.unmount();
		await act(async () => {
			locationService.continueWithoutLocation();
		});
		expect(mockChatService.sendMessage).not.toHaveBeenCalled();
		expect(locationService.store.getState().pickerOpen).toBe(false);
	});

	// ── Apply now ────────────────────────────────────────────────────────────

	describe('clicking "Apply now"', () => {
		it('exits review mode synchronously BEFORE sendChatAcceptChanges resolves', async () => {
			// Keep the API call pending so we can assert mid-flight.
			let resolveApi!: (val: unknown) => void;
			const apiDeferred = new Promise((r) => {
				resolveApi = r;
			});
			mockChatService.sendChatAcceptChanges.mockReturnValueOnce(apiDeferred);

			renderChat();
			await waitForReviewMode();

			// Sanity: we are in review mode before clicking Apply.
			expect(useSimulationOverlayStore.getState().inReview).toBe(true);

			// Click Apply — acceptAllChanges fires.
			fireEvent.click(screen.getByRole('button', { name: /apply now/i }));

			// inReview must be false NOW, before the API call resolves.
			// This assertion FAILS with the old code (exitReview after await)
			// and PASSES after the fix (exitReview before await).
			expect(useSimulationOverlayStore.getState().inReview).toBe(false);

			// Let the API resolve to avoid act() warnings.
			await act(async () => {
				resolveApi({ Content: { vibeRequest: { afterScheduleId: null } } });
			});
		});

		it('keeps inReview false even if the API call rejects', async () => {
			mockChatService.sendChatAcceptChanges.mockRejectedValueOnce(new Error('network error'));

			renderChat();
			await waitForReviewMode();

			fireEvent.click(screen.getByRole('button', { name: /apply now/i }));

			// After clicking, inReview should be false immediately.
			expect(useSimulationOverlayStore.getState().inReview).toBe(false);

			// Wait for the rejection to propagate (error displayed in chat UI).
			await act(async () => {});
		});
	});

	// ── Send message while in review ─────────────────────────────────────────

	describe('sending a new message while in review', () => {
		it('exits review mode synchronously BEFORE sendMessage resolves', async () => {
			// Keep sendMessage pending.
			let resolveMsg!: (val: unknown) => void;
			const msgDeferred = new Promise((r) => {
				resolveMsg = r;
			});
			mockChatService.sendMessage.mockReturnValueOnce(msgDeferred);

			renderChat();
			await waitForReviewMode();

			// Sanity.
			expect(useSimulationOverlayStore.getState().inReview).toBe(true);

			// Type a message into the input (not mobile, so form is visible).
			// The mock t() returns the translation KEY when no fallback is given.
			const textarea = screen.getByPlaceholderText('home.expanded.chat.inputPlaceholder');
			fireEvent.change(textarea, { target: { value: 'Follow-up message' } });

			// Submit the form.
			fireEvent.submit(textarea.closest('form')!);

			// inReview must be false NOW, before sendMessage resolves.
			// This assertion FAILS with the old code (no exitReview in handleSubmit)
			// and PASSES after the fix (exitReview at the start of handleSubmit).
			expect(useSimulationOverlayStore.getState().inReview).toBe(false);

			// Let the message API resolve to avoid act() warnings.
			await act(async () => {
				resolveMsg({
					Content: {
						vibeResponse: {
							tilerUser: null,
							prompts: {
								p1: {
									id: 'p1',
									requestId: 'req-2',
									sessionId: MOCK_SESSION_ID,
									origin: 'system',
									content: 'OK',
									actionId: null,
									actions: [],
								},
							},
						},
					},
				});
			});
		});
	});
});
