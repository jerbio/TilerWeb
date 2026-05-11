import React, { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import {
	CalendarArrowDown,
	CalendarArrowUp,
	Clock,
	ExternalLink,
	Eye,
	Repeat2,
	Star,
	Target,
	X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubCalendarEvent } from '../../types/schedule';
import { RGBColor } from '@/core/util/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import TimeUtil from '@/core/util/time';
import { formatDueIn } from '@/core/util/eventTimeConversion';
import calendarConfig from '@/core/constants/calendar_config';
import LocationBG from '@/assets/event/location-bg.png';
import CyclingEmoji from './cycling_emoji';
import { TypeDefaults } from '../../types/typeDefaults';

/**
 * Read-only popout used during tilecast review.
 *
 * The standard `CalendarEventInfo` exposes inline editing, complete/now/defer
 * actions, and "More options" — none of which make sense while the user is
 * inspecting an ephemeral simulation overlay. This component renders the same
 * tile metadata in a stripped-down, non-interactive layout and clearly labels
 * the panel as a preview.
 */
type SimulatedCalendarEventInfoProps = {
	event: SubCalendarEvent | null;
	onClose?: () => void;
	maxHeight?: number;
};

const SimulatedCalendarEventInfo: React.FC<SimulatedCalendarEventInfoProps> = ({
	event,
	onClose,
	maxHeight,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();

	// Use original times (preserved before visual splitting) or fall back to start/end
	const eventStart = event?.originalStart ?? event?.start ?? 0;
	const eventEnd = event?.originalEnd ?? event?.end ?? 0;

	// Close on Escape
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	useEffect(() => {
		if (!event) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopImmediatePropagation();
				onCloseRef.current?.();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [event]);

	if (!event) return null;

	const eventColor = new RGBColor({
		r: event.colorRed ?? TypeDefaults.RGBColor.red,
		g: event.colorGreen ?? TypeDefaults.RGBColor.green,
		b: event.colorBlue ?? TypeDefaults.RGBColor.blue,
	});

	return (
		<StyledSimulatedCalendarEventInfo
			$color={eventColor}
			$darkmode={isDarkMode}
			style={maxHeight ? { maxHeight } : undefined}
			data-testid="simulated-calendar-event-info"
		>
			<header>
				<div className="icon">
					{event.emojis ? (
						<CyclingEmoji emojis={event.emojis} />
					) : (
						<Star size={16} color={eventColor.setLightness(0.6).toHex()} />
					)}
				</div>
				<div className="title">
					<h2>{event.name}</h2>
					{dayjs().isBefore(dayjs(eventStart)) ? (
						<span>{t('calendar.event.dueIn', { time: formatDueIn(eventStart) })}</span>
					) : null}
				</div>
				<PreviewBadge $color={eventColor} $darkmode={isDarkMode}>
					<Eye size={12} />
					<span>{t('calendar.event.previewBadge', 'Preview')}</span>
				</PreviewBadge>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onClose?.();
					}}
					aria-label="Close"
				>
					<X size={16} color={eventColor.setLightness(0.5).toHex()} />
				</button>
			</header>

			<ScrollableBody>
				<PreviewHint>
					{t(
						'calendar.event.previewHint',
						'This is a simulated preview — changes will only apply if you accept.'
					)}
				</PreviewHint>
				<Section>
					<ArticleContainer>
						<Article>
							<CalendarArrowUp
								size={16}
								color={eventColor.setLightness(0.6).toHex()}
								style={{ minWidth: 16, marginTop: '0.25rem' }}
							/>
							<div>
								<h3>{t('calendar.event.startLabel')}</h3>
								<p>
									{dayjs(eventStart).format('h:mm A')} ·{' '}
									{dayjs(eventStart).format('D MMM')}
								</p>
							</div>
						</Article>

						<Article>
							<CalendarArrowDown
								size={16}
								color={eventColor.setLightness(0.6).toHex()}
								style={{ minWidth: 16, marginTop: '0.25rem' }}
							/>
							<div>
								<h3>{t('calendar.event.endLabel')}</h3>
								<p>
									{dayjs(eventEnd).format('h:mm A')} ·{' '}
									{dayjs(eventEnd).format('D MMM')}
								</p>
							</div>
						</Article>

						{event.calendarEventEnd != null && (
							<Article style={{ gridColumn: '1 / 3' }}>
								<Target
									size={16}
									color={eventColor.setLightness(0.6).toHex()}
									style={{ minWidth: 16, marginTop: '0.25rem' }}
								/>
								<div>
									<h3>{t('calendar.event.deadlineLabel')}</h3>
									<p>
										{dayjs(event.calendarEventEnd).format('ddd, D MMMM, YYYY')}
									</p>
								</div>
							</Article>
						)}

						<Article>
							<Clock
								size={16}
								color={eventColor.setLightness(0.6).toHex()}
								style={{ minWidth: 16, marginTop: '0.25rem' }}
							/>
							<div>
								<h3>{t('calendar.event.durationLabel')}</h3>
								<p>{TimeUtil.rangeDuration(dayjs(eventStart), dayjs(eventEnd))}</p>
							</div>
						</Article>

						<Article>
							<Repeat2
								size={16}
								color={eventColor.setLightness(0.6).toHex()}
								style={{ minWidth: 16, marginTop: '0.25rem' }}
							/>
							<div>
								<h3>{t('calendar.event.repetitionLabel')}</h3>
								<p>{event.isRecurring ? 'Yes' : 'No'}</p>
							</div>
						</Article>
					</ArticleContainer>
				</Section>

				{event.location && event.location.address && (
					<>
						<hr />
						<Section>
							<a
								href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
									event.location.address
								)}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<LocationCard $color={eventColor}>
									<img src={LocationBG} alt="" width={16} />
									<div>
										<h3>{t('calendar.event.locationLabel')}</h3>
										<ExternalLink size={16} />
									</div>
								</LocationCard>
							</a>
						</Section>
					</>
				)}
			</ScrollableBody>
		</StyledSimulatedCalendarEventInfo>
	);
};

