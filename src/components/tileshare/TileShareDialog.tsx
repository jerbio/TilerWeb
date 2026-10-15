import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { X } from 'lucide-react';
import Button from '@/core/common/components/button';
import TileSharePresence from './TileSharePresence';
import TileShareTheme from './TileShareTheme';
import { tileShareControls } from './tileshareVisuals';
import { TILESHARE_EASING, TILESHARE_EXIT_MS, tileShareInteraction } from './tileshareMotion';

type DialogProps = {
	title: string;
	children: ReactNode;
	footer: ReactNode;
	onClose: () => void;
	open?: boolean;
	dismissible?: boolean;
	size?: 'compact' | 'standard' | 'wide';
	subtitle?: string;
};

export default function TileShareDialog({ open = true, ...content }: DialogProps) {
	return (
		<TileShareTheme>
			<TileSharePresence value={open ? content : null}>
				{(snapshot, closing) => <DialogContent {...snapshot} closing={closing} />}
			</TileSharePresence>
		</TileShareTheme>
	);
}

/** Native modal focus containment, with a scrolling body and persistent actions. */
function DialogContent({
	title,
	children,
	footer,
	onClose,
	closing,
	dismissible = true,
	size = 'standard',
	subtitle,
}: DialogProps & { closing: boolean }) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const { t } = useTranslation();
	useEffect(() => {
		const dialog = ref.current!;
		const previous = document.activeElement as HTMLElement | null;
		if (typeof dialog.showModal === 'function') dialog.showModal();
		else dialog.setAttribute('open', '');
		const first = dialog.querySelector<HTMLElement>(
			'input:not([disabled]),textarea:not([disabled])'
		);
		(first ?? dialog.querySelector<HTMLElement>('button:not([disabled])'))?.focus();
		return () => {
			if (typeof dialog.close === 'function') dialog.close();
			if (previous?.isConnected) previous.focus({ preventScroll: true });
		};
	}, []);
	useEffect(() => {
		// A fading dialog cannot submit again or dismiss the dialog underneath it.
		ref.current?.toggleAttribute('inert', closing);
	}, [closing]);
	return createPortal(
		<Dialog
			ref={ref}
			$closing={closing}
			$size={size}
			aria-labelledby={titleId}
			aria-modal="true"
			aria-hidden={closing || undefined}
			onCancel={(event) => {
				event.preventDefault();
				if (!closing && dismissible) onClose();
			}}
			onClick={(event) => {
				if (closing || !dismissible || event.target !== event.currentTarget) return;
				const bounds = event.currentTarget.getBoundingClientRect();
				if (
					event.clientX < bounds.left ||
					event.clientX > bounds.right ||
					event.clientY < bounds.top ||
					event.clientY > bounds.bottom
				)
					onClose();
			}}
		>
			<Header>
				<div>
					<h2 id={titleId}>{title}</h2>
					{subtitle && <p>{subtitle}</p>}
				</div>
				<Button
					style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }}
					disabled={!dismissible}
					type="button"
					variant="ghost"
					aria-label={t('tileShareComposer.close', 'Close')}
					onClick={onClose}
				>
					<X size={20} />
				</Button>
			</Header>
			<Body>{children}</Body>
			{footer && <Footer>{footer}</Footer>}
		</Dialog>,
		document.body
	);
}

const dialogIn = keyframes`
	from { opacity: 0; transform: translateY(12px) scale(0.98); }
	to { opacity: 1; transform: none; }
`;
const dialogOut = keyframes`
	from { opacity: 1; transform: none; }
	to { opacity: 0; transform: translateY(6px) scale(0.99); }
`;
const backdropIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const backdropOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;

const Dialog = styled.dialog<{ $closing: boolean; $size: 'compact' | 'standard' | 'wide' }>`
	${tileShareControls}
	box-sizing: border-box;
	width: min(
		${({ $size }) => ({ compact: '560px', standard: '640px', wide: '800px' })[$size]},
		calc(100vw - 32px)
	);
	max-height: calc(100dvh - 48px);
	margin: auto;
	padding: 0;
	/* Popups live beside Body; only the form body should clip and scroll. */
	overflow: visible;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: 18px;
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.background.card};
	box-shadow:
		0 24px 80px rgba(0, 0, 0, 0.32),
		0 2px 8px rgba(0, 0, 0, 0.12);
	animation: ${({ $closing }) => ($closing ? dialogOut : dialogIn)}
		${({ $closing }) => ($closing ? TILESHARE_EXIT_MS : 180)}ms ${TILESHARE_EASING} both;
	button {
		${tileShareInteraction}
	}
	&[open] {
		display: flex;
		flex-direction: column;
	}
	&::backdrop {
		background: ${({ theme }) => theme.colors.backdrop.default};
		animation: ${({ $closing }) => ($closing ? backdropOut : backdropIn)}
			${({ $closing }) => ($closing ? TILESHARE_EXIT_MS : 180)}ms ease both;
	}
	@media (prefers-reduced-motion: reduce) {
		animation: none;
		&::backdrop {
			animation: none;
		}
	}
`;
const Header = styled.header`
	flex-shrink: 0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	padding: 24px 28px 20px;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
	h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 650;
		letter-spacing: -0.6px;
		line-height: 1.3;
	}
	p {
		margin: 6px 0 0;
		color: ${({ theme }) => theme.colors.text.secondary};
		font-size: 13px;
		overflow-wrap: anywhere;
	}
	@media (max-width: 480px) {
		padding: 20px;
	}
`;
const Body = styled.div`
	overflow-y: auto;
	min-height: 0;
	padding: 24px 28px;
	@media (max-width: 480px) {
		padding: 20px;
	}
`;
const Footer = styled.footer`
	flex-shrink: 0;
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 28px;
	background: ${({ theme }) => theme.colors.input.bg};
	border-radius: 0 0 18px 18px;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	@media (max-width: 480px) {
		padding: 16px 20px;
	}
`;
