/**
 * List-to-day placement.
 *
 * Ported from the Lovable prototype: an inert checklist on the left, a real
 * scheduled day on the right, and a dashed connector between them. The contrast
 * between the two panels is the argument — a single column of tiles turning green
 * says nothing about what Tiler actually did.
 *
 * Departures from the prototype, all forced by the surrounding design:
 *
 *  - Dark surfaces via `palette`, not the prototype's cream (D2).
 *  - Hour rows are compressed and blocks clamp to a minimum height, so a
 *    half-hour task stays readable inside a hero-sized panel.
 *  - Blocks are revealed by the shared scenario clock rather than a CSS-only
 *    stagger, so the arm reaches a testable terminal state before the nudge.
 */

import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import type { RGB } from '@/core/util/colors';
import { DEMO_TILE_COLORS, tileRgb } from './demo_tile';
import SignupNudge from './signup_nudge';
import { useDemoScenario } from './use_demo_scenario';

const VARIANT = 'stop_deciding' as const;
const SCENARIO = 'plan-my-day';

const TASKS = ['memo', 'pharmacy', 'review', 'gym', 'train'] as const;

type Block = {
	id: string;
	/** Hours after the 8am origin. */
	start: number;
	span: number;
	colors: RGB;
};

const BLOCKS: Block[] = [
	{ id: 'memo', start: 0.5, span: 1.75, colors: DEMO_TILE_COLORS.focus },
	{ id: 'pharmacy', start: 2.5, span: 0.5, colors: DEMO_TILE_COLORS.admin },
	{ id: 'review', start: 3.5, span: 1.25, colors: DEMO_TILE_COLORS.work },
	{ id: 'train', start: 6, span: 0.5, colors: DEMO_TILE_COLORS.personal },
	{ id: 'gym', start: 7.5, span: 1.5, colors: DEMO_TILE_COLORS.focus },
];

const HOURS = ['8am', '9', '10', '11', '12pm', '1', '2', '3', '4', '5', '6pm'];
const ROW = 42;
/** Keeps a half-hour task legible; the prototype had 62px rows to spend. */
const MIN_BLOCK_HEIGHT = 26;
/** Below this a second line would be clipped mid-glyph, so the label stands alone. */
const TIME_LINE_MIN_HEIGHT = 36;

/** One step to reveal each block, plus a settling step before the nudge. */
const STEPS = BLOCKS.length + 2;

const formatTime = (offsetHours: number): string => {
	const total = 8 * 60 + offsetHours * 60;
	const hour24 = Math.floor(total / 60);
	const minutes = Math.round(total % 60);
	const suffix = hour24 >= 12 ? 'pm' : 'am';
	const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
	return `${hour12}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}${suffix}`;
};

const Panel = styled.div`
	width: 100%;
	max-width: 470px;
`;

const Split = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 0.82fr) 18px minmax(0, 1.18fr);
	align-items: start;
	gap: 8px;
`;

const SectionLabel = styled.p`
	margin: 0 0 10px;
	height: 12px;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.18em;
	text-transform: uppercase;
`;

const TaskList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const TaskItem = styled.li`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 9px 10px;
	border-radius: ${palette.borderRadius.medium};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
`;

const Checkbox = styled.span`
	flex: 0 0 12px;
	height: 12px;
	border-radius: ${palette.borderRadius.small};
	border: 1px solid ${palette.colors.gray[700]};
`;

const TaskText = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const Connector = styled.svg`
	margin-top: 96px;
	width: 18px;
	height: 26px;
	color: ${palette.colors.gray[700]};
`;

const DayCard = styled.div`
	padding: 10px;
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
`;

const Grid = styled.div`
	position: relative;
	height: ${(HOURS.length - 1) * ROW}px;