const ScrollableBody = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	scrollbar-color: ${({ theme }) => theme.colors.gray[400]} transparent;
`;

const PreviewBadge = styled.div<{ $color: RGBColor; $darkmode: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 8px;
	border-radius: 999px;
	flex-shrink: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	background-color: ${({ $color, $darkmode }) =>
		$color.setLightness($darkmode ? 0.3 : 0.85).toHex()};
	color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.9 : 0.25).toHex()};
	border: 1px solid
		${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.4 : 0.7).toHex()};
`;

const PreviewHint = styled.p`
	margin: 0;
	padding: 8px 16px 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.muted};
	font-style: italic;
`;

const Section = styled.div`
	padding: 16px;
`;

const ArticleContainer = styled.div`
	padding: 0.5rem;
	display: grid;
	gap: 0.5rem;
	grid-template-columns: 1fr 1fr;
	align-items: start;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	border: 1px solid ${({ theme }) => theme.colors.calendar.border};
`;

const Article = styled.article`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;

	> div {
		display: flex;
		gap: 0.1rem;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;

		h3 {
			font-size: ${({ theme }) => theme.typography.fontSize.sm};
			font-family: ${({ theme }) => theme.typography.fontFamily.urban};
			font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
			color: ${({ theme }) => theme.colors.text.muted};
			leading: 1;
		}

		p {
			font-size: ${({ theme }) => theme.typography.fontSize.sm};
			font-family: ${({ theme }) => theme.typography.fontFamily.urban};
			font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
			color: ${({ theme }) => theme.colors.text.secondary};
		}
	}
`;

const LocationCard = styled.div<{ $color: RGBColor }>`
	position: relative;
	height: 100px;
	border: 1px solid ${({ theme }) => theme.colors.calendar.border};
	border-radius: ${({ theme }) => theme.borderRadius.large};
	isolation: isolate;
	overflow: hidden;
	cursor: pointer;

	img {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
		top: 0;
		left: 0;
		z-index: -1;
	}

	&:hover div {
		transform: translate(-50%, -60%);

		h3 {
			color: ${(props) => props.$color.setLightness(0.8).toHex()};
		}
	}

	div {
		background-color: rgba(0, 0, 0, 0.5);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: ${({ theme }) => theme.borderRadius.large};
		padding: 0.5rem;
		transition: transform 0.3s ease;

		h3 {
			white-space: nowrap;
			font-size: ${({ theme }) => theme.typography.fontSize.sm};
			font-family: ${({ theme }) => theme.typography.fontFamily.urban};
			font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
			color: ${({ theme }) => theme.colors.white};
			leading: 1;
		}
	}
`;

const StyledSimulatedCalendarEventInfo = styled.div<{ $color: RGBColor; $darkmode: boolean }>`
	position: relative;
	display: flex;
	flex-direction: column;
	max-height: ${calendarConfig.INFO_MODAL_HEIGHT};
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.calendar.eventInfoModalBg};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	width: 100%;
	border: 1px solid
		${({ theme, $darkmode }) => (!$darkmode ? theme.colors.gray[300] : 'transparent')};

	hr {
		border: none;
		height: 1px;
		background-color: ${({ theme }) => theme.colors.calendar.border};
	}

	header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		background-color: ${({ $color, $darkmode }) =>
			$color.setLightness($darkmode ? 0.2 : 0.9).toHex()};
		padding: 8px 16px;
		border-radius: ${({ theme }) => theme.borderRadius.xLarge}
			${({ theme }) => theme.borderRadius.xLarge} 0 0;
		flex-shrink: 0;

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 32px;
			height: 32px;
			flex-shrink: 0;
			overflow: hidden;
			background-color: ${({ $color, $darkmode }) =>
				$color.setLightness($darkmode ? 0.2 : 1).toHex()};
			border: 1px solid
				${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
			border-radius: ${({ theme }) => theme.borderRadius.medium};

			.emoji {
				font-size: 18px;
				line-height: 1;
			}
		}

		> button {
			height: 28px;
			width: 28px;
			border: 1px solid
				${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			display: flex;
			justify-content: center;
			align-items: center;
			transition: background-color 0.2s;
			flex-shrink: 0;

			&:hover {
				background-color: ${({ $color, $darkmode }) =>
					$color.setLightness($darkmode ? 0.3 : 0.8).toHex()};
			}
		}
	}

	.title {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;

		h2 {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: ${({ theme }) => theme.typography.fontSize.lg};
			font-family: ${({ theme }) => theme.typography.fontFamily.urban};
			font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
			color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.8 : 0.2).toHex()};
		}
		span {
			font-size: ${({ theme }) => theme.typography.fontSize.xs};
			font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
			color: ${({ $color, $darkmode }) => $color.setLightness($darkmode ? 0.6 : 0.4).toHex()};
		}
	}
`;

export default SimulatedCalendarEventInfo;
