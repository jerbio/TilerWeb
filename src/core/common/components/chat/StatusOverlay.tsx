import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { LoaderCircle } from 'lucide-react';
import palette from '@/core/theme/palette';

export type StatusOverlayVariant = 'info' | 'warning' | 'error';

/** ID of the calendar grid container element that the overlay portals into */
export const CALENDAR_OVERLAY_CONTAINER_ID = 'calendar-grid-container';

interface StatusOverlayProps {
	/** Message to display */
	message: string;
	/** Visual variant — determines colour accent */
	variant?: StatusOverlayVariant;
	/** Whether the overlay is visible */
	visible: boolean;
	/** Show a spinner beside the message */
	loading?: boolean;
	/** Auto-dismiss after this many ms (0 = stay until `visible` changes) */
	autoDismissMs?: number;
	/** Called when the overlay auto-dismisses or the user taps to close */
	onDismiss?: () => void;
}

const VARIANT_COLORS: Record<StatusOverlayVariant, string> = {
	info: palette.colors.tileBackgroundTertiary,
	warning: palette.colors.brand[400],
	error: palette.colors.backgroundRed,
};

/**
 * A centered overlay banner scoped to the calendar grid container.
 *
 * Renders via portal into the `#calendar-grid-container` element so it
 * covers the calendar area without blocking the chat interface.
 * Falls back to `document.body` if the container is not mounted.
 */
const StatusOverlay: React.FC<StatusOverlayProps> = ({
	message,
	variant = 'info',
	visible,
	loading = false,
	autoDismissMs = 0,
	onDismiss,
}) => {
	const [show, setShow] = useState(visible);

	useEffect(() => {
		setShow(visible);
	}, [visible]);

	// Auto-dismiss timer
	useEffect(() => {
		if (!visible || autoDismissMs <= 0) return;
		const timer = setTimeout(() => {
			setShow(false);
			onDismiss?.();
		}, autoDismissMs);
		return () => clearTimeout(timer);
	}, [visible, autoDismissMs, onDismiss]);

	if (!show) return null;

	const portalTarget = document.getElementById(CALENDAR_OVERLAY_CONTAINER_ID) ?? document.body;

	return ReactDOM.createPortal(
		<Backdrop
			onClick={() => {
				setShow(false);
				onDismiss?.();
			}}
			data-testid="status-overlay"
		>
			<Banner $accent={VARIANT_COLORS[variant]} onClick={(e) => e.stopPropagation()}>
				{loading ? (
					<SpinnerIcon size={20} data-testid="status-overlay-spinner" />
				) : (
					<AccentBar $color={VARIANT_COLORS[variant]} />
				)}
				<BannerText>{message}</BannerText>
			</Banner>
		</Backdrop>,
		portalTarget
	);
};

export default StatusOverlay;

// ── Styled components ──────────────────────────────────────────

const fadeIn = keyframes`
	from { opacity: 0; }
	to   { opacity: 1; }
`;

const slideUp = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.97); }
	to   { opacity: 1; transform: translateY(0)    scale(1); }
`;

const Backdrop = styled.div`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(3px);
	z-index: 10001;
	animation: ${fadeIn} 0.15s ease-out;
	border-radius: inherit;
`;

const Banner = styled.div<{ $accent: string }>`
	display: flex;
	align-items: center;
	gap: 12px;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: ${palette.borderRadius.large};
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
	padding: 16px 28px;
	max-width: 420px;
	width: 90%;
	animation: ${slideUp} 0.2s ease-out;
`;

const AccentBar = styled.div<{ $color: string }>`
	width: 4px;
	min-height: 24px;
	border-radius: 2px;
	background: ${(p) => p.$color};
	flex-shrink: 0;
`;

const spin = keyframes`
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
`;

const SpinnerIcon = styled(LoaderCircle)`
	color: ${palette.colors.gray[400]};
	opacity: 0.25;
	animation: ${spin} 1.5s ease-in-out infinite;
	flex-shrink: 0;
`;

const BannerText = styled.span`
	color: ${palette.colors.gray[100]};
	font-size: 14px;
	font-weight: 500;
	line-height: 1.5;
`;
