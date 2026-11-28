import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LoaderCircle, AlertCircle } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import { CalendarNavigationPhase, CalendarRequestStatus } from './calendarRequestContext';

export interface CalendarNavigationState {
	phase: CalendarNavigationPhase;
	date?: number;
	/** Terminal outcomes other than found; found briefly shows the opening phase. */
	outcome?: CalendarRequestStatus;
}

export default function CalendarNavigationFeedback({
	state,
	onRetry,
	onDismiss,
}: {
	state: CalendarNavigationState;
	onRetry?: () => void;
	onDismiss?: () => void;
}) {
	const { t, i18n } = useTranslation();
	let message: string;
	if (state.outcome) {
		switch (state.outcome) {
			case CalendarRequestStatus.Deleted:
				message = t('calendarNavigation.deleted', 'This event has been deleted.');
				break;
			case CalendarRequestStatus.Completed:
				message = t('calendarNavigation.completed', 'This event has been completed.');
				break;
			case CalendarRequestStatus.DemoMode:
				message = t(
					'calendarNavigation.demo',
					'You are in demo mode with limited features. Sign up to unlock the full experience!'
				);
				break;
			case CalendarRequestStatus.Stale:
				message = t(
					'calendarNavigation.stale',
					'This tile has changed. Refresh your calendar and try again.'
				);
				break;
			case CalendarRequestStatus.NotFound:
				message = t(
					'calendarNavigation.notFound',
					'This tile could not be found on the calendar. Try again.'
				);
				break;
			default:
				message = t(
					'calendarNavigation.error',
					'The tile could not be opened. Please try again.'
				);
		}
	} else if (state.phase === 'opening') {
		message = t('calendarNavigation.opening', 'Opening tile details…');
	} else if (state.phase === 'loading_calendar') {
		const date =
			state.date != null && Number.isFinite(state.date)
				? new Intl.DateTimeFormat(i18n?.language || undefined, {
						month: 'short',
						day: 'numeric',
					}).format(state.date)
				: null;
		message = date
			? t('calendarNavigation.loadingDate', 'Loading the calendar for {{date}}…', { date })
			: t('calendarNavigation.loading', 'Loading your calendar…');
	} else {
		message = t('calendarNavigation.locating', 'Finding your tile…');
	}

	// A body portal stays above mobile chat sheets and survives calendar date changes.
	return createPortal(
		<Notice
			lang={i18n?.language}
			dir={i18n?.dir?.()}
			role={state.outcome ? 'alert' : 'status'}
			aria-live={state.outcome ? 'assertive' : 'polite'}
			aria-atomic="true"
			data-testid="calendar-navigation-feedback"
		>
			{state.outcome ? (
				<AlertCircle size={20} aria-hidden="true" />
			) : (
				<Spinner size={20} aria-hidden="true" />
			)}
			<span>{message}</span>
			{state.outcome && onRetry && (
				<button type="button" onClick={onRetry}>
					{t('calendarNavigation.retry', 'Try again')}
				</button>
			)}
			{state.outcome && onDismiss && (
				<button type="button" onClick={onDismiss}>
					{t('calendarNavigation.dismiss', 'Dismiss')}
				</button>
			)}
		</Notice>,
		document.body
	);
}

const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled(LoaderCircle)`
	animation: ${spin} 1s linear infinite;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;
const Notice = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 20000;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
	width: max-content;
	max-width: calc(100vw - 2rem);
	box-sizing: border-box;
	padding: 0.875rem 1rem;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background: ${({ theme }) => theme.colors.background.card};
	color: ${({ theme }) => theme.colors.text.primary};
	box-shadow: 0 8px 30px ${({ theme }) => theme.colors.backdrop.default};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	line-height: ${({ theme }) => theme.typography.lineHeight.sm};
	> svg {
		flex-shrink: 0;
		color: ${({ theme }) => theme.colors.text.secondary};
	}
	> span {
		flex: 1;
		min-width: 0;
	}
	button {
		min-height: 36px;
		padding: 4px 8px;
		border: 1px solid ${({ theme }) => theme.colors.button.primary.border};
		border-radius: ${({ theme }) => theme.borderRadius.little};
		background: ${({ theme }) => theme.colors.button.primary.bg};
		color: ${({ theme }) => theme.colors.button.primary.text};
		font: inherit;
		cursor: pointer;
		&:hover {
			background: ${({ theme }) => theme.colors.button.primary.bgHover};
		}
		&:focus-visible {
			outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
			outline-offset: 2px;
		}
	}
	@media (max-width: 480px) {
		&[role='alert'] > span {
			flex-basis: calc(100% - 32px);
		}
		button:first-of-type {
			margin-left: 32px;
		}
	}
`;

// Allow standalone rendering; the application's ThemeProvider takes precedence.
Notice.defaultProps = { theme: lightTheme };
