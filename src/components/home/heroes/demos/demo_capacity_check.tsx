/**
 * Capacity reality check.
 *
 * Ported from the Lovable prototype: a Mon–Fri grid on a real time axis that
 * fills column by column, then spills what will not fit into an overflow lane.
 *
 * The overflow lane is the whole argument, so it is the last thing to animate and
 * the only thing that goes amber. Everything else stays in the product's tile
 * palette; `demo_tile` reserves warm hues for exactly this kind of problem state.
 *
 * Like the other arms it runs once and stops rather than looping — the nudge has
 * to be earned by a terminal state, and a loop would reset the argument out from
 * under the ask.
 *
 * The filled state is the base CSS and the animation transitions into it, so
 * `prefers-reduced-motion` lands on the over-committed week with no motion.
 */

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import type { RGB } from '@/core/util/colors';
import { DEMO_TILE_COLORS, tileSurfaceCss } from './demo_tile';
import SignupNudge from './signup_nudge';
import { DEMO_TOTAL_MS, useDemoScenario } from './use_demo_scenario';

const VARIANT = 'capacity_check' as const;
const SCENARIO = 'does-my-week-fit';

/** Two steps: the week fills and spills, then the nudge is earned. */
const STEPS = 2;

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CYCLE = `${DEMO_TOTAL_MS}ms`;

type Block = { id: string; top: number; height: number; colors: RGB };
type Day = { id: string; blocks: Block[] };

/** Percentages of a 9:00–17:00 axis, so block size reads as duration. */
const DAYS: Day[] = [
	{
		id: 'mon',
		blocks: [
			{ id: 'standup', top: 0, height: 24, colors: DEMO_TILE_COLORS.focus },
			{ id: 'designReview', top: 28, height: 22, colors: DEMO_TILE_COLORS.work },
			{ id: 'deepWork', top: 54, height: 46, colors: DEMO_TILE_COLORS.personal },
		],
	},
	{
		id: 'tue',
		blocks: [
			{ id: 'sync', top: 0, height: 15, colors: DEMO_TILE_COLORS.personal },
			{ id: 'build', top: 19, height: 35, colors: DEMO_TILE_COLORS.focus },
			{ id: 'inbox', top: 58, height: 42, colors: DEMO_TILE_COLORS.admin },
		],
	},
	{
		id: 'wed',
		blocks: [
			{ id: 'oneOnOnes', top: 0, height: 18, colors: DEMO_TILE_COLORS.admin },
			{ id: 'sprintPrep', top: 22, height: 30, colors: DEMO_TILE_COLORS.work },
			{ id: 'writeup', top: 56, height: 44, colors: DEMO_TILE_COLORS.focus },
		],
	},
	{
		id: 'thu',
		blocks: [
			{ id: 'retro', top: 0, height: 20, colors: DEMO_TILE_COLORS.work },
			{ id: 'implementation', top: 24, height: 32, colors: DEMO_TILE_COLORS.focus },
			{ id: 'qaHandoff', top: 60, height: 40, colors: DEMO_TILE_COLORS.personal },
		],
	},
	{
		id: 'fri',
		blocks: [
			{ id: 'demo', top: 0, height: 18, colors: DEMO_TILE_COLORS.personal },
			{ id: 'wrapUp', top: 22, height: 30, colors: DEMO_TILE_COLORS.admin },
			{ id: 'review', top: 56, height: 44, colors: DEMO_TILE_COLORS.work },
		],
	},
];

const OVERFLOW = [
	{ id: 'urgentFix', top: 4, height: 26 },
	{ id: 'clientCall', top: 36, height: 38 },
];

const HOURS = ['9', '11', '13', '15', '17'];
const HOUR_RULES = [0, 25, 50, 75, 100];

/** Columns land one after another so the week visibly fills rather than appearing. */
const blockIn = keyframes`
	0%, 8% { opacity: 0; transform: translateY(10px) scaleY(0.9); }
	26%, 100% { opacity: 1; transform: translateY(0) scaleY(1); }
`;

const overflowIn = keyframes`
	0%, 58% { opacity: 0; transform: translateX(-14px); }
	76%, 100% { opacity: 1; transform: translateX(0); }
`;

const laneIn = keyframes`
	0%, 52% { opacity: 0; }
	70%, 100% { opacity: 1; }
`;

const verdictIn = keyframes`
	0%, 70% { opacity: 0; transform: translateY(6px); }
	84%, 100% { opacity: 1; transform: translateY(0); }
`;

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
	max-width: 440px;
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

const Label = styled.p`
	margin: 0;
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[100]};
`;

