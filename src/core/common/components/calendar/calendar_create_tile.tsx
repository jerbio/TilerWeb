import useFormHandler from '@/hooks/useFormHandler';
import { Calendar, ChevronDown, ChevronUp, Keyboard, X } from 'lucide-react';
import styled, { useTheme } from 'styled-components';
import dayjs from 'dayjs';
import Button from '../button';
import Collapse from '../collapse';
import { RGB, RGBColor } from '@/core/util/colors';
import Toggle from '../toggle';
import React, { useMemo, useState } from 'react';
import AutosizeInput from '../auto-size-input';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Trans, useTranslation } from 'react-i18next';
import LoadingModal from '../modals/loading-modal';
import SuccessModal from '../modals/success-modal';
import { scheduleService } from '@/services';
import { ScheduleCreateEventParams } from '../../types/schedule';
import { toast } from 'sonner';
import { TILE_RECURRENCE_TYPE, TILE_TIME_RESTRICTION_TYPE } from '../../types/calendar';
import DatePicker from '../date_picker';

dayjs.extend(advancedFormat);

export type InitialCreateTileFormState = {
  action: string;
  location: string;
  durationHours: number;
  durationMins: number;
  deadline: dayjs.Dayjs;
  color: RGBColor;
  isRecurring: boolean;
  recurrenceCount: number;
  recurrenceType: TILE_RECURRENCE_TYPE;
  isTimeRestricted: boolean;
  timeRestrictionType: TILE_TIME_RESTRICTION_TYPE;
  timeRestrictionStart: string;
  timeRestrictionEnd: string;
  hasLocationNickname: boolean;
  locationNickname: string;
};

type CalendarCreateTileProps = {
  onClose: () => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
  tileColorOptions: RGB[];
};

