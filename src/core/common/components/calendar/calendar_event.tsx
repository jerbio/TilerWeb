import React from 'react';
import dayjs from 'dayjs';
import { animated } from '@react-spring/web';
import { Clock, LockKeyhole, MapPin, StickyNote } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import TimeUtil from '@/core/util/time';
import CalendarUtil from '@/core/util/calendar';
import colorUtil, { RGB } from '@/core/util/colors';
import { StyledEvent } from './calendar_events';
import { useTheme } from '@/core/theme/ThemeProvider';
import { useCalendarUI } from './calendar-ui.provider';
import { TypeDefaults } from '../../types/typeDefaults';
import type { SimulatedTileClassification } from '@/core/util/simulationDiff';
import {
	ThirdPartyType,
	type CalendarEvent as CalendarEventType,
} from '@/core/common/types/schedule';

type CalendarEventProps = {
	event: StyledEvent;
	selectedEvent: string | null;
	setSelectedEvent: (eventId: string | null) => void;
	setSelectedEventInfo: React.Dispatch<React.SetStateAction<StyledEvent | null>>;
	onClick?: () => void;
	/** When true, shows a pulse-glow ring to draw attention */
	focused?: boolean;
	/**
	 * Plan §5.2 — when present, the tile is rendered in simulation mode and
	 * receives tier-based styling (border/stripe/badge). Read-only behaviour
	 * is also enforced: the regular click path that opens the info modal is
	 * suppressed (see plan §5.6) and `onSimulatedClick` runs instead.
	 */
	simulation?: SimulatedTileClassification;
	/** Click forwarder used when `simulation` is present. */
	onSimulatedClick?: () => void;
	/** Selected-state visual layered on top of tier styling (plan §5.2.7). */
	simulationSelected?: boolean;
};

const CalendarEvent: React.FC<CalendarEventProps> = ({
	event,
	selectedEvent,
	setSelectedEvent,
	setSelectedEventInfo,
	onClick,
	focused = false,
	simulation,
	onSimulatedClick,
	simulationSelected = false,
}) => {
	const { isDarkMode } = useTheme();
	const inSimulation = !!simulation;
	const { t } = useTranslation();
	const openNotes = useCalendarUI((s) => s.editNotes.actions.open);
	const isThirdPartyEvent =
		!!event.thirdPartyType &&
		event.thirdPartyType !== ThirdPartyType.Tiler &&
		event.thirdPartyType !== 'tiler';
	return (
		<EventContainer
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
			// In simulation mode tiles are read-only — disable drag, resize,
			// double-click-edit, right-click menu, keyboard delete, and
			// mark-done per plan §5.6. We suppress the gestures at the DOM
			// boundary so child components do not even see them.
			onContextMenu={inSimulation ? (e) => e.preventDefault() : undefined}
			onDoubleClick={inSimulation ? (e) => e.preventDefault() : undefined}
			onDragStart={inSimulation ? (e) => e.preventDefault() : undefined}
			data-simulation-tier={simulation?.tier}
			data-simulation-kind={simulation?.kind}
			data-simulation-selected={simulationSelected || undefined}
			aria-current={simulationSelected ? 'true' : undefined}
			aria-label={
				inSimulation && simulation
					? `Simulated change (${simulation.kind})${simulationSelected ? ', currently selected' : ''}`
					: undefined
			}
			key={event.id}
			$darkmode={isDarkMode}
			$selected={selectedEvent === event.id}
			$focused={focused}
			$simulation={simulation}
			$simulationSelected={simulationSelected}
			$colors={{
				r: event.colorRed ?? TypeDefaults.RGBColor.red,
				g: event.colorGreen ?? TypeDefaults.RGBColor.green,
				b: event.colorBlue ?? TypeDefaults.RGBColor.blue,
			}}
		>
			<EventContent
				height={event.springStyles.height}
				$darkmode={isDarkMode}
				$colors={{
					r: event.colorRed ?? TypeDefaults.RGBColor.red,
					g: event.colorGreen ?? TypeDefaults.RGBColor.green,
					b: event.colorBlue ?? TypeDefaults.RGBColor.blue,
				}}
				$simulation={simulation}
				onClick={() => {
					if (inSimulation) {
						// Plan §5.3.2 — simulation tiles route to the chip
						// selection handler instead of the info modal.
						onSimulatedClick?.();
						return;
					}
					setSelectedEvent(event.id);
					setSelectedEventInfo(event);
					onClick?.();
				}}
				$variant={event.isRigid ? 'block' : 'tile'}
			>
				<header>
					<h3>{event.name}</h3>
					{!isThirdPartyEvent && (
						<NoteButton
							type="button"
							className="note-button"
							data-testid={`tile-note-button-${event.id}`}
							aria-label={t('tile.noteButtonAria', 'Open notes for this tile')}
							title={t('tile.noteButtonAria', 'Open notes for this tile')}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								openNotes(event as unknown as CalendarEventType);
							}}
						>
							<StickyNote size={12} />
						</NoteButton>
					)}
					<EventLockIcon className="lock-icon" size={14} />
				</header>
				<footer>
					<div className="duration">
						<div className={`clock ${event.isTardy ? 'highlight' : ''}`}>
							<Clock size={14} style={{ minWidth: 18 }} />
							{event.isTardy && <span>Late</span>}
						</div>
						<span>
							{TimeUtil.rangeDuration(
								dayjs(event.start, 'unix'),
								dayjs(event.end, 'unix')
							)}
						</span>
					</div>
					{event.location?.address && (
						<a
							href={CalendarUtil.getEventLocationLink(event)}
							target="_blank"
							rel="noopener noreferrer"
							className="location"
						>
							<MapPin size={14} style={{ minWidth: 16 }} />
							<span>{event.location.description}</span>
						</a>
					)}
				</footer>
			</EventContent>
			{/* Plan §5.2 — simulation tier badge / marker (top-right). */}
			{simulation && simulation.tier !== 'unchanged' && (
				<SimulationBadge $tier={simulation.tier} $kind={simulation.kind}>
					{simulation.tier === 'mapped'
						? '\u25CF' /* filled circle */
						: simulation.tier === 'conflict'
							? '\u26A0' /* warning sign */
							: simulation.kind === 'new'
								? '+'
								: simulation.kind === 'removed'
									? '\u2715' /* ✕ */
									: simulation.kind === 'updated'
										? '\u270E' /* pencil */
										: ''}
				</SimulationBadge>
			)}
			{/* Border SVG for styling */}
			<svg viewBox="0 0 1 4" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
				<rect
					x="0"
					y="0"
					rx="0.08"
					ry="0.08"
					width="1"
					height="4"
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		</EventContainer>
	);
};

