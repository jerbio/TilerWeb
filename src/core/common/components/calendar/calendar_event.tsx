import React from 'react';
import dayjs from 'dayjs';
import { animated } from '@react-spring/web';
import { Clock, LockKeyhole, MapPin } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import TimeUtil from '@/core/util/time';
import palette from '@/core/theme/palette';
import CalendarUtil from '@/core/util/calendar';
import colorUtil, { RGB } from '@/core/util/colors';
import { StyledEvent } from './calendar_events';

type CalendarEventProps = {
  event: StyledEvent;
  selectedEvent: string | null;
  setSelectedEvent: (eventId: string | null) => void;
	setSelectedEventInfo: React.Dispatch<React.SetStateAction<StyledEvent | null>>;
  onClick?: () => void;
};

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  selectedEvent,
  setSelectedEvent,
	setSelectedEventInfo,
  onClick,
}) => {
  return (
    <EventContainer
      key={event.id}
      $selected={selectedEvent === event.id}
      $colors={{ r: event.colorRed, g: event.colorGreen, b: event.colorBlue }}
    >
      <EventContent
        height={event.springStyles.height}
        $colors={{
          r: event.colorRed,
          g: event.colorGreen,
          b: event.colorBlue,
        }}
        onClick={() => {
          setSelectedEvent(event.id);
					setSelectedEventInfo(event);
          onClick?.();
        }}
        variant={event.isRigid ? 'block' : 'tile'}
      >
        <header>
          <h3>{event.name}</h3>
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

const EventContainer = styled(animated.div) <{
  $selected: boolean;
  $colors: RGB;
}>`
	padding: 4px;
	position: relative;
	width: 100%;

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
			stroke: ${({ $colors, $selected }) => {
    const newColor = colorUtil.setLightness($colors, 0.7);
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

const EventContent = styled.div<{
  $colors: RGB;
  height: number;
  variant: 'block' | 'tile';
}>`
	position: relative;
	background-color: ${({ $colors }) => {
    const newColor = colorUtil.setLightness($colors, 0.325);
    return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
  }};
	color: ${({ $colors }) => {
    const newColor = colorUtil.setLightness($colors, 0.85);
    return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
  }};
	border: 1px solid
		${({ $colors, variant }) => {
    const blockColor = colorUtil.setLightness($colors, 0.6);
    const tileColor = colorUtil.setLightness($colors, 0.1);
    return variant === 'block'
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
			font-weight: ${palette.typography.fontWeight.medium};
			font-size: 13px;
		}

		${EventLockIcon} {
			display: ${({ variant }) => (variant === 'block' ? 'block' : 'none')};
		}
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
		font-size: ${palette.typography.fontSize.xs};
		font-weight: ${palette.typography.fontWeight.semibold};
		white-space: nowrap;

		color: ${({ $colors: colors }) => {
    const newColor = colorUtil.setLightness(colors, 0.7);
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
			color: ${({ $colors: colors }) => {
    const newColor = colorUtil.setLightness(colors, 0.2);
    return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
  }};
			background-color: ${({ $colors: colors }) => {
    const newColor = colorUtil.setLightness(colors, 0.7);
    return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
  }};
		}
	}

	.location {
		padding-inline: 2px;
		min-width: 0;
		&:hover {
			background-color: ${({ $colors: colors }) => {
    const newColor = colorUtil.setLightness(colors, 0.2);
    return `rgb(${newColor.r}, ${newColor.g}, ${newColor.b})`;
  }};
		}

		border-radius: ${palette.borderRadius.little};
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
