/**
 * Decomposition diagram.
 *
 * Ported from the Lovable prototype: one prominent source task, SVG fracture
 * lines curving out to the days that receive work, and a seven-column week strip
 * whose session chips are sized by duration and drop in one at a time.
 *
 * The chips carry a light face rather than the product tile's dark surface. This
 * is a diagram of work being broken up, not a rendering of a calendar — the
 * source is a task that has no slot yet, and the chips are what it becomes. The
 * timeline arm (`self_healing`) is where real calendar tiles appear, and that is
 * where product tile fidelity is enforced.
 *
 * The choreography is stretched across the shared pacing budget so the last chip
 * lands just before the nudge is offered, rather than finishing early and leaving
 * dead air.
 */

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import SignupNudge from './signup_nudge';
import { DEMO_TOTAL_MS, useDemoScenario } from './use_demo_scenario';

const VARIANT = 'task_splitting' as const;
const SCENARIO = 'split-my-project';

/** Two steps: the cycle runs, then the nudge is earned. */
const STEPS = 2;

const EASE = 'cubic-bezier(0.22, 1.1, 0.36, 1)';

/** Fractions of the shared budget, so the arc fills it instead of ending early. */
const at = (fraction: number): number => Math.round(DEMO_TOTAL_MS * fraction);

type Session = { id: string; hours: number; label: string };
type Day = { id: string; sessions: Session[] };

const DAYS: Day[] = [
	{ id: 'mon', sessions: [{ id: 'outline', hours: 2, label: '2 hr' }] },
	{ id: 'tue', sessions: [{ id: 'sources', hours: 1.5, label: '1.5 hr' }] },
	{ id: 'wed', sessions: [] },
	{
		id: 'thu',
		sessions: [
			{ id: 'draftOne', hours: 3, label: '3 hr' },
			{ id: 'notes', hours: 1, label: '1 hr' },
		],
	},
	{ id: 'fri', sessions: [] },
	{ id: 'sat', sessions: [{ id: 'draftTwo', hours: 2.5, label: '2.5 hr' }] },
	{ id: 'sun', sessions: [{ id: 'edit', hours: 2, label: '2 hr' }] },
];

/** Column centres in the 0-100 overlay space, for the days that receive work. */
const LINE_TARGETS = [7.14, 21.43, 50, 50, 78.57, 92.86];

const SESSION_ORDER = DAYS.flatMap((day, dayIndex) =>
	day.sessions.map((session, index) => ({ ...session, dayIndex, index }))
);

const fall = keyframes`
	0% { opacity: 0; transform: translateY(-38px) rotate(-6deg) scale(0.92); }
	70% { transform: translateY(3px) rotate(0.5deg) scale(1); }
	100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
`;

const draw = keyframes`
	from { stroke-dashoffset: 320; }
	to { stroke-dashoffset: 0; }
`;

const rise = keyframes`
	from { opacity: 0; transform: translateY(14px); }
	to { opacity: 1; transform: translateY(0); }
`;

/** Base state is the finished diagram, so reduced motion lands on it directly. */
const runOnce = (duration: number) => css`
	animation-duration: ${duration}ms;
	animation-timing-function: ${EASE};
	animation-iteration-count: 1;
	animation-fill-mode: both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const Panel = styled.div`
	position: relative;
	overflow: hidden;
	width: 100%;
	max-width: 460px;
	padding: ${palette.space.medium};
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
	box-shadow: 0 20px 50px -22px ${palette.colors.purple[700]};
`;

const SourceRow = styled.div`
	position: relative;
	z-index: 10;
	display: flex;
	justify-content: center;
`;

/** The task before it has a slot, so it deliberately does not read as a tile. */
const SourceTask = styled.div`
	width: 100%;
	max-width: 320px;
	padding: 14px 18px;
	border-radius: ${palette.borderRadius.large};
	background: linear-gradient(
		135deg,
		${palette.colors.purple[200]},
		${palette.colors.purple[400]}
	);
	color: ${palette.colors.gray[900]};
	box-shadow: 0 10px 30px -12px ${palette.colors.purple[700]};
	animation-name: ${rise};
	${runOnce(700)}
`;

const SourceHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: ${palette.space.small};
`;

const SourceName = styled.span`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.bold};
`;

const SourceHours = styled.span`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	font-variant-numeric: tabular-nums;
`;

const SourceDue = styled.div`
	margin-top: 3px;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.18em;
	text-transform: uppercase;
	opacity: 0.7;
`;

/**
 * The fan gets its own band in normal flow rather than an overlay across the
 * whole panel. Percentage endpoints over the full panel drift with its aspect
 * ratio, which put the curves straight through the chips.
 */
const FractureBand = styled.div`
	position: relative;
	z-index: 1;
	height: 58px;
`;

