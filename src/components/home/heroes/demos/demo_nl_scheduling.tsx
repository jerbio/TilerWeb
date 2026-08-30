/**
 * Natural-language scheduling demo.
 *
 * Ported from the Lovable prototype: a command bar carrying the spoken request,
 * and a seven-day week underneath that acts as the proof. Blocks are pills in day
 * columns rather than a single day's timeline, because the claim being made here
 * is about a whole week rearranging.
 *
 * The prototype's motion is ambient — a blinking caret, floating ghosts, marching
 * dashes, all looping forever. This version keeps those textures but hangs them on
 * a scenario that resolves, so the arm reaches a terminal state the signup nudge
 * can be earned from:
 *
 *   0. the week as it already stands
 *   1. the request lands and gym sessions appear as ghosts, still settling
 *   2. they commit, and the report moves off Wednesday onto Thursday
 *   3. settled
 *
 * The settled state is the base CSS; animation only transitions into it, so
 * `prefers-reduced-motion` sees a finished week with no motion.
 */

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import SignupNudge from './signup_nudge';
import { useDemoScenario } from './use_demo_scenario';

const VARIANT = 'nl_scheduling' as const;
const SCENARIO = 'gym-four-times-this-week';

/** Request → wrong day → right day → report moves → settled. */
const STEPS = 5;

/** Column pitch, used to express travel in whole grid cells. */
const COL_GAP_PX = 6;
/** Distance between stacked pills, so travel can be expressed in rows too. */
const ROW_PITCH_PX = 39;

type PillKind = 'placed' | 'moving' | 'moved' | 'leaving' | 'existing' | 'rest';

type Block = {
	id: string;
	time: string;
	/** Step at which the block first appears. */
	from: number;
	/** Kind before and after it commits. */
	kind: (step: number) => PillKind;
	/** Where the block sits relative to its final slot, per step. */
	travel?: (step: number) => string;
};

type Day = { id: string; blocks: Block[] };

const cells = (columns: number): string => `calc(${columns * 100}% + ${columns * COL_GAP_PX}px)`;

/**
 * Gym sessions arrive in the wrong day and slide across into the right one. The
 * movement is the point — a pill that simply appears in its final position reads
 * as a static mock rather than a schedule being rebuilt.
 *
 * Drifts form a rotation across the columns the gyms themselves vacate, so no two
 * travelling pills ever occupy the same cell and none lands on an existing block.
 */
const gym = (id: string, time: string, drift: number): Block => ({
	id,
	time,
	from: 1,
	kind: (step) => (step >= 2 ? 'placed' : 'moving'),
	travel: (step) => (step >= 2 ? 'translate(0, 0)' : `translate(${cells(drift)}, 0)`),
});

const existing = (id: string, time: string): Block => ({
	id,
	time,
	from: 0,
	kind: () => 'existing',
});

const DAYS: Day[] = [
	{ id: 'mon', blocks: [gym('gym', '7:00', 1), existing('deepWork', '9:30')] },
	{
		id: 'tue',
		blocks: [
			gym('gym', '7:00', 1),
			existing('standup', '10:00'),
			{
				id: 'report',
				time: '14:00',
				from: 0,
				kind: (step) => (step >= 3 ? 'leaving' : 'existing'),
			},
		],
	},
	{ id: 'wed', blocks: [gym('gym', '7:00', 2)] },
	{
		id: 'thu',
		blocks: [
			{
				id: 'report',
				time: '11:00',
				from: 3,
				kind: () => 'moved',
				// Lifts out of its old Tuesday 14:00 slot — two columns back and two
				// rows down, since the gym pushes it to the bottom of that stack.
				travel: (step) =>
					step >= 4
						? 'translate(0, 0)'
						: `translate(${cells(-2)}, ${ROW_PITCH_PX * 2}px)`,
			},
			existing('oneOnOne', '15:00'),
		],
	},
	{ id: 'fri', blocks: [gym('gym', '7:00', -4), existing('review', '13:00')] },
	{ id: 'sat', blocks: [existing('rest', '—')] },
	{ id: 'sun', blocks: [existing('rest', '—')] },
];

const blink = keyframes`
	0%, 45% { opacity: 1; }
	50%, 100% { opacity: 0; }
`;

