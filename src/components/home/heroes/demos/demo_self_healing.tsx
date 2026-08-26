/**
 * Recovery timeline.
 *
 * Ported from the Lovable prototype's choreography: proportional block geometry
 * on a real time axis, dashed "was" outlines left at the vacated slot, gradient
 * motion trails tracing the displacement, a strike and dim on the block that
 * overran, and a settle-in summary.
 *
 * Two deliberate departures from the prototype:
 *
 *  - It runs once and stops rather than looping every 12s. The arm has to reach a
 *    terminal state for the signup nudge to be earned; a loop would reset the
 *    story out from under the ask.
 *  - Geometry is percentages of the stage, not fixed pixels, so the composition
 *    survives the breakpoint where the hero stacks.
 *
 * The settled state is the *base* CSS and the animation transitions into it, so
 * `prefers-reduced-motion` lands on the recovered schedule with no motion at all.
 */

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import type { RGB } from '@/core/util/colors';
import { DEMO_TILE_COLORS, tileRgb, tileSurfaceCss } from './demo_tile';
import SignupNudge from './signup_nudge';
import { DEMO_TOTAL_MS, useDemoScenario } from './use_demo_scenario';

const VARIANT = 'self_healing' as const;
const SCENARIO = 'recover-my-day';

/** Two steps: the cycle runs, then the nudge is earned. */
const STEPS = 2;

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CYCLE = `${DEMO_TOTAL_MS}ms`;

/**
 * Percentages of the stage, preserving the prototype's 470px proportions. Blocks
 * are sized by duration, which is what makes this read as a calendar rather than
 * a list.
 */
type Block = {
	id: string;
	time: string;
	top: number;
	height: number;
	shift: number;
	movedTo?: string;
	colors: RGB;
};

const BLOCKS: Block[] = [
	{
		id: 'morningReview',
		time: '9:00',
		top: 0,
		height: 13.19,
		shift: 0,
		colors: DEMO_TILE_COLORS.focus,
	},
	{
		id: 'clientCall',
		time: '10:00',
		top: 15.74,
		height: 15.74,
		shift: 0,
		colors: DEMO_TILE_COLORS.personal,
	},
	{
		id: 'deepWork',
		time: '11:30',
		top: 34.04,
		height: 20.43,
		shift: 9.79,
		movedTo: '13:00',
		colors: DEMO_TILE_COLORS.work,
	},
	{
		id: 'designSync',
		time: '13:00',
		top: 57.02,
		height: 14.04,
		shift: 9.79,
		movedTo: '14:15',
		colors: DEMO_TILE_COLORS.focus,
	},
	{
		id: 'gym',
		time: '14:15',
		top: 73.62,
		height: 12.34,
		shift: 9.79,
		movedTo: '17:00',
		colors: DEMO_TILE_COLORS.personal,
	},
];

const HOUR_RULES = [0, 15.74, 31.49, 47.23, 62.98, 78.72];
const DISRUPTED_ID = 'clientCall';

const strike = keyframes`
	0%, 20% { transform: scaleX(0); opacity: 0; }
	28%, 100% { transform: scaleX(1); opacity: 1; }
`;

const badgeIn = keyframes`
	0%, 17% { opacity: 0; transform: translateY(6px) scale(0.94); }
	26%, 100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const dim = keyframes`
	0%, 20% { opacity: 1; filter: saturate(1); }
	33%, 100% { opacity: 0.45; filter: saturate(0.2); }
`;

const shiftDown = keyframes`
	0%, 33% { transform: translateY(0); }
	50%, 100% { transform: translateY(var(--shift)); }
`;

const ghostIn = keyframes`
	0%, 33% { opacity: 0; }
	43%, 100% { opacity: 0.75; }
`;

const trailIn = keyframes`
	0%, 35% { opacity: 0; transform: scaleY(0); }
	46% { opacity: 0.9; transform: scaleY(1); }
	68% { opacity: 0.35; transform: scaleY(1); }
	85%, 100% { opacity: 0; transform: scaleY(1); }
`;

const settle = keyframes`
	0%, 54% { opacity: 0; transform: translateY(8px); }
	67%, 100% { opacity: 1; transform: translateY(0); }
`;

/** Single run landing on the settled state, which the base styles already describe. */
const runOnce = css`
	animation-duration: ${CYCLE};
	animation-timing-function: ${EASE};
	animation-iteration-count: 1;
	animation-fill-mode: both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const Panel = styled.div`
	position: relative;
	width: 100%;
	max-width: 400px;
	padding: ${palette.space.small};
	border-radius: ${palette.borderRadius.xxLarge};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
	box-shadow: 0 20px 50px -22px ${palette.colors.purple[700]};
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
`;

const Day = styled.p`
	margin: 0;
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[100]};
`;

