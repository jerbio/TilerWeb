import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

/* ───────────── animations ───────────── */

const shimmer = keyframes`
	0%   { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

const blink = keyframes`
	0%, 100% { opacity: 1; }
	50%      { opacity: 0; }
`;

const fadeSlideIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`;

const lineReveal = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`;

/* ───────────── styled components ───────────── */

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin-bottom: 0.5rem;
	animation: ${fadeSlideIn} 0.25s ease-out;
`;

const LinesContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
`;

const RevealedLine = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.15rem 0.5rem;
	animation: ${lineReveal} 0.25s ease-out;
	line-height: 1.5;
`;

const ActiveLine = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 0.15rem 0.5rem;
	animation: ${lineReveal} 0.25s ease-out;
	line-height: 1.5;
`;

const Cursor = styled.span`
	display: inline-block;
	width: 2px;
	height: 1em;
	margin-left: 2px;
	vertical-align: text-bottom;
	background: ${({ theme }) => theme.colors.brand[400]};
	animation: ${blink} 0.8s step-end infinite;
`;

/* — shimmer skeleton — */

const SkeletonContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	margin-top: 0.35rem;
	padding: 0 0.5rem;
`;

const SkeletonLine = styled.div<{ $width: string; $delay: string }>`
	height: 10px;
	border-radius: ${({ theme }) => theme.borderRadius.small};
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.background.card2} 25%,
		${({ theme }) => theme.colors.border.default} 50%,
		${({ theme }) => theme.colors.background.card2} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 1.8s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay};
	width: ${({ $width }) => $width};
`;

/* — simple mode (for basic "Loading messages…" usage) — */

const SimpleContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
`;

const SimpleText = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
`;

const SimpleShimmer = styled.div`
	width: 60%;
	height: 6px;
	border-radius: ${({ theme }) => theme.borderRadius.small};
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.colors.background.card2} 25%,
		${({ theme }) => theme.colors.border.default} 50%,
		${({ theme }) => theme.colors.background.card2} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 1.5s ease-in-out infinite;
`;

/* ───────────── typewriter hook ───────────── */

function useTypewriter(text: string, speed = 30) {
	const [displayed, setDisplayed] = useState('');
	const [done, setDone] = useState(false);
	const prevText = useRef(text);

	useEffect(() => {
		if (text !== prevText.current) {
			setDisplayed('');
			setDone(false);
			prevText.current = text;
		}

		if (done) return;

		const i = displayed.length;
		if (i >= text.length) {
			setDone(true);
			return;
		}

		const timer = setTimeout(() => {
			setDisplayed(text.slice(0, i + 1));
		}, speed);

		return () => clearTimeout(timer);
	}, [text, displayed, done, speed]);

	return { displayed, done };
}

/* ───────────── revealed lines hook ───────────── */

/** Accumulates each new message as a line, deduplicating consecutive repeats */
function useRevealedLines(message: string, wsStatus: string | null) {
	const [lines, setLines] = useState<string[]>([]);
	const prevMessage = useRef<string | null>(null);

	useEffect(() => {
		// Only add if it's different from the last line
		if (message && message !== prevMessage.current) {
			prevMessage.current = message;
			setLines((prev) => [...prev, message]);
		}
	}, [message]);

	// Reset when wsStatus becomes null (new request)
	useEffect(() => {
		if (wsStatus === null) {
			setLines([]);
			prevMessage.current = null;
		}
	}, [wsStatus]);

	return lines;
}

/* ───────────── component ───────────── */

export interface LoadingIndicatorProps {
	/** Simple text shown in non-step mode or as fallback */
	message?: string;
	/** Raw WebSocket status key — drives reveal mode when provided */
	wsStatus?: string | null;
	className?: string;
	style?: React.CSSProperties;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
	message = 'Loading...',
	wsStatus,
	className,
	style,
}) => {
	/* ── Simple mode — no wsStatus prop at all ── */
	if (wsStatus === undefined) {
		return (
			<SimpleContainer className={className} style={style}>
				<SimpleText>{message}</SimpleText>
				<SimpleShimmer />
			</SimpleContainer>
		);
	}

	/* ── Reveal mode — lines appear one at a time ── */
	const lines = useRevealedLines(message, wsStatus);
	const currentLine = lines[lines.length - 1] ?? message;
	const completedLines = lines.slice(0, -1);
	const { displayed, done } = useTypewriter(currentLine, 28);

	return (
		<Container className={className} style={style}>
			<LinesContainer>
				{/* Previously revealed lines — dimmed */}
				{completedLines.map((line, i) => (
					<RevealedLine key={i}>{line}</RevealedLine>
				))}

				{/* Current line — typewriter effect */}
				<ActiveLine>
					{displayed}
					{!done && <Cursor />}
				</ActiveLine>
			</LinesContainer>

			{/* Shimmer skeleton — preview of incoming response */}
			<SkeletonContainer>
				<SkeletonLine $width="90%" $delay="0s" />
				<SkeletonLine $width="75%" $delay="0.15s" />
				<SkeletonLine $width="60%" $delay="0.3s" />
			</SkeletonContainer>
		</Container>
	);
};

export default LoadingIndicator;