const CalendarCreateTile: React.FC<CalendarCreateTileProps> = ({
  onClose,
  expanded,
  tileColorOptions,
  formHandler,
}) => {
  const { formData, handleFormInputChange, resetForm } = formHandler;
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEventName, setSuccessEventName] = useState('');
  const isValidSubmission = useMemo(() => {
    if (formData.action.trim().length === 0) return false;
    if (formData.location.trim().length === 0) return false;
    const duration = formData.durationHours * 60 + formData.durationMins;
    if (duration === 0) return false;
    if (formData.deadline.isBefore(dayjs(), 'day')) return false;
    return true;
  }, [formData]);

  const collapseItems = [
    {
      title: t('calendar.createTile.sections.tileColor'),
      content: (
        <TileColorOptions>
          {tileColorOptions.map((color) => {
            const optionRGBColor = new RGBColor(color);
            return (
              <TileColorOption
                key={optionRGBColor.toHex()}
                $color={optionRGBColor}
                $selected={optionRGBColor.equals(formData.color)}
                onClick={() =>
                  handleFormInputChange('color', { mode: 'static' })(color)
                }
              ></TileColorOption>
            );
          })}
        </TileColorOptions>
      ),
    },
    {
      title: t('calendar.createTile.sections.tileActions'),
      content: (
        <>
          <TileActionToggleContainer>
            <div>
              <h3>{t('calendar.createTile.actions.repeatTile')}</h3>
              <Toggle
                checked={formData.isRecurring}
                onChange={handleFormInputChange('isRecurring', { mode: 'static' })}
              />
            </div>
            {formData.isRecurring && (
              <TileActionContainer>
                <DescriptionContainer>
                  <Trans
                    i18nKey="calendar.createTile.recurrence.description"
                    components={{
                      repetition: (
                        <DescriptionInput
                          value={formData.recurrenceCount}
                          onChange={handleFormInputChange(
                            'recurrenceCount',
                            {
                              restriction: 'integer',
                            }
                          )}
                          minWidth={50}
                          maxWidth={50}
                          type="number"
                        />
                      ),
                      period: (
                        <DescriptionSelect
                          value={formData.recurrenceType}
                          onChange={handleFormInputChange(
                            'recurrenceType'
                          )}
                        >
                          <option value={TILE_RECURRENCE_TYPE.DAILY}>
                            {t(
                              'calendar.createTile.recurrence.periods.daily'
                            )}
                          </option>
                          <option value={TILE_RECURRENCE_TYPE.WEEKLY}>
                            {t(
                              'calendar.createTile.recurrence.periods.weekly'
                            )}
                          </option>
                          <option value={TILE_RECURRENCE_TYPE.MONTHLY}>
                            {t(
                              'calendar.createTile.recurrence.periods.monthly'
                            )}
                          </option>
                          <option value={TILE_RECURRENCE_TYPE.YEARLY}>
                            {t(
                              'calendar.createTile.recurrence.periods.yearly'
                            )}
                          </option>
                        </DescriptionSelect>
                      ),
                    }}
                  />
                </DescriptionContainer>
                <Seperator />
              </TileActionContainer>
            )}
            <div>
              <h3>{t('calendar.createTile.actions.addTimeRestriction')}</h3>
              <Toggle
                checked={formData.isTimeRestricted}
                onChange={handleFormInputChange('isTimeRestricted', {
                  mode: 'static',
                })}
              />
            </div>
            {formData.isTimeRestricted && (
              <TileActionContainer>
                <Seperator />
              </TileActionContainer>
            )}
            <div>
              <h3>{t('calendar.createTile.actions.addLocationNickname')}</h3>
              <Toggle
                checked={formData.hasLocationNickname}
                onChange={handleFormInputChange('hasLocationNickname', {
                  mode: 'static',
                })}
              />
            </div>
            {formData.hasLocationNickname && (
              <TileActionContainer>
                <DescriptionContainer>
                  <DescriptionInput
                    value={formData.locationNickname}
                    onChange={handleFormInputChange('locationNickname')}
                    minWidth={50}
                    maxWidth={250}
                  />
                </DescriptionContainer>
                <Seperator />
              </TileActionContainer>
            )}
          </TileActionToggleContainer>
        </>
      ),
    },
  ];

  async function submitForm() {
    setLoading(true);
    try {
      const event: ScheduleCreateEventParams = {
        Name: formData.action,
        RColor: formData.color.r.toString(),
        GColor: formData.color.g.toString(),
        BColor: formData.color.b.toString(),
        LocationAddress: formData.location,
        DurationDays: '0',
        DurationHours: formData.durationHours.toString(),
        DurationMinute: formData.durationMins.toString(),
        EndYear: dayjs(formData.deadline).format('YYYY'),
        EndMonth: dayjs(formData.deadline).format('MM'),
        EndDay: dayjs(formData.deadline).format('DD'),
        EndHour: '23',
        EndMinute: '59',
        isRestricted: 'false',
        MobileApp: true,
      };
      const newEvent = await scheduleService.createEvent(event);
      onClose();
      setSuccessEventName(newEvent.name);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StyledCalendarCreateEvent $isexpanded={expanded}>
      <LoadingModal show={loading} setShow={setLoading}>
        <p>{t('calendar.createTile.message.pending', { action: formData.action })}</p>
      </LoadingModal>
      <SuccessModal show={success} setShow={setSuccess}>
        <p>
          <Trans
            i18nKey="calendar.createTile.message.success"
            components={{
              b: <b />,
              action: <>{successEventName}</>,
            }}
          />
        </p>
      </SuccessModal>
      <header>
        <div className="title">
          <h2>{t('calendar.createTile.title')}</h2>
        </div>
        <button onClick={onClose}>
          <X size={16} color={theme.colors.text.primary} />
        </button>
      </header>

      {/* Tile Description */}
      <Section>
        <DescriptionContainer>
          <Trans
            i18nKey="calendar.createTile.description"
            components={{
              action: (
                <DescriptionInput
                  value={formData.action}
                  onChange={handleFormInputChange('action')}
                  minWidth={50}
                  maxWidth={250}
                />
              ),
              location: (
                <DescriptionInput
                  value={formData.location}
                  onChange={handleFormInputChange('location')}
                  minWidth={50}
                  maxWidth={250}
                />
              ),
              hours: (
                <DescriptionInput
                  value={formData.durationHours}
                  onChange={handleFormInputChange('durationHours', {
                    restriction: 'integer',
                  })}
                  minWidth={50}
                  maxWidth={50}
                  type="number"
                />
              ),
              minutes: (
                <DescriptionInput
                  value={formData.durationMins}
                  onChange={handleFormInputChange('durationMins', {
                    restriction: 'integer',
                  })}
                  minWidth={50}
                  maxWidth={50}
                  type="number"
                />
              ),
              date: (
                <DescriptionDatePickerContainer>
                  <DescriptionDatePickerDisplay>
                    {dayjs(formData.deadline).format('DD/MM/YYYY')}
                    <Calendar color={theme.colors.text.secondary} size={20} />
                  </DescriptionDatePickerDisplay>
                  <DatePicker
                    ghostInput
                    value={dayjs(formData.deadline).format('YYYY-MM-DD')}
                    onChange={(date) =>
                      handleFormInputChange('deadline', {
                        mode: 'static',
                      })(dayjs(date))
                    }
                  />
                </DescriptionDatePickerContainer>
              ),
            }}
          />
        </DescriptionContainer>
      </Section>

      <Seperator />
      <TipContainer>
        <Keyboard size={20} />
        <p>
          <Trans
            i18nKey="calendar.createTile.tip.description"
            components={{
              b: <b />,
              key: <>{t('calendar.createTile.tip.keys.enter')}</>,
            }}
          />
        </p>
      </TipContainer>

      {/* Tile Actions */}
      {expanded && (
        <>
          <Section>
            <Collapse
              openIcon={<ChevronUp />}
              closeIcon={<ChevronDown />}
              items={collapseItems}
              size="small"
              iconPosition="right"
              seperatorColor={theme.colors.border.strong}
              openAll={expanded}
            />
          </Section>
          <Spacer />
          <SummaryContainer>
            <header>{t('calendar.createTile.summary.title')}</header>
            <p>
              <Trans
                i18nKey="calendar.createTile.summary.description"
                components={{
                  b: <b />,
                }}
                values={{
                  action: formData.action,
                  location: formData.location,
                  hours: formData.durationHours,
                  minutes: formData.durationMins,
                }}
              />
            </p>
          </SummaryContainer>
        </>
      )}
      <ButtonContainer $isexpanded={expanded}>
        <Button variant={'ghost'} onClick={resetForm}>
          {t('calendar.createTile.buttons.reset')}
        </Button>
        <Button variant="brand" onClick={submitForm} disabled={!isValidSubmission}>
          {t('calendar.createTile.buttons.submit')}
        </Button>
      </ButtonContainer>
    </StyledCalendarCreateEvent>
  );
};

