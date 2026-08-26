/**
 * Shared chrome for every hero arm.
 *
 * All five arms compose these primitives rather than styling their own, which is
 * what makes the experiment a test of the message instead of a test of typography.
 * Every value resolves through `palette`; a raw literal in an arm is a defect the
 * theme-conformance test fails on.
 *
 * The height ladder is copied from the control hero so no arm shifts the fold —
 * a variant that moves the fold would be measured against a different page.
 */

import styled from 'styled-components';
import palette from '@/core/theme/palette';

/**
 * Matched to the control hero's measured height, not its `min-height`.
 * Control renders taller than its own minimum because of its content, so copying
 * the minimum alone would still leave the fold in a different place per arm.
 */
export const HERO_MIN_HEIGHT_PX = 728;
export const HERO_MIN_HEIGHT_LG_PX = 620;
export const HERO_MIN_HEIGHT_MD_PX = 560;

export const HeroRoot = styled.section`
	position: relative;
	overflow: hidden;
	min-height: ${HERO_MIN_HEIGHT_PX}px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;

	@media (max-width: ${palette.screens.lg}) {
		min-height: ${HERO_MIN_HEIGHT_LG_PX}px;
		padding: 3rem 1.5rem;
	}

	@media (max-width: ${palette.screens.md}) {
		min-height: ${HERO_MIN_HEIGHT_MD_PX}px;
		padding: 2rem 1rem;
	}
`;

export const HeroLayout = styled.div`
	position: relative;
	z-index: 10;
	width: 100%;
	max-width: ${palette.container.sizes.xLarge};
	margin: 0 auto;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	align-items: center;
	gap: ${palette.space.large};

	@media (max-width: ${palette.screens.lg}) {
		grid-template-columns: minmax(0, 1fr);
		gap: ${palette.space.medium};
	}
`;

export const HeroCopy = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${palette.space.small};
	align-items: flex-start;
	text-align: left;

	@media (max-width: ${palette.screens.lg}) {
		align-items: center;
		text-align: center;
	}
`;

/**
 * Centred, single-column composition for arms whose proof needs full width —
 * a seven-day week cannot be read in half a hero.
 */
export const HeroStack = styled.div`
	position: relative;
	z-index: 10;
	width: 100%;
	max-width: ${palette.container.sizes.large};
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${palette.space.small};
	text-align: center;
`;

export const HeroStackCopy = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
`;

export const Eyebrow = styled.p`
	margin: 0;
	color: ${palette.colors.brand[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

/** Matches the gradient treatment `SectionHeaders` establishes for the rest of the page. */
export const Title = styled.h1`
	margin: 0;
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.displayLg};
	font-weight: ${palette.typography.fontWeight.bold};
	line-height: 1.1;
	background: linear-gradient(
		to bottom,
		${palette.colors.white},
		70%,
		${palette.colors.gray[400]}
	);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;

	@media (max-width: ${palette.screens.lg}) {
		font-size: ${palette.typography.fontSize.displayBase};
	}

	@media (max-width: ${palette.screens.md}) {
		font-size: ${palette.typography.fontSize.displaySm};
	}
`;

/** Second clause of a two-part headline. */
export const TitleAccent = styled.span`
	display: block;
	background: linear-gradient(
		to bottom,
		${palette.colors.brand[200]},
		70%,
		${palette.colors.brand[500]}
	);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
`;

export const Subtitle = styled.p`
	margin: 0;
	max-width: 540px;
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.lg};
	line-height: ${palette.typography.lineHeight.lg};
`;

export const Footnote = styled.p`
	margin: 0;
	max-width: 540px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	line-height: ${palette.typography.lineHeight.md};
`;

export const DemoSlot = styled.div`
	position: relative;
	width: 100%;
	min-height: 320px;
	display: flex;
	align-items: center;
	justify-content: center;

	@media (max-width: ${palette.screens.md}) {
		min-height: 240px;
	}
`;