const Fractures = styled.svg`
	pointer-events: none;
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	overflow: visible;
`;

const FractureLine = styled.path<{ $delay: number }>`
	fill: none;
	stroke: ${palette.colors.purple[400]};
	stroke-opacity: 0.5;
	stroke-width: 1;
	stroke-dasharray: 320;
	animation-name: ${draw};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce(1100)}
`;

const WeekStrip = styled.div`
	position: relative;
	z-index: 10;
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 6px;
`;

const DayColumn = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
`;

const DayLabel = styled.div`
	margin-bottom: 6px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.14em;
	text-transform: uppercase;
`;

const DayTrack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	height: 152px;
	padding: 5px;
	border-radius: ${palette.borderRadius.medium};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.black}40;
`;

/** Height carries the duration, which is the whole point of the diagram. */
const SessionChip = styled.div<{ $hours: number; $delay: number }>`
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	height: ${({ $hours }) => 22 + $hours * 14}px;
	border-radius: ${palette.borderRadius.little};
	background: linear-gradient(
		135deg,
		${palette.colors.purple[200]},
		${palette.colors.purple[400]}
	);
	color: ${palette.colors.gray[900]};
	box-shadow: 0 6px 16px -10px ${palette.colors.black};
	opacity: 0;
	animation-name: ${fall};
	animation-delay: ${({ $delay }) => $delay}ms;
	${runOnce(750)}
`;

const ChipLabel = styled.span`
	white-space: nowrap;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.bold};
	font-variant-numeric: tabular-nums;
`;

const DueFlag = styled.div`
	margin-top: auto;
	padding-top: 4px;
	display: flex;
	align-items: center;
	gap: 4px;
	animation-name: ${rise};
	animation-delay: ${at(0.82)}ms;
	${runOnce(700)}
`;

const DueSwatch = styled.span`
	width: 7px;
	height: 7px;
	border-radius: 2px;
	background: ${palette.colors.error[400]};
`;

const DueText = styled.span`
	color: ${palette.colors.error[400]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.1em;
	text-transform: uppercase;
`;

const Caption = styled.p`
	position: relative;
	z-index: 10;
	margin: 16px 0 0;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	letter-spacing: 0.16em;
	text-transform: uppercase;
	animation-name: ${rise};
	animation-delay: ${at(0.85)}ms;
	${runOnce(700)}
`;

const NudgeRow = styled.div`
	position: relative;
	z-index: 10;
	margin-top: 14px;
`;

const DemoTaskSplitting: React.FC<{ active?: boolean }> = ({ active = true }) => {
	const { t } = useTranslation();
	const { complete } = useDemoScenario(STEPS, active);
	const key = `home.heroExperiment.${VARIANT}.demo`;

	const chipDelay = (id: string): number => {
		const order = SESSION_ORDER.findIndex((session) => session.id === id);
		return at(0.34) + order * at(0.08);
	};

	return (
		<Panel data-demo={VARIANT}>
			<SourceRow>
				<SourceTask>
					<SourceHeader>
						<SourceName>{t(`${key}.task`)}</SourceName>
						<SourceHours>{t(`${key}.total`)}</SourceHours>
					</SourceHeader>
					<SourceDue>{t(`${key}.due`)}</SourceDue>
				</SourceTask>
			</SourceRow>

			<FractureBand>
				<Fractures aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
					{LINE_TARGETS.map((x, index) => (
						<FractureLine
							key={`${x}-${index}`}
							d={`M 50 0 C 50 58, ${x} 42, ${x} 100`}
							vectorEffect="non-scaling-stroke"
							$delay={at(0.08) + index * at(0.04)}
						/>
					))}
				</Fractures>
			</FractureBand>

			<WeekStrip>
				{DAYS.map((day) => (
					<DayColumn key={day.id}>
						<DayLabel>{t(`${key}.days.${day.id}`)}</DayLabel>
						<DayTrack>
							{day.sessions.map((session) => (
								<SessionChip
									key={session.id}
									$hours={session.hours}
									$delay={chipDelay(session.id)}
									title={`${t(`${key}.parts.${session.id}`)} · ${session.label}`}
									data-tile-state="placed"
								>
									<ChipLabel>{session.label}</ChipLabel>
								</SessionChip>
							))}

							{day.id === 'sun' && (
								<DueFlag>
									<DueSwatch />
									<DueText>{t(`${key}.dueFlag`)}</DueText>
								</DueFlag>
							)}
						</DayTrack>
					</DayColumn>
				))}
			</WeekStrip>

			<Caption>{t(`${key}.caption`)}</Caption>

			<NudgeRow>
				<SignupNudge variant={VARIANT} visible={complete} scenario={SCENARIO} />
			</NudgeRow>
		</Panel>
	);
};

export default DemoTaskSplitting;