const SummaryContainer = styled.div`
	position: sticky;
	bottom: calc(52px + 1rem);
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-size: ${(props) => props.theme.typography.fontSize.base};
	margin-bottom: 1rem;
	margin-right: 1rem;
	margin-left: auto;
	width: 100%;
	max-width: ${(props) => props.theme.screens.md};
	border-radius: ${(props) => props.theme.borderRadius.xLarge};
	padding: 1rem;
	background-color: ${(props) => props.theme.colors.calendar.summary.bg};
	color: ${(props) => props.theme.colors.calendar.summary.text};
	border: 1px solid ${(props) => props.theme.colors.calendar.summary.border};

	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	b {
		color: ${(props) => props.theme.colors.calendar.summary.boldText};
		border-bottom: 1px solid ${(props) => props.theme.colors.calendar.summary.boldText};
		min-width: 20px;
		display: inline-block;
	}

	header {
		background-color: ${(props) => props.theme.colors.calendar.summary.headerBg};
		color: ${(props) => props.theme.colors.calendar.summary.header};
		width: fit-content;
		padding: 0.25rem 0.75rem !important;
		border-radius: ${(props) => props.theme.borderRadius.large} !important;
		margin-bottom: 0.5rem;
	}
`;

const Spacer = styled.div`
	flex: 1;
`;

const Seperator = styled.hr`
	border: none;
	height: 1px;
	background-color: ${(props) => props.theme.colors.border.strong};
`;

const Section = styled.section`
	padding: 1rem 1.25rem;
	width: 100%;
	max-width: ${(props) => props.theme.screens.md};
	margin-inline: auto;
`;

const TileActionContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.25rem;

	> h3 {
		font-size: ${(props) => props.theme.typography.fontSize.base};
		font-family: ${(props) => props.theme.typography.fontFamily.urban};
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
		leading: 1;
	}
`;

const TileActionToggleContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 1rem;

	& > div {
		display: flex;
		gap: 0.75rem;
		justify-content: space-between;

		h3 {
			font-family: ${(props) => props.theme.typography.fontFamily.urban};
			font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
			font-size: ${(props) => props.theme.typography.fontSize.base};
			color: ${(props) => props.theme.colors.text.primary};
		}
	}
`;

const TileColorOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: center;
	padding: 0.5rem 0;
`;

const TileColorOption = styled.button<{ $color: RGBColor; $selected: boolean }>`
	background-color: ${({ $color }) => $color.setLightness(0.6).toHex()};
	border-radius: 50%;
	height: 2rem;
	aspect-ratio: 1 / 1;

	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	position: relative;
	outline: ${(props) =>
    props.$selected ? `2px solid ${props.theme.colors.brand[500]}` : 'none'};
	outline-offset: 4px;
	transition: outline 0.2s ease-in-out;
`;

const ButtonContainer = styled.div<{ $isexpanded: boolean }>`
	${(props) => (props.$isexpanded ? 'position: sticky; bottom: 0;' : '')}
	border-top: 1px solid ${(props) => props.theme.colors.border.strong};
	border-radius: 0 0 ${(props) => props.theme.borderRadius.xLarge}
		${(props) => props.theme.borderRadius.xLarge};
	display: flex;
	justify-content: flex-end;
	gap: 0.25rem;
	padding: 0.5rem 1rem;
	background-color: ${(props) => props.theme.colors.background.card};
`;

const DescriptionSelect = styled.select`
	background: none;
	outline: none;
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
`;

const DescriptionDatePickerContainer = styled.div`
	width: 150px;
	position: relative;
`;
const DescriptionDatePickerDisplay = styled.div`
	position: absolute;
	inset: 0;
	background: none;
	outline: none;
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
	text-align: center;
	display: flex;
	justify-content: space-around;
	align-items: center;
`;

const DescriptionInput = styled(AutosizeInput)`
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
`;

const TipContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
	justify-content: center;
	padding: 0.5rem 1rem;
	background-color: ${(props) => props.theme.colors.background.card2};
	color: ${(props) => props.theme.colors.text.secondary};
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	font-size: ${(props) => props.theme.typography.fontSize.base};

	b {
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

const DescriptionContainer = styled.div`
	box-shadow: 0 0 0 1.5px ${(props) => props.theme.colors.border};
	border-radius: ${(props) => props.theme.borderRadius.xLarge};
	padding: 1rem 1.25rem;
	font-family: ${(props) => props.theme.typography.fontFamily.urban};
	font-weight: ${(props) => props.theme.typography.fontWeight.bold};
	font-size: ${(props) => props.theme.typography.fontSize.xl};
	display: inline-flex;
	justify-content: center;
	gap: 0.5rem;
	flex-wrap: wrap;
	color: ${(props) => props.theme.colors.text.secondary};
`;

const StyledCalendarCreateEvent = styled.div<{ $isexpanded: boolean }>`
	display: flex;
	flex-direction: column;
	background-color: ${(props) => props.theme.colors.background.card};
	width: 100%;
	
  ${(props) =>
    props.$isexpanded
      ? `
			position: fixed;
			inset: 0;
			z-index: 1001;
			overflow-y: scroll;
			overflow-x: hidden;
		`
      : `
			border-radius: ${props.theme.borderRadius.xLarge};
		`};

	& > header {
		width: 100%;
		position: sticky;
		top: 0;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.strong};
		background-color: ${(props) => props.theme.colors.background.card};
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: .5rem;
		padding: 8px 16px;
		border-radius: ${(props) => `${props.theme.borderRadius.xLarge} ${props.theme.borderRadius.xLarge} 0 0`};

		> button {
			height: 28px;
			width: 28px;
			border: 1px solid ${(props) => props.theme.colors.border.default};
			color: ${(props) => props.theme.colors.text.primary};
			border-radius: ${(props) => props.theme.borderRadius.medium};
			display: flex;
			justify-content: center;
			align-items: center;
			transition: background-color 0.2s;

			&:hover {
				background-color: ${(props) => props.theme.colors.background.card2};
			}
		}
}

	.title {
		flex: 1;
		overflow: hidden;

		h2 {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: ${(props) => props.theme.typography.fontSize.lg};
			font-family: ${(props) => props.theme.typography.fontFamily.urban};
			font-weight: ${(props) => props.theme.typography.fontWeight.bold};
			color: ${(props) => props.theme.colors.text.primary};
			line-height: 1.1;
		}
	}
}
`;

export default CalendarCreateTile;