const glowPulse = keyframes`
	0%, 100% { opacity: 0.45; }
	50% { opacity: 0.85; }
`;

const dashMove = keyframes`
	to { stroke-dashoffset: -200; }
`;

const reducedMotionSafe = css`
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
`;

const CommandBar = styled.div`
	position: relative;
	width: 100%;
	max-width: 560px;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
	box-shadow: 0 24px 60px -30px ${palette.colors.black};
`;

const CommandGlow = styled.div`
	position: absolute;
	inset: -24px;
	z-index: -1;
	border-radius: ${palette.borderRadius.xxLarge};
	filter: blur(28px);
	background: radial-gradient(60% 60% at 50% 45%, ${palette.colors.purple[800]}, transparent 70%);
	animation: ${glowPulse} 3.6s ease-in-out infinite;
	${reducedMotionSafe}
`;

const CommandIcon = styled.span`
	display: grid;
	place-items: center;
	flex: 0 0 32px;
	height: 32px;
	border-radius: ${palette.borderRadius.medium};
	background: ${palette.colors.purple[900]};
	color: ${palette.colors.purple[300]};
`;

const CommandText = styled.span`
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.semibold};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Caret = styled.span`
	display: inline-block;
	width: 3px;
	height: 1.05em;
	margin-left: 4px;
	vertical-align: -0.12em;
	border-radius: 2px;
	background: ${palette.colors.purple[300]};
	animation: ${blink} 1.05s steps(1) infinite;
	${reducedMotionSafe}
`;

const CommandAction = styled.span<{ $done: boolean }>`
	flex: 0 0 auto;
	padding: 7px 12px;
	border-radius: ${palette.borderRadius.medium};
	background: ${({ $done }) => ($done ? palette.colors.purple[900] : palette.colors.purple[500])};
	color: ${({ $done }) => ($done ? palette.colors.purple[300] : palette.colors.white)};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
	white-space: nowrap;
	transition:
		background 240ms ease,
		color 240ms ease;
`;

const GridCard = styled.div`
	position: relative;
	width: 100%;
	padding: 12px;
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
`;

const GridHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
	padding: 0 2px;
`;

const GridTitle = styled.span`
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.1em;
	text-transform: uppercase;
`;

const GridStatus = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: ${palette.colors.purple[300]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};

	&::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${palette.colors.purple[300]};
		animation: ${glowPulse} 3.6s ease-in-out infinite;
		${reducedMotionSafe}
	}
`;

const Week = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 6px;
`;

const DayColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-height: 66px;
`;

const DayName = styled.span`
	padding: 0 2px 2px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.06em;
	text-transform: uppercase;
`;

/**
 * Colour carries meaning across every arm: lilac is what Tiler placed, amber is
 * what Tiler moved, neutral is what the visitor already had.
 */
const KIND_STYLES: Record<PillKind, ReturnType<typeof css>> = {
	placed: css`
		background: ${palette.colors.purple[500]};
		border: 1px solid ${palette.colors.purple[500]};
		color: ${palette.colors.white};
	`,
	moving: css`
		background: ${palette.colors.purple[900]};
		border: 1px dashed ${palette.colors.purple[400]};
		color: ${palette.colors.purple[200]};
		/* Lifted so a pill crossing columns passes over its neighbours, not under. */
		position: relative;
		z-index: 2;
	`,
	moved: css`
		background: ${palette.colors.warning[500]};
		border: 1px solid ${palette.colors.warning[500]};
		color: ${palette.colors.warning[900]};
		position: relative;
		z-index: 2;
	`,
	leaving: css`
		background: ${palette.colors.warning[900]};
		border: 1px dashed ${palette.colors.warning[600]};
		color: ${palette.colors.warning[300]};
	`,
	existing: css`
		background: ${palette.colors.gray[800]};
		border: 1px solid ${palette.colors.gray[700]};
		color: ${palette.colors.gray[300]};
	`,
	rest: css`
		background: ${palette.colors.gray[900]};
		border: 1px solid ${palette.colors.gray[800]};
		color: ${palette.colors.gray[500]};
	`,
};

const Pill = styled.div<{ $kind: PillKind; $travel: string }>`
	padding: 5px 7px;
	border-radius: ${palette.borderRadius.medium};
	font-family: ${palette.typography.fontFamily.inter};
	line-height: 1.15;
	opacity: 1;
	transform: ${({ $travel }) => $travel};
	/* State changes transition rather than animate: a transition always settles on
	   its target even if interrupted. */
	transition:
		transform 720ms cubic-bezier(0.22, 1, 0.36, 1),
		background 260ms ease,
		border-color 260ms ease,
		color 260ms ease;
	${({ $kind }) => KIND_STYLES[$kind]}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		animation: none;
	}
