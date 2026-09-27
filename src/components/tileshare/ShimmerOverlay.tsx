import styled, { keyframes } from 'styled-components';

const sweep = keyframes`
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
`;

/**
 * A translucent shimmer sweep laid over a tilette surface (row card, board card,
 * detail section) while its RSVP response is saving. Mount/unmount around the
 * busy window; the host keeps the underlying content mounted.
 */
const ShimmerOverlay = styled.div`
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
	background: linear-gradient(
		90deg,
		transparent 30%,
		${({ theme }) => theme.colors.skeleton.highlight} 50%,
		transparent 70%
	);
	background-size: 200% 100%;
	animation: ${sweep} 1.6s linear infinite;
	opacity: 0.4;
`;

export default ShimmerOverlay;