const CapacityPill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: ${palette.borderRadius.xxLarge};
	border: 1px solid ${palette.colors.warning[700]};
	background: ${palette.colors.warning[900]};
	color: ${palette.colors.warning[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	animation-name: ${verdictIn};
	${runOnce}
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 18px repeat(5, minmax(0, 1fr)) minmax(0, 0.9fr);
	gap: 4px;
`;

const HourAxis = styled.div`
	position: relative;
`;

const HourMark = styled.span<{ $top: number }>`
	position: absolute;
	right: 0;
	top: ${({ $top }) => $top}%;
	transform: translateY(-50%);
	color: ${palette.colors.gray[600]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-variant-numeric: tabular-nums;
`;

const ColumnHead = styled.span<{ $overflow?: boolean }>`
	display: block;
	margin-bottom: 6px;
	text-align: center;
	color: ${({ $overflow }) =>
		$overflow ? palette.colors.warning[400] : palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.1em;
	text-transform: uppercase;
`;

const Stage = styled.div`
	position: relative;
	height: 300px;

	@media (max-width: ${palette.screens.lg}) {
		height: 260px;
	}

	@media (max-width: ${palette.screens.md}) {
		height: 220px;
	}
`;

const HourRule = styled.div<{ $top: number }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}%;
	border-top: 1px solid ${palette.colors.gray[800]};
`;

const BlockSurface = styled.div<{ $colors: RGB; $top: number; $height: number; $delay: number }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}%;
	height: ${({ $height }) => $height}%;
	overflow: hidden;
	padding: 4px 5px;
	transform-origin: top;
	${tileSurfaceCss}
	animation-name: ${blockIn};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

const BlockTitle = styled.p`
	margin: 0;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	line-height: 1.15;
`;

/** Dashed and amber because this lane is the argument, not decoration. */
const OverflowLane = styled.div`
	position: relative;
	height: 100%;
	border: 1px dashed ${palette.colors.warning[700]};
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.warning[900]}33;
	animation-name: ${laneIn};
	${runOnce}
`;

const OverflowBlock = styled.div<{ $top: number; $height: number; $delay: number }>`
	position: absolute;
	left: 4px;
	right: 4px;
	top: ${({ $top }) => $top}%;
	height: ${({ $height }) => $height}%;
	overflow: hidden;
	padding: 4px 5px;
	border: 1px dashed ${palette.colors.warning[600]};
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.warning[900]};
	color: ${palette.colors.warning[300]};
	animation-name: ${overflowIn};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce}
`;

const Verdict = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
	margin-top: 12px;
	padding: 7px 10px;
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.warning[800]};
	background: ${palette.colors.warning[900]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	animation-name: ${verdictIn};
	${runOnce}
`;

const VerdictLoad = styled.span`
	color: ${palette.colors.warning[200]};
`;

const VerdictGap = styled.strong`
	color: ${palette.colors.warning[300]};
	font-weight: ${palette.typography.fontWeight.bold};
	letter-spacing: 0.06em;
	text-transform: uppercase;
`;

const NudgeRow = styled.div`
	margin-top: 12px;
`;

const DemoCapacityCheck: React.FC<{ active?: boolean }> = ({ active = true }) => {
	const { t } = useTranslation();
	const { complete } = useDemoScenario(STEPS, active);
	const key = `home.heroExperiment.${VARIANT}.demo`;

	return (
		<Panel data-demo={VARIANT}>
			<Header>
				<Label>{t(`${key}.label`)}</Label>
				<CapacityPill>{t(`${key}.capacity`)}</CapacityPill>
			</Header>

			<Grid>
				<div>
					<ColumnHead>&nbsp;</ColumnHead>
					<HourAxis>
						<Stage>
							{HOURS.map((hour, index) => (
								<HourMark key={hour} $top={HOUR_RULES[index]}>
									{hour}
								</HourMark>
							))}
						</Stage>
					</HourAxis>
				</div>

				{DAYS.map((day, dayIndex) => (
					<div key={day.id}>
						<ColumnHead>{t(`${key}.days.${day.id}`)}</ColumnHead>
						<Stage>
							{HOUR_RULES.map((top) => (
								<HourRule key={top} $top={top} />
							))}
							{day.blocks.map((block, blockIndex) => (
								<BlockSurface
									key={block.id}
									$colors={block.colors}
									$top={block.top}
									$height={block.height}
									$delay={dayIndex * 90 + blockIndex * 30}
									data-tile-state="settled"
								>
									<BlockTitle>{t(`${key}.items.${block.id}`)}</BlockTitle>
								</BlockSurface>
							))}
						</Stage>
					</div>
				))}

				<div>
					<ColumnHead $overflow>{t(`${key}.overflow`)}</ColumnHead>
					<Stage>
						<OverflowLane>
							{OVERFLOW.map((block, index) => (
								<OverflowBlock
									key={block.id}
									$top={block.top}
									$height={block.height}
									$delay={index * 140}
									data-tile-state="ghost"
								>
									<BlockTitle>{t(`${key}.items.${block.id}`)}</BlockTitle>
								</OverflowBlock>
							))}
						</OverflowLane>
					</Stage>
				</div>
			</Grid>

			<Verdict>
				<VerdictLoad>{t(`${key}.load`)}</VerdictLoad>
				<VerdictGap>{t(`${key}.wontFit`)}</VerdictGap>
			</Verdict>

			<NudgeRow>
				<SignupNudge variant={VARIANT} visible={complete} scenario={SCENARIO} />
			</NudgeRow>
		</Panel>
	);
};

export default DemoCapacityCheck;
