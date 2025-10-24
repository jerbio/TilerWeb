import React from 'react';
import { ScheduleSubCalendarEvent } from '../../types/schedule';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { MapPin, X } from 'lucide-react';
import { RGB } from '@/core/util/colors';
import dayjs from 'dayjs';
import CalendarUtil from '@/core/util/calendar';

type CalendarEventInfoProps = {
  event: ScheduleSubCalendarEvent | null;
  onClose?: () => void;
};

const CalendarEventInfo: React.FC<CalendarEventInfoProps> = ({ event, onClose }) => {
  function getEventTimeDescription(event: ScheduleSubCalendarEvent) {
    // Date, timeA - timeB or Date, timeA - Date, timeB if spans multiple days
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);

    const sameDay = startDate.isSame(endDate, 'day');
    if (sameDay) {
      return `${startDate.format('MMM D, YYYY')}, ${startDate.format('h:mm A')} - ${endDate.format('h:mm A')}`;
    } else {
      return `${startDate.format('MMM D, YYYY')}, ${startDate.format('h:mm A')} - ${endDate.format('MMM D, YYYY')}, ${endDate.format('h:mm A')}`;
    }
  }

  return event ? (
    <StyledCalendarEventInfo>
      <div className="actions">
        <button onClick={onClose}>
          <X size={16} color={palette.colors.gray[300]} />
        </button>
      </div>
      <header>
        <CalendarEventColorMarker
          rgb={{ r: event.colorRed, g: event.colorGreen, b: event.colorBlue }}
        />
        <div>
          <h3>{event.name}</h3>
          <p>{getEventTimeDescription(event)}</p>
        </div>
      </header>
      {event.location.address && (
        <CalendarEventLocation>
          <a
            href={CalendarUtil.getEventLocationLink(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="location"
          >
            <MapPin size={14} style={{ minWidth: 16 }} />
            <span>{event.location.address}</span>
          </a>
        </CalendarEventLocation>
      )}
    </StyledCalendarEventInfo>
  ) : null;
};

const CalendarEventLocation = styled.div`
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[400]};


	a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		font-weight: ${palette.typography.fontWeight.medium};

		&:hover {
			text-decoration: underline;
		}
	}
}
`;

const CalendarEventColorMarker = styled.div<{ rgb: RGB }>`
	width: 12px;
	height: 12px;
	border-radius: ${palette.borderRadius.small};
	background-color: ${(props) => `rgb(${props.rgb.r}, ${props.rgb.g}, ${props.rgb.b})`};
`;

const StyledCalendarEventInfo = styled.div`
	padding: 0.75rem;
	background-color: ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.xLarge};
	width: 100%;
height: fit-content;

	header {
		display: flex;
		align-items: top;
		gap: .75rem;
		margin-bottom: 0.75rem;

		h3 {
			margin-top: -.5rem;
			font-size: ${palette.typography.fontSize.base};
			font-family: ${palette.typography.fontFamily.urban};
			font-weight: ${palette.typography.fontWeight.semibold};
			color: ${palette.colors.gray[100]};
		}

		p {
			font-size: ${palette.typography.fontSize.xs};
			color: ${palette.colors.gray[300]};
}
	}
}

	.actions {
		display: flex;
		justify-content: flex-end;

		button {
			height: 32px;
			width: 32px;
			border-radius: ${palette.borderRadius.xxLarge};
			display: flex;
			justify-content: center;
			align-items: center;

			&:hover {
				background-color: ${palette.colors.gray[700]};
			}
		}
	}
`;

export default CalendarEventInfo;