const RebuiltPill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: ${palette.borderRadius.xxLarge};
	background: ${palette.colors.purple[900]};
	color: ${palette.colors.purple[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	animation-name: ${settle};
	${runOnce}

	&::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${palette.colors.purple[300]};
	}
`;

const Stage = styled.div`
	position: relative;
	height: 408px;

	@media (max-width: ${palette.screens.lg}) {
		height: 360px;
	}

	@media (max-width: ${palette.screens.md}) {
		height: 310px;
	}
`;

const HourRule = styled.div<{ $top: number }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}%;
	border-top: 1px solid ${palette.colors.gray[800]};
`;

const Ghost = styled.div<{ $top: number; $height: number; $delay: number }>`
	position: absolute;
	left: 46px;
	right: 0;
	top: ${({ $top }) => $top}%;
	height: ${({ $height }) => $height}%;
	border: 1px dashed ${palette.colors.gray[600]};
	border-radius: 10px;
	opacity: 0.75;
	animation-name: ${ghostIn};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

/**
 * A sibling of the ghost, not a child: the ghost's `opacity` creates a stacking
 * context, so a nested label could never paint above the tile that moved.
 */
const GhostLabel = styled.span<{ $top: number; $delay: number }>`
	position: absolute;
	right: 10px;
	top: ${({ $top }) => $top}%;
	z-index: 5;
	margin-top: 5px;
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.12em;
	text-transform: uppercase;
	animation-name: ${ghostIn};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

const Trail = styled.div<{ $top: number; $height: number; $delay: number }>`
	position: absolute;
	left: 22px;
	width: 3px;
	top: ${({ $top }) => $top}%;
	height: ${({ $height }) => $height}%;
	transform-origin: top;
	border-radius: ${palette.borderRadius.small};
	background: linear-gradient(
		135deg,
		${palette.colors.purple[300]},
		${palette.colors.indigo[400]}
	);
	opacity: 0;
	animation-name: ${trailIn};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

const Slot = styled.div<{ $top: number; $height: number; $shift: number; $delay: number }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}%;
	height: ${({ $height }) => $height}%;
	--shift: ${({ $shift }) => $shift}%;
	transform: translateY(var(--shift));
	display: flex;
	align-items: stretch;
	gap: 10px;
	animation-name: ${({ $shift }) => ($shift === 0 ? 'none' : shiftDown)};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

const SlotTime = styled.span`
	flex: 0 0 36px;
	padding-top: 2px;
	text-align: right;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-variant-numeric: tabular-nums;
`;

const BlockSurface = styled.div<{ $colors: RGB; $disrupted: boolean }>`
	position: relative;
	flex: 1;
	overflow: hidden;
	padding: 7px 10px;
	${tileSurfaceCss}
	box-shadow: 0 8px 24px -14px ${palette.colors.black};
	animation-name: ${({ $disrupted }) => ($disrupted ? dim : 'none')};
	${runOnce}
`;

const BlockTitle = styled.p`
	margin: 0;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	line-height: ${palette.typography.lineHeight.xs};
`;

const BlockNote = styled.p<{ $colors: RGB }>`
	margin: 2px 0 0;
	color: ${({ $colors }) => tileRgb($colors, 0.7)};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
`;

const Strike = styled.span`
	position: absolute;
	left: 10px;
	right: 10px;
	top: 50%;
	height: 1px;
	transform-origin: left;
	background: ${palette.colors.warning[400]};
	animation-name: ${strike};
	${runOnce}
`;

const LateBadge = styled.span<{ $top: number }>`
	position: absolute;
	right: 4px;
	top: ${({ $top }) => $top}%;
	z-index: 10;
	padding: 3px 9px;
	border-radius: ${palette.borderRadius.xxLarge};
	border: 1px solid ${palette.colors.warning[700]};
	background: ${palette.colors.warning[900]};
	color: ${palette.colors.warning[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	white-space: nowrap;
	animation-name: ${badgeIn};
	${runOnce}
`;

const Summary = styled.div`
	margin-top: 12px;
	padding: 7px 10px;
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.purple[800]};
	background: ${palette.colors.purple[900]};
	color: ${palette.colors.purple[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	animation-name: ${settle};
	${runOnce}
`;

const NudgeRow = styled.div`
	margin-top: 12px;
`;

const DemoSelfHealing: React.FC<{ active?: boolean }> = ({ active = true }) => {
	const { t } = useTranslation();
	const { complete } = useDemoScenario(STEPS, active);
	const key = `home.heroExperiment.${VARIANT}.demo`;
	const disrupted = BLOCKS.find((block) => block.id === DISRUPTED_ID);

	return (
		<Panel data-demo={VARIANT}>
			<Header>
				<Day>{t(`${key}.label`)}</Day>
				<RebuiltPill>{t(`${key}.rebuiltIn`)}</RebuiltPill>
			</Header>

			<Stage>
				{HOUR_RULES.map((top) => (
					<HourRule key={top} $top={top} />
				))}

				{BLOCKS.map((block, index) => {
					const moves = block.shift !== 0;
					const delay = index * 120;
					const isDisrupted = block.id === DISRUPTED_ID;

					return (
						<React.Fragment key={block.id}>
							{moves && (
								<>
									<Ghost $top={block.top} $height={block.height} $delay={delay} />
									<GhostLabel $top={block.top} $delay={delay}>
										{t(`${key}.wasAt`, { time: block.time })}
									</GhostLabel>
								</>
							)}

							{moves && (
								<Trail
									$top={block.top + 2}
									$height={block.shift + block.height - 4}
									$delay={delay}
								/>
							)}

							<Slot
								$top={block.top}
								$height={block.height}
								$shift={block.shift}
								$delay={delay}
								data-tile-state={moves ? 'placed' : 'settled'}
							>
								<SlotTime>{block.movedTo ?? block.time}</SlotTime>
								<BlockSurface $colors={block.colors} $disrupted={isDisrupted}>
									<BlockTitle>{t(`${key}.items.${block.id}`)}</BlockTitle>
									<BlockNote $colors={block.colors}>
										{moves ? t(`${key}.movedSameDay`) : t(`${key}.onTrack`)}
									</BlockNote>
									{isDisrupted && <Strike />}
								</BlockSurface>
							</Slot>
						</React.Fragment>
					);
				})}

				{disrupted && (
					<LateBadge $top={disrupted.top + disrupted.height - 3}>
						{t(`${key}.overran`)}
					</LateBadge>
				)}
			</Stage>

			<Summary>{t(`${key}.caption`)}</Summary>

			<NudgeRow>
				<SignupNudge variant={VARIANT} visible={complete} scenario={SCENARIO} />
			</NudgeRow>
		</Panel>
	);
};

export default DemoSelfHealing;
