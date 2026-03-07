import React, { useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import useUiStore from './uiStore';
import type { NotificationType } from './types';

const iconForType = (type: NotificationType) => {
	switch (type) {
		case 'loading':
			return <SpinningLoader size={16} data-testid="notification-icon-loading" />;
		case 'success':
			return <CheckCircle2 size={16} data-testid="notification-icon-success" />;
		case 'error':
			return <AlertCircle size={16} data-testid="notification-icon-error" />;
		case 'info':
			return <Info size={16} data-testid="notification-icon-info" />;
	}
};

const NotificationToast: React.FC = () => {
	const notifications = useUiStore((s) => s.notification.items);
	const dismiss = useUiStore((s) => s.notification.dismiss);
	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const scheduleAutoDismiss = useCallback(
		(id: string, ms: number) => {
			// Clear any existing timer for this id
			const existing = timersRef.current.get(id);
			if (existing) clearTimeout(existing);

			const timer = setTimeout(() => {
				dismiss(id);
				timersRef.current.delete(id);
			}, ms);
			timersRef.current.set(id, timer);
		},
		[dismiss],
	);

	useEffect(() => {
		notifications.forEach((n) => {
			if (n.autoDismissMs !== null && !timersRef.current.has(n.id)) {
				scheduleAutoDismiss(n.id, n.autoDismissMs);
			}
		});

		// Clean up timers for notifications that no longer exist
		const currentIds = new Set(notifications.map((n) => n.id));
		timersRef.current.forEach((timer, id) => {
			if (!currentIds.has(id)) {
				clearTimeout(timer);
				timersRef.current.delete(id);
			}
		});
	}, [notifications, scheduleAutoDismiss]);

	// When a notification transitions (e.g. loading → success), reschedule timer
	useEffect(() => {
		notifications.forEach((n) => {
			if (n.autoDismissMs !== null) {
				// Always reschedule when updatedAt changes
				scheduleAutoDismiss(n.id, n.autoDismissMs);
			}
		});
	}, [notifications.map((n) => `${n.id}:${n.updatedAt}`).join(','), scheduleAutoDismiss]);

	// Cleanup all timers on unmount
	useEffect(() => {
		return () => {
			timersRef.current.forEach((timer) => clearTimeout(timer));
		};
	}, []);

	if (notifications.length === 0) return null;

	return (
		<ToastContainer data-testid="notification-toast-container">
			{notifications.map((n) => (
				<Toast key={n.id} $type={n.type} data-testid="notification-toast">
					<IconWrapper $type={n.type}>{iconForType(n.type)}</IconWrapper>
					<ToastMessage data-testid="notification-message">{n.message}</ToastMessage>
					<DismissBtn
						data-testid="notification-dismiss"
						onClick={() => dismiss(n.id)}
						aria-label="Dismiss notification"
					>
						<X size={14} />
					</DismissBtn>
				</Toast>
			))}
		</ToastContainer>
	);
};

/* ── Styled Components ── */

const slideIn = keyframes`
	from {
		transform: translateX(100%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
`;

const spin = keyframes`
	to { transform: rotate(360deg); }
`;

const SpinningLoader = styled(Loader2)`
	animation: ${spin} 1s linear infinite;
`;

const ToastContainer = styled.div`
	position: fixed;
	bottom: 16px;
	right: 16px;
	z-index: 9999;
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-width: 360px;
	pointer-events: none;
`;

const typeColors: Record<NotificationType, { bg: string; border: string; icon: string }> = {
	loading: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', icon: '#3b82f6' },
	success: { bg: 'rgba(18, 183, 106, 0.08)', border: 'rgba(18, 183, 106, 0.25)', icon: '#12b76a' },
	error: { bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)', icon: '#dc2626' },
	info: { bg: 'rgba(107, 114, 128, 0.08)', border: 'rgba(107, 114, 128, 0.25)', icon: '#6b7280' },
};

const Toast = styled.div<{ $type: NotificationType }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ $type }) => typeColors[$type].border};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	pointer-events: auto;
	animation: ${slideIn} 0.25s ease-out;
	min-width: 240px;
`;

const IconWrapper = styled.div<{ $type: NotificationType }>`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	color: ${({ $type }) => typeColors[$type].icon};
`;

const ToastMessage = styled.span`
	flex: 1;
	font-size: 13px;
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.4;
`;

const DismissBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: none;
	border-radius: 4px;
	background: transparent;
	color: ${({ theme }) => theme.colors.text.muted};
	cursor: pointer;
	padding: 0;
	flex-shrink: 0;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

export default NotificationToast;
