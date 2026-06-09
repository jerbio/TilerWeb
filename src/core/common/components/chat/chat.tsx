import React, { useCallback, useEffect, useLayoutEffect, useState, FormEvent, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { ChevronLeftIcon, SendHorizontal, CircleStop, History, SquarePen } from 'lucide-react';
import SessionHistory from '@/core/common/components/chat/session-history/SessionHistory';
import { VibeSession } from '@/core/common/types/chat';
import Button from '@/core/common/components/button';
import Input from '../input';
import Logo from '@/core/common/components/icons/logo';
import { useTranslation } from 'react-i18next';
import useAppStore, { ChatContextType } from '@/global_state';
import { PromptWithActions, VibeAction } from '@/core/common/types/chat';
// VibeSession imported above with SessionHistory
import { Status } from '@/core/constants/enums';
import { chatService } from '@/services';
import UserLocation from '@/core/common/components/chat/user_location';
import LoadingIndicator from '@/core/common/components/loading-indicator';
import { MarkdownRenderer } from '@/core/common/components/chat/MarkdownRenderer';
import { locationService } from '@/services/locationService';
import { SignalRService, Hubs } from '@/services/SocketService';
import { ChatLimitError } from '@/core/common/types/errors';
import ErrorPopup from '@/core/common/components/error-popup/ErrorPopup';
import EmailConfirmationModal from '@/core/common/components/email-confirmation/EmailConfirmationModal';
import PromptSuggestions from '@/core/common/components/chat/prompt-suggestions/PromptSuggestions';
import analytics from '@/core/util/analytics';
import { isDemoMode, getDemoData } from '@/config/demo_config';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import ActionPill from '@/core/common/components/chat/ActionPill';
import SimulationStatusStrip from '@/core/common/components/chat/SimulationStatusStrip';
import SimulationReviewPanel from '@/core/common/components/chat/SimulationReviewPanel';
import useSimulationPolling from '@/hooks/useSimulationPolling';
import {
	SimulationDto,
	SimulationScheduleResult,
	SimulationState,
	VibeRequest as VibeRequestType,
	PreviewReadyPayload,
} from '@/core/common/types/chat';
import {
	buildSimulationActionLookups,
	primeSimulationFromRequest,
	isRequestTerminal,
	isSimulationTerminal,
} from '@/core/util/simulationSelectors';
import useSimulationOverlayStore from '@/core/state/simulationOverlayStore';
import { useCalendarDispatch } from '@/core/common/components/calendar/CalendarRequestProvider';
import {
	CalendarEntityType,
	CalendarRequestType,
} from '@/core/common/components/calendar/calendarRequestContext';

// Custom hook to check unexecuted actions
const useHasUnexecutedActions = (requestId: string | null, messages: PromptWithActions[]) => {
	const [hasUnexecuted, setHasUnexecuted] = useState(false);

	useEffect(() => {
		const checkActions = async () => {
			if (!requestId) {
				setHasUnexecuted(false);
				return;
			}

			try {
				const response = await chatService.getVibeRequest(requestId);
				const isClosed = response?.Content?.vibeRequest?.isClosed;
				setHasUnexecuted(isClosed !== true);
			} catch (error) {
				console.error('Error checking vibe request status:', error);
				// Fallback to original logic if API fails
				const fallback = messages.some((msg) =>
					msg.actions?.some(
						(action) =>
							action.status !== Status.Executed && action.status !== Status.Exited
					)
				);
				setHasUnexecuted(fallback);
			}
		};

		checkActions();
	}, [requestId, messages]); // Re-check when requestId or messages change

	return hasUnexecuted;
};

const ChatWrapper = styled.section`
	height: 100%;
	position: relative;
	display: flex;
	flex-direction: column;
`;

const ChatContainer = styled.section<{ $mobilereview?: boolean }>`
	position: ${(props) => (props.$mobilereview ? 'relative' : 'absolute')};
	inset: ${(props) => (props.$mobilereview ? 'auto' : '0')};
	flex: ${(props) => (props.$mobilereview ? '1 1 auto' : '0 0 auto')};
	height: ${(props) => (props.$mobilereview ? 'auto' : '100%')};
	width: 100%;
	display: flex;
	flex-direction: column;
	padding: ${(props) => (props.$mobilereview ? '8px 12px 12px' : '1.5rem')};

	@media screen and (min-width: ${({ theme }) => theme.screens.lg}) {
		position: absolute;
		inset: 0;
		height: 100%;
		flex: 0 0 auto;
		padding: 0;
	}
`;

const ChatHeader = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.5rem;

	@media screen and (min-width: ${({ theme }) => theme.screens.lg}) {
		padding: 0.75rem 0;
	}
`;

const ChatHeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	flex-shrink: 0;
`;

const ChatHeaderCenter = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	justify-content: center;
`;

const ChatHeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
`;

const ChatContextChips = styled.div`
	display: flex;
	gap: 0.25rem;
	overflow-x: auto;
	max-width: 150px;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const SessionTitleDisplay = styled.span`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 200px;
`;

const BackButtonWrapper = styled.div`
	@media screen and (min-width: ${({ theme }) => theme.screens.lg}) {
		display: none;
	}
`;

const HistoryButton = styled.button`
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const NewChatHeaderButton = styled.button`
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const ChatContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;

	.messages-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}
`;

const ChatForm = styled.form`
	position: relative;
	width: 100%; /* Ensure the form stretches fully */
	display: flex;
	align-items: center;
	gap: 0.5rem; /* Optional: Add spacing between elements */
	margin-top: 8px; /* Add some space above the form */
`;

const ChatButton = styled.button`
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	right: 0.5rem;
	height: 1.5rem;
	width: 1.5rem;
	display: grid;
	place-items: center;
	border-radius: ${({ theme }) => theme.borderRadius.xxLarge};
	background-color: ${({ theme }) => theme.colors.button.brand.bg};
	color: ${({ theme }) => theme.colors.button.brand.text};
`;

const EmptyChat = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	height: 100%;

	h3 {
		font-size: ${({ theme }) => theme.typography.fontSize.xl};
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		color: ${({ theme }) => theme.colors.text.primary};
		font-family: ${({ theme }) => theme.typography.fontFamily.urban};
		text-align: center;

		@media screen and (min-width: ${({ theme }) => theme.screens.lg}) {
			h3 {
				font-size: ${({ theme }) => theme.typography.fontSize.displayXs};
			}
		}
	}

	p {
		font-size: ${({ theme }) => theme.typography.fontSize.sm};
		color: ${({ theme }) => theme.colors.text.muted};
		font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
		text-align: center;
	}
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
	margin: 0.5rem 0;

	.message-content {
		background-color: ${({ $isUser, theme }) =>
			$isUser ? theme.colors.background.card2 : theme.colors.brand[500]};
		color: ${({ $isUser, theme }) =>
			$isUser ? theme.colors.text.primary : theme.colors.white};
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		max-width: 70%;
		word-wrap: break-word;
	}
`;

type ChatProps = {
	onClose?: () => void;
};

const MESSAGE_BATCH_SIZE = 10;
const ACTION_BATCH_SIZE = 10;
const SCROLL_TOP_THRESHOLD = 40;

const Chat: React.FC<ChatProps> = ({ onClose }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Get the active persona session - single source of truth
	const getActivePersonaSession = useAppStore((state) => state.getActivePersonaSession);
	const updateActivePersonaSession = useAppStore((state) => state.updateActivePersonaSession);
	const setScheduleId = useAppStore((state) => state.setScheduleId);
	const activePersonaSession = getActivePersonaSession();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesListRef = useRef<HTMLDivElement>(null);
	const webSocketCommunication = useRef<SignalRService | null>(null);
	const actionsByIdRef = useRef<Record<string, VibeAction>>({});
	const nextMessageIndexRef = useRef(0);
	const shouldPreserveScrollPositionRef = useRef(false);
	const shouldAutoScrollToBottomRef = useRef(false);
	const previousScrollHeightRef = useRef(0);
	const previousScrollTopRef = useRef(0);
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<PromptWithActions[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [isBatchLoading, setIsBatchLoading] = useState(false);
	const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
	const [hasMoreMessages, setHasMoreMessages] = useState(false);
	const [requestId, setRequestId] = useState<string | null>(null);
	const [webSocketStatus, setWebSocketStatus] = useState<string | null>(null);
	const [wsStatusKey, setWsStatusKey] = useState<string | null>(null);
	const [showErrorPopup, setShowErrorPopup] = useState(false);
	const [errorPopupMessage, setErrorPopupMessage] = useState('');
	const [showSessionHistory, setShowSessionHistory] = useState(false);
	const [currentSessionTitle, setCurrentSessionTitle] = useState<string | null>(null);

	// --- Simulated Schedule Experience (Phase 3.1) ----------------------------
	// Tracks the simulation row + parent VibeRequest for the *active* request.
	// Per-message simulation lookup can be layered on later by keying these by
	// requestId.
	const [simulation, setSimulation] = useState<SimulationDto | null>(null);
	const [vibeRequest, setVibeRequest] = useState<VibeRequestType | null>(null);
	// Selection is the single source of truth shared with the calendar overlay
	// (plan §5.3.1) — both chip clicks here and tile clicks in
	// `CalendarWrapper` write through the store.
	const selectedActionId = useSimulationOverlayStore((s) => s.selectedActionId);
	const setSelectedActionId = useSimulationOverlayStore((s) => s.setSelectedActionId);
	const requestIdRef = useRef<string | null>(null);
	requestIdRef.current = requestId;
	// Plan §6.2 — the previewReady SignalR handler is bound once on mount
	// against `anonymousUserId`; it cannot close over the latest VibeRequest
	// without a ref. The ref lets the handler bail when a late `previewReady`
	// arrives for a request that has since become terminal (Applied / Closed),
	// avoiding a stale UI flip back to "Ready".
	const vibeRequestRef = useRef<VibeRequestType | null>(null);
	vibeRequestRef.current = vibeRequest;
	// Plan §6.5.2 — cache of VibeRequest payloads embedded in chat-history
	// responses (`getMessages` → `Content.vibeRequests`). When the active
	// requestId changes, the requestId effect consults this cache first
	// and skips the per-request `getVibeRequest` round-trip if a hydrated
	// entry (with `preview` / `previews`) is available. Single-fetch
	// session bootstrap, AC "Initial chat render needs no extra simulation
	// fetch" and AC "Refresh restores active simulation status".
	const vibeRequestCacheRef = useRef<Record<string, VibeRequestType>>({});

	// Phase 4.2 — lazy-fetched simulation result for the review panel.
	// Cached per `simulation.id`; re-entries do NOT re-fetch unless the id
	// changes (see `simulationResultIdRef` invalidation below).
	const [simulationResult, setSimulationResult] = useState<SimulationScheduleResult | null>(null);
	// `inReview` is owned by the cross-cut overlay store so the calendar
	// banner's Exit-review button (and any future surface) stays in sync
	// with the chat panel. Local writes go through the store API only.
	const inReview = useSimulationOverlayStore((s) => s.inReview);
	// Mobile review takeover: when reviewing a tilecast on a small viewport,
	// hide the chat header, message input, and location card so the review
	// panel dominates the side panel and the calendar grid (rendered
	// underneath the absolute-positioned side panel on mobile) becomes
	// visible above. The Apply / Exit footer inside the review panel
	// remains the only commit/cancel surface during this state.
	const isMobileViewport = useIsMobile(parseInt(theme.screens.lg, 10));
	const isMobileReview = isMobileViewport && inReview;
	const [isLoadingSimulationResult, setIsLoadingSimulationResult] = useState(false);
	const [simulationResultError, setSimulationResultError] = useState<string | null>(null);
	const simulationResultIdRef = useRef<string | null>(null);
	// Tracks an in-flight prefetch (or click-driven fetch) for a given
	// simulation id so concurrent calls to `enterReview` reuse the same
	// promise instead of issuing a duplicate `api/Vibe/Preview` request.
	const simulationResultPromiseRef = useRef<{
		id: string;
		promise: Promise<SimulationScheduleResult | null>;
	} | null>(null);

	// Plan §5.3.2 / §5.3.4 / §5.3.5 — when a simulation chip is selected (or
	// a tile is clicked, since both write through the same store) ask the
	// calendar to scroll to & pulse the matching tile. Debounced ~150ms so
	// rapid stepper presses (Previous/Next held down) only dispatch the
	// final selection — visuals (tier border, hue) update instantly because
	// they are pure derived state, but scroll/navigation is debounced.
	const calendarDispatch = useCalendarDispatch();
	const focusDispatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (!inReview || !simulation || !selectedActionId) return;
		const action = buildSimulationActionLookups(simulation).byActionId[selectedActionId];
		if (!action || !action.entityId || !action.entityType) return;
		if (focusDispatchTimerRef.current) {
			clearTimeout(focusDispatchTimerRef.current);
		}
		focusDispatchTimerRef.current = setTimeout(() => {
			calendarDispatch({
				type: CalendarRequestType.FocusEvent,
				entityId: action.entityId!,
				entityType: action.entityType as CalendarEntityType,
				actionType: action.action?.type ?? 'none',
			});
			focusDispatchTimerRef.current = null;
		}, 150);
		return () => {
			if (focusDispatchTimerRef.current) {
				clearTimeout(focusDispatchTimerRef.current);
				focusDispatchTimerRef.current = null;
			}
		};
	}, [inReview, simulation, selectedActionId, calendarDispatch]);

	// Drop the cached simulation result whenever the active simulation id changes
	// so the next review entry re-fetches against the new preview.
	useEffect(() => {
		const currentSimId = simulation?.id ?? null;
		if (simulationResultIdRef.current && simulationResultIdRef.current !== currentSimId) {
			setSimulationResult(null);
			simulationResultIdRef.current = null;
		}
		// A new simulation invalidates any in-flight prefetch promise too.
		if (
			simulationResultPromiseRef.current &&
			simulationResultPromiseRef.current.id !== currentSimId
		) {
			simulationResultPromiseRef.current = null;
		}
	}, [simulation?.id]);

	// Shared fetch helper — kicks off (or returns the existing) GET
	// api/Vibe/Preview request for `simulation.id` and caches the result so
	// both the background prefetch and the click-driven `enterReview` flow
	// observe a single round-trip.
	const ensureSimulationResult = useCallback(
		(sim: SimulationDto): Promise<SimulationScheduleResult | null> => {
			if (simulationResult != null && simulationResultIdRef.current === sim.id) {
				return Promise.resolve(simulationResult);
			}
			if (
				simulationResultPromiseRef.current &&
				simulationResultPromiseRef.current.id === sim.id
			) {
				return simulationResultPromiseRef.current.promise;
			}
			const promise = (async () => {
				try {
					const resp = await chatService.getSimulationResult(sim.id);
					const content = (resp?.Content ?? null) as SimulationScheduleResult | null;
					if (content) {
						setSimulationResult(content);
						simulationResultIdRef.current = sim.id;
					}
					return content;
				} finally {
					if (
						simulationResultPromiseRef.current &&
						simulationResultPromiseRef.current.id === sim.id
					) {
						simulationResultPromiseRef.current = null;
					}
				}
			})();
			simulationResultPromiseRef.current = { id: sim.id, promise };
			return promise;
		},
		[simulationResult]
	);

	// Background prefetch — as soon as we know the simulation is Ready we
	// fire the `api/Vibe/Preview` GET so that clicking "Review Simulation"
	// resolves instantly. Errors are swallowed here; if the user clicks
	// Review and the preview still isn't cached, `enterReview` will retry
	// and surface the failure through the existing error path.
	useEffect(() => {
		if (!simulation || simulation.state !== SimulationState.Ready) return;
		if (simulationResultIdRef.current === simulation.id) return;
		void ensureSimulationResult(simulation).catch((err) => {
			console.warn('Simulation result prefetch failed', err);
		});
	}, [simulation, ensureSimulationResult]);

	const enterReview = useCallback(async () => {
		// Read vibeRequest from the cache first (always up-to-date, populated
		// before the requestId effect can set simulation), then fall back to the
		// committed-render ref. React 18 can batch setVibeRequest together with
		// setSimulation in a way that leaves vibeRequestRef.current null in the
		// render that makes the Review button visible.
		const rid = requestIdRef.current;
		const currentVibeRequest =
			(rid ? (vibeRequestCacheRef.current[rid] ?? null) : null) ??
			vibeRequestRef.current ??
			null;
		if (!simulation) return;
		if (simulationResult != null && simulationResultIdRef.current === simulation.id) {
			// Cached — publish to overlay store (sets inReview=true) and skip re-fetch.
			if (currentVibeRequest) {
				useSimulationOverlayStore
					.getState()
					.enterReview({ simulation, simulationResult, vibeRequest: currentVibeRequest });
			}
			return;
		}
		setIsLoadingSimulationResult(true);
		setSimulationResultError(null);
		try {
			const content = await ensureSimulationResult(simulation);
			if (content) {
				if (currentVibeRequest) {
					useSimulationOverlayStore.getState().enterReview({
						simulation,
						simulationResult: content,
						vibeRequest: currentVibeRequest,
					});
				}
			} else {
				// Plan §5.5 — empty/null body counts as a fetch failure.
				setSimulationResultError('empty');
			}
		} catch (err) {
			console.error('Failed to fetch simulation result', err);
			// Plan §5.5 — surface "Simulation unavailable" with Retry. Review
			// mode is NOT entered, satisfying the auto-exit requirement.
			setSimulationResultError(err instanceof Error ? err.message : 'fetch_failed');
		} finally {
			setIsLoadingSimulationResult(false);
		}
	}, [simulation, simulationResult, ensureSimulationResult]);

	const exitReview = useCallback(() => {
		useSimulationOverlayStore.getState().exitReview();
	}, []);

	// Plan §5.3.6 / §5.4 — Escape from anywhere exits review mode. Bound once
	// at the chat container level rather than per-component.
	useEffect(() => {
		if (!inReview) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				exitReview();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [inReview, exitReview]);

	// Plan §5.4 — stale overlay guard. If the active request changes (user
	// sent a new message during review, or a non-chat origin started a fresh
	// simulation) discard the overlay and exit review mode. The overlay store
	// is keyed on the original vibeRequestId; mismatch means the on-screen
	// overlay no longer matches the user's intent.
	useEffect(() => {
		if (!inReview) return;
		const overlay = useSimulationOverlayStore.getState();
		if (overlay.vibeRequest && overlay.vibeRequest.id !== requestId) {
			useSimulationOverlayStore.getState().exitReview();
		}
	}, [inReview, requestId]);

	// Pull the latest VibeRequest whenever the active requestId changes so the
	// simulation polling loop has terminal-state context, and so any embedded
	// `previews` payload can prime the local simulation cache.
	useEffect(() => {
		if (!requestId) {
			setVibeRequest(null);
			setSimulation(null);
			return;
		}
		// Plan §6.3 — supersession. When the active requestId changes (user
		// sends a follow-up message, or session bootstrap swaps requests),
		// drop the old simulation/result snapshot synchronously so polling
		// halts and the UI doesn't briefly attribute the previous request's
		// state to the new one. Review mode is exited too — the old preview
		// is no longer relevant and the calendar overlay must clear.
		setSimulation(null);
		setSimulationResult(null);
		simulationResultIdRef.current = null;
		simulationResultPromiseRef.current = null;
		setSimulationResultError(null);
		useSimulationOverlayStore.getState().exitReview();
		let cancelled = false;
		(async () => {
			try {
				// Plan §6.5.2 — prefer the cache populated from getMessages
				// responses; only fall back to a dedicated getVibeRequest
				// round-trip when the chat-history payload didn't carry the
				// embedded request (older sessions, follow-up `sendMessage`
				// before the next `getMessages`, or refresh into a request
				// that wasn't in the most recent batch).
				const cached = vibeRequestCacheRef.current[requestId] ?? null;
				let vr: VibeRequestType | null = cached;
				if (!vr) {
					const resp = await chatService.getVibeRequest(requestId);
					if (cancelled) return;
					vr = (resp?.Content?.vibeRequest ?? null) as VibeRequestType | null;
					if (vr) vibeRequestCacheRef.current[requestId] = vr;
				}
				setVibeRequest(vr);
				const primed = primeSimulationFromRequest(vr);
				if (primed) setSimulation(primed);
				// The embedded `vibeRequest.preview` payload omits
				// `previewActions` (VibePreview.PreviewActions is [NotMapped]
				// server-side, so EF won't auto-load it via .Include). Fetch
				// the dedicated preview endpoint to hydrate the chip<->preview
				// wiring (halos, navigatable affordances) on first paint.
				try {
					const previewResp = await chatService.getSimulationForRequest(requestId);
					if (cancelled) return;
					// `OkResponse("preview", ...)` server-side wraps the payload
					// as `{ preview: SimulationDto }`. The declared type lies;
					// unwrap defensively (and fall back to Content itself for
					// any future endpoint refactor that drops the wrapper).
					const rawContent = previewResp?.Content as
						| { preview?: SimulationDto }
						| SimulationDto
						| null
						| undefined;
					const sim =
						(rawContent && 'preview' in rawContent
							? (rawContent.preview ?? null)
							: (rawContent as SimulationDto | null)) ?? null;
					if (sim && sim.id) setSimulation(sim);
				} catch (previewErr) {
					if (!cancelled) {
						console.error('Failed to fetch simulation preview for request', previewErr);
					}
				}
			} catch (err) {
				if (!cancelled) console.error('Failed to fetch vibe request for simulation', err);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [requestId]);

	// Polls the backend for the active simulation; ramps from 2s → 10s after 30s.
	useSimulationPolling(
		vibeRequest,
		simulation,
		(sim) => {
			setSimulation((prev) => {
				// Ignore stale `previewReady` for terminal requests (invariant).
				if (prev && isSimulationTerminal(prev) && prev.id === sim.id) return prev;
				return sim;
			});
		},
		// Plan §6.6.5 — anonymous-user threading. Without this, the polling
		// fetch returns 401 / NotFound for anonymous sessions on refresh.
		// Derived inline to dodge a forward-reference: the canonical
		// `anonymousUserId` const is declared further down in the
		// component for legacy ordering reasons.
		{
			anonymousUserId:
				activePersonaSession?.userInfo?.id ?? activePersonaSession?.userId ?? undefined,
		}
	);

	// Track chat component mount
	useEffect(() => {
		analytics.trackChatEvent('Chat Opened', {
			personaId: selectedPersonaId,
			hasExistingSession: !!sessionId,
		});
	}, []); // Only on mount
	const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState('');

	// Extract values from active persona session
	const chatContext = activePersonaSession?.chatContext || [];
	const scheduleId = activePersonaSession?.scheduleId;
	const selectedPersonaId = activePersonaSession?.personaId;
	const anonymousUserId =
		activePersonaSession?.userInfo?.id ?? activePersonaSession?.userId ?? '';
	const entityId = chatContext.length > 0 ? chatContext[0].EntityId : '';

	const handleSetScheduleId = (id: string) => {
		setScheduleId(id);
	};

	// Sync chat session ID with the active persona session
	useEffect(() => {
		if (sessionId && activePersonaSession && activePersonaSession.chatSessionId !== sessionId) {
			updateActivePersonaSession({ chatSessionId: sessionId });
		}
	}, [sessionId, activePersonaSession, updateActivePersonaSession]);

	// No need to sync userInfo.id when selectedPersonaId changes anymore,
	// as the persona session is set by PersonaCardExpanded component
	// This prevents duplicate logic and ensures single source of truth

	// Format WebSocket status for display (internationalized)
	const formatWebSocketStatus = (status: string): string => {
		const statusMap: Record<string, string[]> = {
			action_initialization_start: [
				t('home.expanded.chat.wsStatus.actionInitStart1'),
				t('home.expanded.chat.wsStatus.actionInitStart2'),
				t('home.expanded.chat.wsStatus.actionInitStart3'),
				t('home.expanded.chat.wsStatus.actionInitStart4'),
			],
			process_action_start: [
				t('home.expanded.chat.wsStatus.processActionStart1'),
				t('home.expanded.chat.wsStatus.processActionStart2'),
				t('home.expanded.chat.wsStatus.processActionStart3'),
				t('home.expanded.chat.wsStatus.processActionStart4'),
			],
			process_action_end: [
				t('home.expanded.chat.wsStatus.processActionEnd1'),
				t('home.expanded.chat.wsStatus.processActionEnd2'),
				t('home.expanded.chat.wsStatus.processActionEnd3'),
				t('home.expanded.chat.wsStatus.processActionEnd4'),
			],
			summary_action_start: [
				t('home.expanded.chat.wsStatus.summaryStart1'),
				t('home.expanded.chat.wsStatus.summaryStart2'),
				t('home.expanded.chat.wsStatus.summaryStart3'),
				t('home.expanded.chat.wsStatus.summaryStart4'),
			],
			summary_action_end: [
				t('home.expanded.chat.wsStatus.summaryEnd1'),
				t('home.expanded.chat.wsStatus.summaryEnd2'),
				t('home.expanded.chat.wsStatus.summaryEnd3'),
				t('home.expanded.chat.wsStatus.summaryEnd4'),
			],
			schedule_load: [
				t('home.expanded.chat.wsStatus.scheduleLoad1'),
				t('home.expanded.chat.wsStatus.scheduleLoad2'),
				t('home.expanded.chat.wsStatus.scheduleLoad3'),
				t('home.expanded.chat.wsStatus.scheduleLoad4'),
			],
			schedule_process_start: [
				t('home.expanded.chat.wsStatus.scheduleProcessStart1'),
				t('home.expanded.chat.wsStatus.scheduleProcessStart2'),
				t('home.expanded.chat.wsStatus.scheduleProcessStart3'),
				t('home.expanded.chat.wsStatus.scheduleProcessStart4'),
			],
			schedule_process_end: [
				t('home.expanded.chat.wsStatus.scheduleProcessEnd1'),
				t('home.expanded.chat.wsStatus.scheduleProcessEnd2'),
				t('home.expanded.chat.wsStatus.scheduleProcessEnd3'),
				t('home.expanded.chat.wsStatus.scheduleProcessEnd4'),
			],
		};

		const messages = statusMap[status];
		if (messages && messages.length > 0) {
			const randomIndex = Math.floor(Math.random() * messages.length);
			return messages[randomIndex];
		}

		// Fallback for unmapped statuses
		return status.replace(/_/g, ' ').toLowerCase();
	};

	useEffect(() => {
		if (!anonymousUserId) return;

		const service = new SignalRService(anonymousUserId);
		webSocketCommunication.current = service;
		service.createConnection();
		service.subscribe(
			Hubs.VibeUpdate.name,
			Hubs.VibeUpdate.events.RefreshData,
			(data: unknown) => {
				// Type guard and extract vibe data from WebSocket
				if (
					data &&
					typeof data === 'object' &&
					'data' in data &&
					data.data &&
					typeof data.data === 'object' &&
					'vibe' in data.data &&
					data.data.vibe &&
					typeof data.data.vibe === 'object' &&
					'status' in data.data.vibe &&
					typeof data.data.vibe.status === 'string'
				) {
					const rawStatus = data.data.vibe.status;
					const formattedStatus = formatWebSocketStatus(rawStatus);
					setWsStatusKey(rawStatus);
					setWebSocketStatus(formattedStatus);
				}
			}
		);

		// Phase 3.1: react to backend-pushed previewReady events.
		service.subscribe(
			Hubs.VibeUpdate.name,
			Hubs.VibeUpdate.events.PreviewReady,
			(data: unknown) => {
				const payload = data as PreviewReadyPayload | null;
				if (!payload || payload.type !== 'requestPreviewReady') return;
				const activeRequestId = requestIdRef.current;
				if (!activeRequestId || payload.vibeRequestId !== activeRequestId) return;
				// Plan §6.2 — ignore late notifications for a request that has
				// already been applied/closed. Without this guard a `previewReady`
				// arriving after Apply would re-populate `simulation` and reopen
				// the status strip on a request the user has already moved past.
				if (isRequestTerminal(vibeRequestRef.current)) return;
				(async () => {
					try {
						const resp = await chatService.getSimulationForRequest(
							payload.vibeRequestId,
							anonymousUserId || undefined
						);
						const sim = (resp?.Content ?? null) as SimulationDto | null;
						if (sim) setSimulation(sim);
					} catch (err) {
						console.error('Failed to refetch simulation after previewReady', err);
					}
				})();
			}
		);

		return () => {
			if (webSocketCommunication.current) {
				webSocketCommunication.current.dispose();
				webSocketCommunication.current = null;
			}
		};
	}, [anonymousUserId]);

	// Fetch sessions and set latest sessionId on component mount or when persona changes
	useEffect(() => {
		const fetchAndSetLatestSession = async () => {
			try {
				const personaUserId = activePersonaSession?.userId;

				if (personaUserId) {
					const sessionsResponse = await chatService.getVibeSessions(
						undefined,
						personaUserId
					);
					const sessions = sessionsResponse.Content.vibeSessions;

					if (sessions && sessions.length > 0) {
						// Sort sessions by creation time (newest first) and get the latest one
						const latestSession = sessions.sort(
							(a, b) => b.creationTimeInMs - a.creationTimeInMs
						)[0];
						setSessionId(latestSession.id);
						setCurrentSessionTitle(latestSession.title || null);
					} else {
						// No sessions found, clear sessionId
						setSessionId('');
						setCurrentSessionTitle(null);
					}
				} else {
					// No persona selected, clear sessionId
					setSessionId('');
				}
			} catch (error) {
				console.warn('Failed to fetch sessions:', error);
				// Clear sessionId on error
				setSessionId('');
			}
		};

		fetchAndSetLatestSession();
	}, [activePersonaSession?.userId, activePersonaSession?.personaId]);

	const extractTimestamp = useCallback((id: string): number => {
		const match = id.match(/(\d{18})/);
		return match ? parseInt(match[1], 10) : 0;
	}, []);

	const sortMessagesChronologically = useCallback(
		(sourceMessages: PromptWithActions[]) =>
			[...sourceMessages].sort((a, b) => extractTimestamp(a.id) - extractTimestamp(b.id)),
		[extractTimestamp]
	);

	const mergeMessages = useCallback(
		(existingMessages: PromptWithActions[], incomingMessages: PromptWithActions[]) => {
			const merged = new Map(existingMessages.map((entry) => [entry.id, entry]));

			incomingMessages.forEach((incoming) => {
				const previous = merged.get(incoming.id);
				if (previous) {
					merged.set(incoming.id, {
						...previous,
						...incoming,
						actions: incoming.actions.length > 0 ? incoming.actions : previous.actions,
						actionIds: incoming.actionIds ?? previous.actionIds,
					});
				} else {
					merged.set(incoming.id, incoming);
				}
			});

			return sortMessagesChronologically(Array.from(merged.values()));
		},
		[sortMessagesChronologically]
	);

	const mapMessagesWithActions = useCallback((rawMessages: PromptWithActions[]) => {
		return rawMessages.map((entry) => {
			const actionIds = entry.actionIds ?? [];
			const resolvedActions = actionIds
				.map((id) => actionsByIdRef.current[id])
				.filter((action): action is VibeAction => Boolean(action));

			return {
				id: entry.id,
				origin: entry.origin,
				content: entry.content,
				actionId: entry.actionId,
				requestId: entry.requestId,
				sessionId: entry.sessionId,
				actionIds,
				actions: resolvedActions,
			};
		});
	}, []);

	const fetchActionsForMessages = useCallback(async (rawMessages: PromptWithActions[]) => {
		const uniqueActionIds = Array.from(
			new Set(rawMessages.flatMap((entry) => entry.actionIds || []).filter(Boolean))
		);
		const missingActionIds = uniqueActionIds.filter((id) => !actionsByIdRef.current[id]);

		if (!missingActionIds.length) return;

		setIsBatchLoading(true);
		try {
			for (let i = 0; i < missingActionIds.length; i += ACTION_BATCH_SIZE) {
				const batch = missingActionIds.slice(i, i + ACTION_BATCH_SIZE);
				try {
					const fetchedActions = await chatService.getActions(batch);
					fetchedActions.forEach((action) => {
						actionsByIdRef.current[action.id] = action;
					});
				} catch (error) {
					console.error('Error fetching action batch:', error);
				}
			}
		} finally {
			setIsBatchLoading(false);
		}
	}, []);

	const loadInitialChatMessages = useCallback(
		async (sid?: string) => {
			setIsLoading(true);
			setError(null);
			setMessages([]);
			setRequestId(null);
			setHasMoreMessages(false);
			nextMessageIndexRef.current = 0;
			actionsByIdRef.current = {};
			shouldPreserveScrollPositionRef.current = false;
			shouldAutoScrollToBottomRef.current = false;

			try {
				const devUserIdOverride = useAppStore.getState().devUserIdOverride;
				const isDevMode = !!devUserIdOverride;

				if (!isDevMode && isDemoMode()) {
					const { chatMessages } = getDemoData();
					setMessages(sortMessagesChronologically(chatMessages));
					setRequestId(
						chatMessages[chatMessages.length - 1]?.requestId || 'request-demo-001'
					);
					setHasMoreMessages(false);
					shouldAutoScrollToBottomRef.current = true;
					return;
				}

				if (!sid) return;

				const data = await chatService.getMessages(sid, {
					index: 0,
					batchSize: MESSAGE_BATCH_SIZE,
					order: 'desc',
					anonymousUserId: anonymousUserId || undefined,
				});

				const rawMessages = data.Content.chats || [];
				// Plan §6.5.2 — hydrate the per-request cache from the
				// embedded `vibeRequests` payload before any state setter
				// fires; that way the requestId effect (triggered by the
				// imminent setRequestId below) finds the entry on first read.
				const embeddedRequests = data.Content.vibeRequests ?? [];
				for (const r of embeddedRequests) {
					if (r && r.id) vibeRequestCacheRef.current[r.id] = r as VibeRequestType;
				}
				if (!rawMessages.length) {
					setHasMoreMessages(false);
					return;
				}

				setIsLoading(false);
				await fetchActionsForMessages(rawMessages);
				const hydratedMessages = mapMessagesWithActions(rawMessages);
				const sortedMessages = sortMessagesChronologically(hydratedMessages);

				setMessages(sortedMessages);
				setRequestId(sortedMessages[sortedMessages.length - 1]?.requestId || null);
				setHasMoreMessages(rawMessages.length === MESSAGE_BATCH_SIZE);
				nextMessageIndexRef.current = rawMessages.length;
				shouldAutoScrollToBottomRef.current = true;
			} catch (err) {
				if (err instanceof Error) setError(err.message);
				else setError(t('home.expanded.chat.errorLoadMessages'));
			} finally {
				setIsLoading(false);
			}
		},
		[
			anonymousUserId,
			fetchActionsForMessages,
			mapMessagesWithActions,
			sortMessagesChronologically,
			t,
		]
	);

	const loadOlderMessages = useCallback(async () => {
		if (!sessionId || isLoading || isLoadingOlderMessages || !hasMoreMessages) return;

		const messagesList = messagesListRef.current;
		if (messagesList) {
			previousScrollHeightRef.current = messagesList.scrollHeight;
			previousScrollTopRef.current = messagesList.scrollTop;
			shouldPreserveScrollPositionRef.current = true;
		}

		setIsLoadingOlderMessages(true);
		try {
			const data = await chatService.getMessages(sessionId, {
				index: nextMessageIndexRef.current,
				batchSize: MESSAGE_BATCH_SIZE,
				order: 'desc',
				anonymousUserId: anonymousUserId || undefined,
			});

			const rawMessages = data.Content.chats || [];
			// Plan §6.5.2 — also fold older-batch embedded requests into
			// the cache so historical request rows can prime simulation if
			// the user scrolls back and re-selects them.
			const embeddedRequests = data.Content.vibeRequests ?? [];
			for (const r of embeddedRequests) {
				if (r && r.id) vibeRequestCacheRef.current[r.id] = r as VibeRequestType;
			}
			if (!rawMessages.length) {
				setHasMoreMessages(false);
				shouldPreserveScrollPositionRef.current = false;
				return;
			}

			await fetchActionsForMessages(rawMessages);
			const hydratedMessages = mapMessagesWithActions(rawMessages);

			setMessages((prevMessages) => mergeMessages(prevMessages, hydratedMessages));
			nextMessageIndexRef.current += rawMessages.length;
			setHasMoreMessages(rawMessages.length === MESSAGE_BATCH_SIZE);
		} catch (err) {
			shouldPreserveScrollPositionRef.current = false;
			if (err instanceof Error) setError(err.message);
			else setError(t('home.expanded.chat.errorLoadMessages'));
		} finally {
			setIsLoadingOlderMessages(false);
		}
	}, [
		anonymousUserId,
		fetchActionsForMessages,
		hasMoreMessages,
		isLoading,
		isLoadingOlderMessages,
		mapMessagesWithActions,
		mergeMessages,
		sessionId,
		t,
	]);

	// Load chat messages when relevant dependencies change
	useEffect(() => {
		loadInitialChatMessages(sessionId);
	}, [loadInitialChatMessages, scheduleId, selectedPersonaId, sessionId]);

	useEffect(() => {
		const messagesList = messagesListRef.current;
		if (!messagesList) return;

		const handleScroll = () => {
			if (messagesList.scrollTop <= SCROLL_TOP_THRESHOLD) {
				loadOlderMessages();
			}
		};

		messagesList.addEventListener('scroll', handleScroll);
		return () => messagesList.removeEventListener('scroll', handleScroll);
	}, [loadOlderMessages]);

	useLayoutEffect(() => {
		const messagesList = messagesListRef.current;
		if (!messagesList || messages.length === 0) return;

		if (shouldPreserveScrollPositionRef.current) {
			const scrollDelta = messagesList.scrollHeight - previousScrollHeightRef.current;
			messagesList.scrollTop = previousScrollTopRef.current + scrollDelta;
			shouldPreserveScrollPositionRef.current = false;
			return;
		}

		if (shouldAutoScrollToBottomRef.current) {
			messagesList.scrollTop = messagesList.scrollHeight;
			shouldAutoScrollToBottomRef.current = false;
		}
	}, [messages]);

	const shouldShowAcceptButton = useHasUnexecutedActions(requestId, messages);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!message.trim() || isSending) return;

		// Track message send
		analytics.trackChatEvent('Message Sent', {
			messageLength: message.length,
			hasContext: chatContext.length > 0,
			personaId: selectedPersonaId,
		});

		// If the user sends a new message while in review, exit review
		// synchronously — before any await — so the chat view is restored
		// immediately while the API call completes in the background.
		if (inReview) {
			exitReview();
			setSimulation(null);
			setSimulationResult(null);
			simulationResultIdRef.current = null;
			simulationResultPromiseRef.current = null;
			setSimulationResultError(null);
		}

		try {
			setIsSending(true);
			setError(null);
			setWebSocketStatus(null); // Reset status to prepare for new updates
			setWsStatusKey(null);

			// Get current location data
			const locationData = await locationService.getCurrentLocation();
			const locationApiData = locationService.toApiFormat(locationData);

			const response = await chatService.sendMessage(
				message,
				entityId,
				sessionId,
				anonymousUserId,
				locationApiData.userLongitude,
				locationApiData.userLatitude,
				locationApiData.userLocationVerified
			);
			if (
				response?.Content?.vibeResponse?.tilerUser &&
				response.Content.vibeResponse.tilerUser?.id !== activePersonaSession?.userInfo?.id
			) {
				updateActivePersonaSession({ userInfo: response.Content.vibeResponse.tilerUser });
			}
			const promptMap = response?.Content?.vibeResponse?.prompts || {};

			// Convert the prompt map to PromptWithActions[]
			const newMessages: PromptWithActions[] = Object.values(promptMap).map(
				(entry: PromptWithActions) => ({
					id: entry.id,
					origin: entry.origin,
					content: entry.content,
					actionId: entry.actionId,
					requestId: entry.requestId,
					sessionId: entry.sessionId,
					actions: (entry.actions ?? []).map((action: VibeAction) => ({
						id: action.id,
						descriptions: action.descriptions,
						type: action.type,
						creationTimeInMs: action.creationTimeInMs,
						status: action.status,
						entityId: action.entityId,
						entityType: action.entityType,
						beforeScheduleId: action.beforeScheduleId,
						afterScheduleId: action.afterScheduleId,
						prompts: action.prompts ?? [],
						vibeRequest: action.vibeRequest
							? {
									id: action.vibeRequest.id,
									creationTimeInMs: action.vibeRequest.creationTimeInMs,
									activeAction: action.vibeRequest.activeAction,
									isClosed: action.vibeRequest.isClosed ?? false,
									beforeScheduleId: action.vibeRequest.beforeScheduleId || null,
									afterScheduleId: action.vibeRequest.afterScheduleId || null,
									actions: action.vibeRequest.actions || [],
									previews: action.vibeRequest.previews || [],
								}
							: null,
					})),
				})
			);

			newMessages.forEach((newMessage) => {
				(newMessage.actions || []).forEach((action) => {
					actionsByIdRef.current[action.id] = action;
				});
			});

			shouldAutoScrollToBottomRef.current = true;
			setMessages((prevMessages) => mergeMessages(prevMessages, newMessages));
			setRequestId(newMessages[newMessages.length - 1]?.requestId || null);
			nextMessageIndexRef.current += newMessages.length;

			// Update session ID from the first prompt
			const sessionIdFromResponse = newMessages[0]?.sessionId;
			if (sessionIdFromResponse) {
				setSessionId(sessionIdFromResponse);
			}

			setMessage('');
		} catch (err) {
			if (err instanceof ChatLimitError) {
				analytics.trackError('Chat Limit Reached', { personaId: selectedPersonaId });
				setErrorPopupMessage(err.message);
				setShowErrorPopup(true);
			} else if (err instanceof Error) {
				analytics.trackError('Chat Message Send Failed', {
					errorMessage: err.message,
					personaId: selectedPersonaId,
				});
				setError(err.message);
			} else {
				setError(t('home.expanded.chat.errorSendMessage'));
			}
		} finally {
			setIsSending(false);
		}
	};

	const acceptAllChanges = async () => {
		// Track accept changes action
		analytics.trackChatEvent('Accept Changes', {
			requestId: requestId || undefined,
			personaId: selectedPersonaId,
		});

		// EXIT REVIEW SYNCHRONOUSLY - before any await so the user immediately
		// returns to the chat view with the WebSocket LoadingIndicator showing.
		// The simulation state is cleared here regardless of whether the API
		// call succeeds or fails.
		useSimulationOverlayStore.getState().exitReview();
		setSimulation(null);
		setSimulationResult(null);
		simulationResultIdRef.current = null;
		simulationResultPromiseRef.current = null;
		setSimulationResultError(null);

		try {
			setIsSending(true);
			setError(null);
			setWebSocketStatus(null); // Reset status to prepare for new updates
			setWsStatusKey(null);
			// Get current location data
			const locationData = await locationService.getCurrentLocation();
			const locationApiData = locationService.toApiFormat(locationData);

			const executedChanges = await chatService.sendChatAcceptChanges(
				requestId,
				anonymousUserId,
				locationApiData.userLongitude,
				locationApiData.userLatitude,
				locationApiData.userLocationVerified
			);
			const newScheduleId = executedChanges?.Content?.vibeRequest?.afterScheduleId || null;
			if (newScheduleId) {
				handleSetScheduleId(newScheduleId);
				// useEffect will automatically reload messages when scheduleId changes
			}
		} catch (err) {
			if (err instanceof Error) setError(err.message);
			else setError(t('home.expanded.chat.errorAcceptChanges'));
		} finally {
			setIsSending(false);
		}
	};

	const handleNewChat = () => {
		analytics.trackChatEvent('New Chat Started', {
			personaId: selectedPersonaId,
			previousSessionId: sessionId,
		});

		setSessionId('');
		setError(null);
		setMessage('');
		setMessages([]);
		setRequestId(null);
		setCurrentSessionTitle(null);
		handleSetScheduleId('');
		// Clear chat context when starting a new chat
		if (activePersonaSession) {
			updateActivePersonaSession({
				chatContext: [],
				chatSessionId: '',
			});
		}
	};

	const removeChatContext = useAppStore((state) => state.removeChatContext); // Action to remove context

	const handleRemoveContext = (context: ChatContextType) => {
		analytics.trackChatEvent('Context Removed', {
			contextName: context.Name,
			contextEntityId: context.EntityId,
			personaId: selectedPersonaId,
		});
		removeChatContext(context); // Remove the clicked context
	};

	const handleEmailSubmitted = (email: string) => {
		setSubmittedEmail(email);
		setShowErrorPopup(false); // Close chat limit modal
		setShowEmailConfirmation(true); // Show confirmation modal
	};

	const handlePromptClick = (prompt: string) => {
		setMessage(prompt);
		// Auto-submit by creating a synthetic form event
		const syntheticEvent = {
			preventDefault: () => {},
		} as FormEvent;
		// Set message first, then trigger submit on next tick
		setTimeout(() => {
			handleSubmit(syntheticEvent);
		}, 0);
	};

	const handleSessionSelect = (session: VibeSession) => {
		// Skip if selecting the already-active session
		if (session.id === sessionId) return;

		// Clear current state before loading new session
		setMessages([]);
		setError(null);
		setMessage('');
		setRequestId(null);
		setCurrentSessionTitle(session.title || null);
		setSessionId(session.id);
		// loadChatMessages will be triggered by the sessionId useEffect
	};

	return (
		<ChatWrapper>
			<ChatContainer>
				<ChatHeader>
					<ChatHeaderLeft>
						{onClose && (
							<BackButtonWrapper data-testid="chat-back-button-wrapper">
								<Button variant="ghost" height={32} onClick={onClose}>
									<ChevronLeftIcon size={16} />
									<span>{t('common.buttons.back')}</span>
								</Button>
							</BackButtonWrapper>
						)}
						<HistoryButton
							onClick={() => setShowSessionHistory(true)}
							title={t('home.expanded.chat.sessionHistory.title')}
						>
							<History size={18} />
						</HistoryButton>
					</ChatHeaderLeft>

					<ChatHeaderCenter>
						{currentSessionTitle && (
							<SessionTitleDisplay title={currentSessionTitle}>
								{currentSessionTitle}
							</SessionTitleDisplay>
						)}
					</ChatHeaderCenter>

					<ChatHeaderRight>
						{chatContext.length > 0 && (
							<ChatContextChips>
								{chatContext.map((context, index) => (
									<Button
										key={index}
										variant="outline"
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '0.25rem 0.5rem',
											border: '1px solid currentColor',
											fontSize: theme.typography.fontSize.xs,
										}}
									>
										<span>{context.Name}</span>
										<span
											onClick={() => handleRemoveContext(context)}
											style={{
												marginLeft: '0.5rem',
												color: 'red',
												cursor: 'pointer',
											}}
										>
											x
										</span>
									</Button>
								))}
							</ChatContextChips>
						)}
						<NewChatHeaderButton
							onClick={handleNewChat}
							title={t('home.expanded.chat.newChat')}
						>
							<SquarePen size={18} />
						</NewChatHeaderButton>
					</ChatHeaderRight>
				</ChatHeader>
				{!inReview && (
					<ChatContent>
						{isLoading && (
							<LoadingIndicator message={t('home.expanded.chat.loadingMessages')} />
						)}
						{isBatchLoading && (
							<LoadingIndicator message={t('home.expanded.chat.loadingActions')} />
						)}

						{error && (
							<div className="chat-error">
								{t('home.expanded.chat.error')}: {error}
							</div>
						)}

						{!isLoading && !error && !messages.length && (
							<EmptyChat>
								<Logo size={48} />
								<h3>{t('home.expanded.chat.emptyStateTitle')}</h3>
								<p>{t('home.expanded.chat.emptyStateDescription')}</p>
							</EmptyChat>
						)}

						<div
							className="messages-list"
							ref={messagesListRef}
							data-onboarding-chat-messages
						>
							{messages.map((message) => (
								<MessageBubble key={message.id} $isUser={message.origin === 'user'}>
									<div className="message-content">
										<MarkdownRenderer content={message.content} />
									</div>

									{message.actions
										?.filter(
											(action) =>
												action.type !== 'conversational_and_not_supported'
										)
										.map((action) => {
											const sim = simulation;
											const simAction = sim
												? buildSimulationActionLookups(sim).byActionId[
														action.id
													]
												: undefined;
											return (
												<ActionPill
													key={action.id}
													action={action}
													simulation={sim}
													request={vibeRequest}
													simulationAction={simAction}
													onSelect={(a, sa) => {
														// Prefer wire `actionId`; fall back to the
														// embedded VibeAction.id and finally the source
														// action.id so older payloads still wire up.
														const id =
															sa?.actionId ?? sa?.action?.id ?? a.id;
														if (id) setSelectedActionId(id);
													}}
												/>
											);
										})}
								</MessageBubble>
							))}
						</div>

						<div ref={messagesEndRef} />
					</ChatContent>
				)}

				{/* Render chatContext buttons */}
				<div style={{ marginBottom: '0.25rem' }}></div>

				<div>
					{!inReview && isSending && (
						<LoadingIndicator
							message={webSocketStatus || t('home.expanded.chat.sendingRequest')}
							wsStatus={wsStatusKey}
						/>
					)}
					{!inReview && (
						<SimulationStatusStrip
							// Plan §6.6.3 supersession is now centralized in
							// `isRequestTerminal` (selector check inside the strip),
							// so we can pass the live simulation through and let
							// the strip's hide-when-terminal branch take over.
							simulation={simulation}
							request={vibeRequest}
							onReview={enterReview}
							fetchError={simulationResultError}
							onRetry={simulationResultError ? enterReview : undefined}
							isLoadingReview={isLoadingSimulationResult}
						/>
					)}
					{inReview &&
						simulation &&
						vibeRequest &&
						(simulationResult ? (
							<SimulationReviewPanel
								request={vibeRequest}
								simulation={simulation}
								result={simulationResult}
								selectedActionId={selectedActionId}
								onSelect={setSelectedActionId}
								onApply={() => acceptAllChanges()}
								onExitReview={exitReview}
							/>
						) : (
							<div
								role="status"
								aria-busy={isLoadingSimulationResult}
								data-testid="simulation-review-skeleton"
							>
								{t(
									'home.expanded.chat.simulationGenerating',
									'Loading simulation…'
								)}
							</div>
						))}
					{!inReview && ((!isSending && shouldShowAcceptButton) || isDemoMode()) && (
						<Button
							variant="primary"
							onClick={() => acceptAllChanges()}
							data-onboarding-accept-button
						>
							{t('home.expanded.chat.acceptChanges')}
						</Button>
					)}
				</div>

				{/* Show prompt suggestions when input field is empty */}
				{!inReview && !message.trim() && (
					<PromptSuggestions onPromptClick={handlePromptClick} />
				)}

				{!isMobileReview && (
					<>
						<ChatForm onSubmit={handleSubmit} data-onboarding-chat-input>
							<Input.Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								onKeyDown={(e) => {
									// Submit form on Enter key press without Shift key
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault(); // Prevent new line

										// Use form.requestSubmit() instead of handleSubmit directly
										// This triggers a single form submission through the standard form mechanism
										const form = e.currentTarget.form;
										if (form) form.requestSubmit();
									}
								}}
								placeholder={t('home.expanded.chat.inputPlaceholder')}
								disabled={isSending}
								bordergradient={[theme.colors.brand[500]]}
								height={50} // Set a fixed height for consistent alignment
							/>
							<ChatButton
								type="submit"
								disabled={isSending || !message.trim()}
								data-onboarding-chat-button
							>
								{isSending ? (
									<CircleStop size={20} />
								) : (
									<SendHorizontal size={20} />
								)}
							</ChatButton>
						</ChatForm>
						<UserLocation />
					</>
				)}
			</ChatContainer>

			{anonymousUserId && (
				<ErrorPopup
					isOpen={showErrorPopup}
					message={errorPopupMessage}
					title={t('home.expanded.chat.errorPopup.chatLimitReached')}
					onClose={() => setShowErrorPopup(false)}
					showWaitlistButton={true}
					onEmailSubmitted={handleEmailSubmitted}
					tilerUserId={anonymousUserId}
				/>
			)}

			<EmailConfirmationModal
				isOpen={showEmailConfirmation}
				email={submittedEmail}
				onClose={() => setShowEmailConfirmation(false)}
			/>

			<SessionHistory
				isOpen={showSessionHistory}
				onClose={() => setShowSessionHistory(false)}
				currentSessionId={sessionId}
				onSessionSelect={handleSessionSelect}
				onNewChat={handleNewChat}
				userId={activePersonaSession?.userId}
			/>
		</ChatWrapper>
	);
};

export default Chat;