const dashRotate = keyframes`
  0% {
    stroke-dashoffset: 0;
  }
 100% {
    stroke-dashoffset: 12;
  }
`;

const focusPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.25);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

// Plan §5.2 — one-shot 600ms entry pulse for primary/conflict tiles.
const primaryEnterPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.55); }
  100% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
`;

// Plan §5.2.7 — continuous selection pulse, animated via `box-shadow` only
// (NOT border) so the tile bounding box does not shift (PRD #6).
const selectionPulse = keyframes`
  0%   { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.85), 0 4px 14px rgba(0, 0, 0, 0.18); }
  50%  { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.45), 0 4px 14px rgba(0, 0, 0, 0.18); }
  100% { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.85), 0 4px 14px rgba(0, 0, 0, 0.18); }
`;

// Tier accent colors. Hard-coded rgba (theme exposes only `theme.colors.text`
// reliably for now — see project notes).
const TIER_ACCENT: Record<string, string> = {
	primary: 'rgba(99, 102, 241, 0.95)', // indigo (brand accent)
	conflict: 'rgba(220, 38, 38, 0.95)', // red — warning
	cascade: 'rgba(99, 102, 241, 0.7)', // brand, slightly muted
	mapped: 'rgba(99, 102, 241, 0.7)',
	unchanged: 'transparent',
};

const EventContainer = styled(animated.div)<{
	$selected: boolean;
	$focused: boolean;
	$colors: RGB;
	$darkmode: boolean;
	$simulation?: SimulatedTileClassification;
	$simulationSelected?: boolean;
}>`
	padding: 4px;
	position: relative;
	width: 100%;
	border-radius: 12px;
	animation: ${({ $focused, $simulation, $simulationSelected }) => {
			if ($simulationSelected) return selectionPulse;
			if ($focused) return focusPulse;
			if ($simulation && ($simulation.tier === 'primary' || $simulation.tier === 'conflict'))
				return primaryEnterPulse;
			return 'none';
		}}
		${({ $simulationSelected, $focused }) => {
			if ($simulationSelected) return '2s ease-in-out infinite';
			if ($focused) return '1s ease-in-out 3';
			return '600ms ease-out 1';
		}};

	> svg {
		position: absolute;
		top: 0px;
		left: 0px;
		height: 100%;
		width: 100%;
		pointer-events: none;

		rect {
			fill: transparent;
			stroke-width: 2;
			stroke: ${({ $colors, $selected, $darkmode }) => {
				const newColor = colorUtil.setLightness($colors, $darkmode ? 0.7 : 0.3);
				return $selected
					? `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`
					: 'transparent';
			}};
			stroke-dasharray: 6, 6;
			stroke-linecap: round;
			transition: stroke 0.2s ease-in-out;
			animation: ${dashRotate} 2s linear infinite;
		}
	}
`;

const EventLockIcon = styled(LockKeyhole)`
	margin-top: 4px;
	margin-left: 4px;
	min-width: 14px;
`;

const NoteButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	margin-top: 1px;
	margin-left: 4px;
	padding: 0;
	border: none;
	border-radius: 4px;
	background: rgba(0, 0, 0, 0.04);
	color: inherit;
	cursor: pointer;
	opacity: 0;
	transform: translateY(-1px);
	transition:
		opacity 0.12s ease,
		background-color 0.12s ease;
	flex: 0 0 auto;

	&:hover {
		background: rgba(0, 0, 0, 0.12);
	}

	&:focus-visible {
		opacity: 1;
		outline: 2px solid rgba(99, 102, 241, 0.6);
		outline-offset: 1px;
	}
`;

