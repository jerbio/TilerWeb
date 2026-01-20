import React from 'react';
import { ScheduleSubCalendarEvent } from '../../types/schedule';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import {
  Calendar,
  CalendarArrowDown,
  CalendarArrowUp,
  Clock,
  ExternalLink,
  PencilLine,
  Repeat2,
  Star,
  Trash,
  X,
} from 'lucide-react';
import { RGBColor } from '@/core/util/colors';
import dayjs from 'dayjs';
import TimeUtil from '@/core/util/time';
import calendarConfig from '@/core/constants/calendar_config';
import { useTranslation } from 'react-i18next';
import Button from '../button';
import LocationBG from '@/assets/event/location-bg.png';

type CalendarEventInfoProps = {
  event: ScheduleSubCalendarEvent | null;
  onClose?: () => void;
};

const CalendarEventInfo: React.FC<CalendarEventInfoProps> = ({ event, onClose }) => {
  function getEventDueIn(event: ScheduleSubCalendarEvent) {
    const now = dayjs();
    const eventStart = dayjs(event.start);
    const diffInHours = eventStart.diff(now, 'hour');
    if (diffInHours < 1) {
      const diffInMinutes = eventStart.diff(now, 'minute');
      return `${diffInMinutes} minutes`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const diffInDays = eventStart.diff(now, 'day');
      return `${diffInDays} days`;
    }
  }

  const eventColor = new RGBColor({
    r: event ? event.colorRed : 128,
    g: event ? event.colorGreen : 128,
    b: event ? event.colorBlue : 128,
  });

  const { t } = useTranslation();

  return event ? (
    <StyledCalendarEventInfo $color={eventColor}>
      <CalendarEventInfoHeader>
        <div className="icon">
          <Star size={16} color={eventColor.setLightness(0.6).toHex()} />
        </div>
        <div className="title">
          <h2>{event.name}</h2>
          {dayjs().isBefore(dayjs(event.start)) ? (
            <span>{t('calendar.event.dueIn', { time: getEventDueIn(event) })}</span>
          ) : null}
        </div>
        <button onClick={onClose}>
          <X size={16} color={eventColor.setLightness(0.5).toHex()} />
        </button>
      </CalendarEventInfoHeader>
      <CalendarEventInfoSection>
        <CalendarEventInfoArticleContainer>
          <CalendarEventInfoArticle>
            <Calendar
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.dateLabel')}</h3>
              <p>{dayjs(event.start).format('ddd, D MMMM, YYYY')}</p>
            </div>
          </CalendarEventInfoArticle>
          <CalendarEventInfoArticle>
            <CalendarArrowUp
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.startLabel')}</h3>
              <p>{dayjs(event.start).format('hh:mm A')}</p>
            </div>
          </CalendarEventInfoArticle>
          <CalendarEventInfoArticle>
            <CalendarArrowDown
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.endLabel')}</h3>
              <p>{dayjs(event.end).format('hh:mm A')}</p>
            </div>
          </CalendarEventInfoArticle>
          <CalendarEventInfoArticle>
            <Clock
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.durationLabel')}</h3>
              <p>
                {TimeUtil.rangeDuration(
                  dayjs(event.start, 'unix'),
                  dayjs(event.end, 'unix')
                )}
              </p>
            </div>
          </CalendarEventInfoArticle>
          <CalendarEventInfoArticle>
            <Repeat2
              size={16}
              color={eventColor.setLightness(0.6).toHex()}
              style={{ minWidth: 16, marginTop: '0.25rem' }}
            />
            <div>
              <h3>{t('calendar.event.repetitionLabel')}</h3>
              <p>{event.isRecurring ? 'Yes' : 'No'}</p>
            </div>
          </CalendarEventInfoArticle>
        </CalendarEventInfoArticleContainer>
      </CalendarEventInfoSection>
      <hr />
      <CalendarEventInfoActions>
        <h3>{t('calendar.event.secondaryActionsLabel')}</h3>
        <CalendarEventInfoActionItems>
          <CalendarEventInfoActionButton size="medium" variant={'ghost'}>
            {t('calendar.event.secondaryActions.editLabel')}
            <PencilLine size={16} />
          </CalendarEventInfoActionButton>
          <CalendarEventInfoActionButton size="medium" variant={'ghost'}>
            {t('calendar.event.secondaryActions.deleteLabel')}
            <Trash size={16} />
          </CalendarEventInfoActionButton>
        </CalendarEventInfoActionItems>
      </CalendarEventInfoActions>
      {event.location.address && (
        <>
          <hr />
          <CalendarEventInfoSection>
            <a href={event.location.address}>
              <CalendarEventInfoLocation $color={eventColor}>
                <img src={LocationBG} alt="" width={16} />
                <div>
                  <h3>{t('calendar.event.locationLabel')}</h3>
                  <ExternalLink size={16} />
                </div>
              </CalendarEventInfoLocation>
            </a>
          </CalendarEventInfoSection>
        </>
      )}
    </StyledCalendarEventInfo>
  ) : null;
};