`;

const PillTime = styled.span`
	display: block;
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	opacity: 0.6;
	font-variant-numeric: tabular-nums;
`;

const PillLabel = styled.span`
	display: block;
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const MotionArc = styled.svg`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	overflow: visible;

	path {
		stroke-dasharray: 5 9;
		animation: ${dashMove} 2.8s linear infinite;
		${reducedMotionSafe}
	}
`;

const Legend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 4px 16px;
	margin-top: 10px;
	padding: 0 2px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
`;

const LegendItem = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
`;

const Swatch = styled.span<{ $kind: PillKind }>`
	width: 10px;
	height: 10px;
	border-radius: 3px;
	${({ $kind }) => KIND_STYLES[$kind]}
	animation: none;
`;

const NudgeRow = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
`;

const DemoNlScheduling: React.FC<{ active?: boolean }> = ({ active = true }) => {
	const { t } = useTranslation();
	const { step, complete } = useDemoScenario(STEPS, active, { loop: true });
	const key = `home.heroExperiment.${VARIANT}.demo`;
	const committed = step >= 3;

	return (
		<Wrapper data-demo={VARIANT}>
			<CommandBar>
				<CommandGlow />
				<CommandIcon aria-hidden="true">
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path
							d="M12 2c.4 3.9 2.1 5.6 6 6-3.9.4-5.6 2.1-6 6-.4-3.9-2.1-5.6-6-6 3.9-.4 5.6-2.1 6-6Z"
							fill="currentColor"
						/>
					</svg>
				</CommandIcon>
				<CommandText>
					{t(`${key}.request`)}
					<Caret aria-hidden="true" />
				</CommandText>
				<CommandAction $done={committed}>
					{committed ? t(`${key}.scheduled`) : t(`${key}.schedule`)}
				</CommandAction>
			</CommandBar>

			<GridCard>
				<GridHead>
					<GridTitle>{t(`${key}.thisWeek`)}</GridTitle>
					{step >= 1 && !complete && <GridStatus>{t(`${key}.rearranging`)}</GridStatus>}
					{complete && <GridStatus>{t(`${key}.done`)}</GridStatus>}
				</GridHead>

				<Week>
					{committed && (
						<MotionArc
							viewBox="0 0 700 120"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							{/* Tuesday's third row up to Thursday's first: 100 units per column. */}
							<path
								d="M182,94 C245,80 305,50 358,30"
								fill="none"
								stroke={palette.colors.warning[400]}
								strokeWidth="2"
								strokeOpacity="0.7"
							/>
						</MotionArc>
					)}

					{DAYS.map((day) => (
						<DayColumn key={day.id}>
							<DayName>{t(`${key}.days.${day.id}`)}</DayName>
							{day.blocks
								.filter((block) => step >= block.from)
								.map((block) => {
									const kind = block.kind(step);
									return (
										<Pill
											key={block.id}
											$kind={kind}
											$travel={block.travel?.(step) ?? 'translate(0, 0)'}
											data-tile-state={kind}
										>
											<PillTime>{block.time}</PillTime>
											<PillLabel>{t(`${key}.items.${block.id}`)}</PillLabel>
										</Pill>
									);
								})}
						</DayColumn>
					))}
				</Week>

				<Legend>
					<LegendItem>
						<Swatch $kind="placed" />
						{t(`${key}.legend.placed`)}
					</LegendItem>
					<LegendItem>
						<Swatch $kind="moving" />
						{t(`${key}.legend.moving`)}
					</LegendItem>
					<LegendItem>
						<Swatch $kind="moved" />
						{t(`${key}.legend.moved`)}
					</LegendItem>
				</Legend>
			</GridCard>

			<NudgeRow>
				<SignupNudge variant={VARIANT} visible={complete} scenario={SCENARIO} />
			</NudgeRow>
		</Wrapper>
	);
};

export default DemoNlScheduling;
