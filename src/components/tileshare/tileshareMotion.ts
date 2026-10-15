import { css, keyframes } from 'styled-components';

export const TILESHARE_EXIT_MS = 140;
export const TILESHARE_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const reveal = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: none; }
`;
export const tileShareReveal = css`
	animation: ${reveal} 180ms ${TILESHARE_EASING};
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

export const tileShareInteraction = css`
	transition:
		background-color 140ms ease,
		border-color 140ms ease,
		color 140ms ease,
		box-shadow 140ms ease;
	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[500]};
		outline-offset: 3px;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;
