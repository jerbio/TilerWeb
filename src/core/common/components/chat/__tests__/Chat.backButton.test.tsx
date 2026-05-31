import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Service / store mocks – must be hoisted before the component import
// ---------------------------------------------------------------------------

const mockGetActivePersonaSession = vi.fn(() => ({
	chatContext: [],
	scheduleId: null,
	personaId: 'persona-1',
	userId: 'user-1',
	userInfo: { id: 'user-1' },
	chatSessionId: '',
}));
const mockUpdateActivePersonaSession = vi.fn();
const mockSetScheduleId = vi.fn();
const mockRemoveChatContext = vi.fn();

vi.mock('@/global_state', () => ({
	__esModule: true,
	default: Object.assign(
		(selector?: (state: unknown) => unknown) => {
			const state = {
				getActivePersonaSession: mockGetActivePersonaSession,
				updateActivePersonaSession: mockUpdateActivePersonaSession,
				setScheduleId: mockSetScheduleId,
				removeChatContext: mockRemoveChatContext,
				devUserIdOverride: null,
			};
			return selector ? selector(state) : state;
		},
		{
			getState: () => ({
				getActivePersonaSession: mockGetActivePersonaSession,
				devUserIdOverride: null,
			}),
		}
	),
}));

vi.mock('react-i18next', () => ({
	// Minimal i18next plugin shim — i18n.use(initReactI18next) must not throw.
	// i18next checks `plugin.type` and calls `plugin.init(services)` at startup.
	initReactI18next: { type: '3rdParty', init: vi.fn() },
	useTranslation: () => ({
		t: (_key: string, fallback?: string) => fallback ?? _key,
		i18n: { language: 'en' },
	}),
}));

vi.mock('@/services', () => ({
	chatService: {
		getVibeSessions: vi.fn().mockResolvedValue({ Content: { vibeSessions: [] } }),
		getMessages: vi.fn().mockResolvedValue({ Content: { chats: [] } }),
		getActions: vi.fn().mockResolvedValue([]),
		sendMessage: vi.fn(),
		sendChatAcceptChanges: vi.fn(),
		getVibeRequest: vi.fn().mockResolvedValue(null),
	},
}));

vi.mock('@/services/locationService', () => ({
	locationService: {
		getCurrentLocation: vi.fn().mockResolvedValue({}),
		toApiFormat: vi.fn().mockReturnValue({
			userLongitude: 0,
			userLatitude: 0,
			userLocationVerified: false,
		}),
	},
}));

vi.mock('@/services/SocketService', () => ({
	SignalRService: class {
		createConnection = vi.fn();
		subscribeToSocketDataReceipt = vi.fn();
	},
}));

vi.mock('@/core/util/analytics', () => ({
	default: {
		trackChatEvent: vi.fn(),
		trackError: vi.fn(),
	},
}));

vi.mock('@/config/demo_config', () => ({
	isDemoMode: vi.fn().mockReturnValue(false),
	getDemoData: vi.fn().mockReturnValue({ chatMessages: [] }),
}));

// Stub heavy child components to keep tests focused
vi.mock('@/core/common/components/chat/session-history/SessionHistory', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/error-popup/ErrorPopup', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/email-confirmation/EmailConfirmationModal', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/chat/prompt-suggestions/PromptSuggestions', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/chat/user_location', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/loading-indicator', () => ({
	default: ({ message }: { message: string }) => <div>{message}</div>,
}));
vi.mock('@/core/common/components/chat/ActionPill', () => ({
	default: () => null,
}));
vi.mock('@/core/common/components/chat/MarkdownRenderer', () => ({
	MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import Chat from '../chat';

function renderChat(props: React.ComponentProps<typeof Chat> = {}) {
	return render(<Chat {...props} />, {
		wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Chat – back button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('does not render the back button when onClose is not provided', () => {
		renderChat();
		expect(screen.queryByTestId('chat-back-button-wrapper')).not.toBeInTheDocument();
	});

	it('renders the back button when onClose is provided', () => {
		renderChat({ onClose: vi.fn() });
		expect(screen.getByTestId('chat-back-button-wrapper')).toBeInTheDocument();
	});

	it('renders a visible "Back" label inside the back button', () => {
		renderChat({ onClose: vi.fn() });
		expect(screen.getByText('Back')).toBeInTheDocument();
	});

	it('calls onClose when the back button is clicked', async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		renderChat({ onClose });

		await user.click(screen.getByText('Back'));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it('back button wrapper is present in the DOM (CSS hides it at >= 1024px via BackButtonWrapper styled component)', () => {
		renderChat({ onClose: vi.fn() });
		// The wrapper exists in the DOM at all viewports; BackButtonWrapper applies
		// `display: none` via a media query at the lg breakpoint (1024px).
		// jsdom does not evaluate CSS media queries so responsive hiding is
		// validated by visual / e2e tests.
		const wrapper = screen.getByTestId('chat-back-button-wrapper');
		expect(wrapper).toBeInTheDocument();
	});
});