`;

const HourRow = styled.div<{ $top: number }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}px;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const HourLabel = styled.span`
	flex: 0 0 26px;
	text-align: right;
	color: ${palette.colors.gray[600]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-variant-numeric: tabular-nums;
`;

const HourRule = styled.span`
	flex: 1;
	height: 1px;
	background: ${palette.colors.gray[800]};
`;

const BlockLayer = styled.div`
	position: absolute;
	inset: 0 0 0 34px;
`;

const Block = styled.div<{ $top: number; $height: number; $colors: RGB; $visible: boolean }>`
	position: absolute;
	left: 0;
	right: 0;
	top: ${({ $top }) => $top}px;
	height: ${({ $height }) => $height}px;
	overflow: hidden;
	padding: 5px 8px;
	border-radius: ${palette.borderRadius.medium};
	background-color: ${({ $colors }) => tileRgb($colors, 0.325)};
	color: ${({ $colors }) => tileRgb($colors, 0.85)};
	border: 1px solid ${({ $colors }) => tileRgb($colors, 0.1)};
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: translateY(${({ $visible }) => ($visible ? '0' : '10px')})
		scale(${({ $visible }) => ($visible ? 1 : 0.985)});
	transition:
		opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 900ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

const BlockTitle = styled.p`
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	line-height: 1.25;
`;

const BlockTime = styled.p<{ $colors: RGB }>`
	margin: 2px 0 0;
	color: ${({ $colors }) => tileRgb($colors, 0.7)};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
	font-variant-numeric: tabular-nums;
`;

const Caption = styled.p`
	margin: 12px 0 0;
	color: ${palette.colors.gray[500]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.xxs};
`;

const NudgeRow = styled.div`
	margin-top: 12px;
`;

const DemoStopDeciding: React.FC<{ active?: boolean }> = ({ active = true }) => {
	const { t } = useTranslation();
	const { step, complete } = useDemoScenario(STEPS, active);
	const key = `home.heroExperiment.${VARIANT}.demo`;

	return (
		<Panel data-demo={VARIANT}>
			<Split>
				<div>
					<SectionLabel>{t(`${key}.listLabel`)}</SectionLabel>
					<TaskList>
						{TASKS.map((task) => (
							<TaskItem key={task}>
								<Checkbox />
								<TaskText>{t(`${key}.items.${task}`)}</TaskText>
							</TaskItem>
						))}
					</TaskList>
				</div>

				<Connector viewBox="0 0 18 26" aria-hidden="true">
					<path
						d="M1 13 H 13"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
						strokeDasharray="3 4"
						strokeLinecap="round"
					/>
					<path
						d="M11 9 L 15 13 L 11 17"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Connector>

				<div>
					<SectionLabel>{t(`${key}.scheduledLabel`)}</SectionLabel>
					<DayCard>
						<Grid>
							{HOURS.map((hour, index) => (
								<HourRow key={hour} $top={index * ROW}>
									<HourLabel>{hour}</HourLabel>
									<HourRule />
								</HourRow>
							))}

							<BlockLayer>
								{BLOCKS.map((block, index) => {
									const height = Math.max(MIN_BLOCK_HEIGHT, block.span * ROW - 6);

									return (
										<Block
											key={block.id}
											$top={block.start * ROW}
											$height={height}
											$colors={block.colors}
											$visible={step > index}
											data-tile-state={step > index ? 'placed' : 'ghost'}
										>
											<BlockTitle>{t(`${key}.items.${block.id}`)}</BlockTitle>
											{height >= TIME_LINE_MIN_HEIGHT && (
												<BlockTime $colors={block.colors}>
													{formatTime(block.start)} –{' '}
													{formatTime(block.start + block.span)}
												</BlockTime>
											)}
										</Block>
									);
								})}
							</BlockLayer>
						</Grid>
					</DayCard>
				</div>
			</Split>

			<Caption>{t(`${key}.caption`)}</Caption>

			<NudgeRow>
				<SignupNudge variant={VARIANT} visible={complete} scenario={SCENARIO} />
			</NudgeRow>
		</Panel>
	);
};

export default DemoStopDeciding;