const EventContent = styled.div<{
	$colors: RGB;
	$darkmode: boolean;
	height: number;
	$variant: 'block' | 'tile';
	$simulation?: SimulatedTileClassification;
}>`
	position: relative;
	background-color: ${({ $colors, $darkmode }) => {
		const newColor = colorUtil.setLightness($colors, $darkmode ? 0.325 : 0.9);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	color: ${({ $colors, $darkmode }) => {
		const newColor = colorUtil.setLightness($colors, $darkmode ? 0.85 : 0.3);
		return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
	}};
	border: ${({ $variant }) => ($variant === 'block' ? 1.5 : 1)}px solid
		${({ $colors, $variant, $darkmode }) => {
			const blockColor = colorUtil.setLightness($colors, $darkmode ? 0.6 : 0.5);
			const tileColor = colorUtil.setLightness($colors, $darkmode ? 0.1 : 0.8);
			return $variant === 'block'
				? `rgb(${blockColor.r}, ${blockColor.g}, ${blockColor.b})`
				: `rgb(${tileColor.r}, ${tileColor.g}, ${tileColor.b})`;
		}};
	height: 100%;
	padding: 7px 8px;
	border-radius: 10px;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;

	/* Plan §5.2 — simulation tier accents.
	 * Implemented entirely with inset box-shadow so the bounding box never
	 * shifts (PRD #6). The conflict tier draws an extra red left stripe via
	 * a layered shadow. The mapped/cascade tiers draw a thin left stripe
	 * only and skip the border. */
	${({ $simulation }) => {
		if (!$simulation || $simulation.tier === 'unchanged') return '';
		const accent = TIER_ACCENT[$simulation.tier];
		switch ($simulation.tier) {
			case 'primary':
				return `box-shadow: inset 0 0 0 2px ${accent};`;
			case 'conflict':
				return `box-shadow: inset 4px 0 0 ${TIER_ACCENT.conflict}, inset 0 0 0 2px ${TIER_ACCENT.primary};`;
			case 'cascade':
			case 'mapped':
				return `box-shadow: inset 3px 0 0 ${accent};`;
			default:
				return '';
		}
	}}

	header {
		display: flex;
		align-items: start;

		h3 {
			flex: 1;
			display: -webkit-box;
			line-height: 16px;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: ${({ height }) => Math.floor((height - 46) / 16)};
			max-height: calc(${({ height }) => height}px - 46px);
			text-overflow: ellipsis;
			overflow: hidden;
			font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
			font-size: 13px;
		}

		${EventLockIcon} {
			display: ${({ $variant }) => ($variant === 'block' ? 'block' : 'none')};
		}
	}

	&:hover .note-button,
	&:focus-within .note-button {
		opacity: 1;
	}

	footer {
		display: flex;
		gap: 0.25ch;
		overflow: hidden;
	}

	.duration,
	.location {
		display: flex;
		align-items: center;
		font-size: ${({ theme }) => theme.typography.fontSize.xs};
		font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
		white-space: nowrap;

		color: ${({ $colors, $darkmode }) => {
			const newColor = colorUtil.setLightness($colors, $darkmode ? 0.7 : 0.4);
			return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
		}};
	}

	.duration {
		.clock {
			height: 18px;
			display: flex;
			gap: 0.5ch;
			align-items: center;
			border-radius: 6px;
			font-size: 11px;
		}

		.clock.highlight {
			padding-inline: 4px;
			margin-right: 0.5ch;
			color: ${({ $colors, $darkmode }) => {
				const newColor = colorUtil.setLightness($colors, $darkmode ? 0.2 : 0.7);
				return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
			}};
			background-color: ${({ $colors, $darkmode }) => {
				const newColor = colorUtil.setLightness($colors, $darkmode ? 0.7 : 0.3);
				return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
			}};
		}
	}

	.location {
		padding-inline: 2px;
		min-width: 0;
		&:hover {
			background-color: ${({ $colors, $darkmode }) => {
				const newColor = colorUtil.setLightness($colors, $darkmode ? 0.2 : 0.75);
				return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
			}};
		}

		border-radius: ${({ theme }) => theme.borderRadius.little};
		transition: background-color 0.2s ease;

		span {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
`;

export default CalendarEvent;

// Plan §5.2 — small badge in the top-right of a simulation tile. Pseudo-glyph
// content is set inline by the renderer; this only handles positioning and
// color theming for each tier.
const SimulationBadge = styled.div<{
	$tier: SimulatedTileClassification['tier'];
	$kind: SimulatedTileClassification['kind'];
}>`
	position: absolute;
	top: 2px;
	right: 2px;
	width: 16px;
	height: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
	line-height: 1;
	border-radius: 50%;
	pointer-events: none;
	color: #ffffff;
	background-color: ${({ $tier, $kind }) => {
		if ($tier === 'conflict') return TIER_ACCENT.conflict;
		if ($tier === 'mapped') return TIER_ACCENT.mapped;
		if ($kind === 'removed') return 'rgba(120, 120, 120, 0.95)';
		return TIER_ACCENT.primary;
	}};
`;