const CalendarEventInfoHeader = styled.header`
	position: sticky;
	top: 0;
`;

const CalendarEventInfoActions = styled.div`
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	h3 {
		font-size: ${palette.typography.fontSize.sm};
		font-family: ${palette.typography.fontFamily.urban};
		font-weight: ${palette.typography.fontWeight.bold};
		color: ${palette.colors.gray[400]};
		leading: 1;
	}
`;

const CalendarEventInfoActionItems = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const CalendarEventInfoActionButton = styled(Button)`
	flex: 1;
	border: 1px solid ${palette.colors.gray[700]};
`;

const CalendarEventInfoLocation = styled.div<{ $color: RGBColor }>`
	position: relative;
	height: 100px;
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: ${palette.borderRadius.large};
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
			color: ${(props) => props.$color.setLightness(0.5).toHex()};
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
		border-radius: ${palette.borderRadius.large};
		padding: 0.5rem;
		transition: transform 0.3s ease;

		h3 {
			white-space: nowrap;
			font-size: ${palette.typography.fontSize.sm};
			font-family: ${palette.typography.fontFamily.urban};
			font-weight: ${palette.typography.fontWeight.bold};
			color: ${palette.colors.white};
			leading: 1;
		}
	}
`;

const CalendarEventInfoSection = styled.div`
	padding: 16px;
`;

const CalendarEventInfoArticleContainer = styled.div`
	padding: 0.5rem;
	display: grid;
	gap: 0.5rem;
	grid-template-columns: 1fr 1fr;
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.gray[700]};

	& > :first-child {
		grid-column: 1 / 3;
	}
`;

const CalendarEventInfoArticle = styled.article`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;

	div {
		display: flex;
		gap: 0.1rem;
		flex-direction: column;

		h3 {
			font-size: ${palette.typography.fontSize.sm};
			font-family: ${palette.typography.fontFamily.urban};
			font-weight: ${palette.typography.fontWeight.bold};
			color: ${palette.colors.gray[400]};
			leading: 1;
		}

		p {
			font-size: ${palette.typography.fontSize.sm};
			font-family: ${palette.typography.fontFamily.urban};
			font-weight: ${palette.typography.fontWeight.bold};
			color: ${palette.colors.gray[300]};

			a {
				color: ${palette.colors.gray[300]};
				text-decoration: none;
				span {
					display: flex;
					align-items: center;
					gap: 0.25rem;
				}

				&:hover {
					text-decoration: underline;
				}
			}
		}
	}
`;

const StyledCalendarEventInfo = styled.div<{ $color: RGBColor }>`
	background-color: ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.xLarge};
	width: 100%;
max-height: ${calendarConfig.INFO_MODAL_HEIGHT};
overflow-y: auto;

hr {
	border: none;
	height: 1px;
	background-color: ${palette.colors.gray[700]};
}


	header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
gap: .5rem;
		background-color: ${(props) => props.$color.setLightness(0.2).toHex()};
		padding: 8px 16px;
	border-radius: ${palette.borderRadius.xLarge} ${palette.borderRadius.xLarge} 0 0;

		.icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 32px;
			height: 32px;
border: 1px solid ${(props) => props.$color.setLightness(0.3).toHex()};
			border-radius: ${palette.borderRadius.medium};
		}
}

.title {
		flex: 1;
			overflow: hidden;
h2 {
white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: ${palette.typography.fontSize.lg};
			font-family: ${palette.typography.fontFamily.urban};
			font-weight: ${palette.typography.fontWeight.bold};
color: ${(props) => props.$color.setLightness(0.8).toHex()};
line-height: 1.1;
}
			span {
				font-size: ${palette.typography.fontSize.xs};
font-weight: ${palette.typography.fontWeight.medium};
color: ${(props) => props.$color.setLightness(0.6).toHex()};
			}
}

		> button {
			height: 28px;
			width: 28px;
border: 1px solid ${(props) => props.$color.setLightness(0.3).toHex()};
			border-radius: ${palette.borderRadius.medium};
			display: flex;
			justify-content: center;
			align-items: center;
transition: background-color 0.2s;

			&:hover {
background-color: ${(props) => props.$color.setLightness(0.3).toHex()};
			}
		}
	}

	.event-header {
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

`;

export default CalendarEventInfo;
