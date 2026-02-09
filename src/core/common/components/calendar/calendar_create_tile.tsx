import useFormHandler from '@/hooks/useFormHandler';
import { ChevronDown, ChevronUp, Keyboard, X } from 'lucide-react';
import styled, { useTheme } from 'styled-components';
import dayjs from 'dayjs';
import Button from '../button';
import Collapse from '../collapse';
import { RGB, RGBColor } from '@/core/util/colors';
import Toggle from '../toggle';
import React from 'react';
import Radio from '../radio';
import AutosizeInput from '../auto-size-input';
import advancedFormat from 'dayjs/plugin/advancedFormat';

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
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isTimeRestricted: boolean;
  timeRestrictionType: 'daily' | 'personal' | 'work' | 'custom';
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
  tileColorOptions: { name: string; color: RGB }[];
};

const CalendarCreateTile: React.FC<CalendarCreateTileProps> = ({
  onClose,
  expanded,
  setExpanded,
  tileColorOptions,
  formHandler,
}) => {
  const { formData, handleFormInputChange, resetForm } = formHandler;
  const theme = useTheme();

  const collapseItems = [
    {
      title: 'Select Tile Color',
      content: (
        <TileColorOptions>
          {tileColorOptions.map((option) => {
            const optionRGBColor = new RGBColor(option.color);
            return (
              <TileColorOption
                key={option.name}
                $color={optionRGBColor}
                $selected={optionRGBColor.equals(formData.color)}
                onClick={() =>
                  handleFormInputChange('color', { mode: 'static' })(option.color)
                }
              ></TileColorOption>
            );
          })}
        </TileColorOptions>
      ),
    },
    {
      title: 'Tile Actions',
      content: (
        <>
          <TileActionToggleContainer>
            <div>
              <h3>Repeat the Tile</h3>
              <Toggle
                checked={formData.isRecurring}
                onChange={handleFormInputChange('isRecurring', { mode: 'static' })}
              />
            </div>
            {formData.isRecurring && (
              <TileActionContainer>
                <DescriptionContainer>
                  <p>I need to do this</p>
                  <DescriptionInput
                    value={formData.recurrenceCount}
                    onChange={handleFormInputChange('recurrenceCount', {
                      restriction: 'integer',
                    })}
                    minWidth={50}
                    maxWidth={50}
                    type="number"
                  />
                  <p>per</p>
                  <DescriptionSelect
                    value={formData.recurrenceType}
                    onChange={handleFormInputChange('recurrenceType')}
                  >
                    <option value="daily">Day</option>
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                    <option value="yearly">Year</option>
                  </DescriptionSelect>
                </DescriptionContainer>
                <Seperator />
              </TileActionContainer>
            )}
            <div>
              <h3>Add time restrictions</h3>
              <Toggle
                checked={formData.isTimeRestricted}
                onChange={handleFormInputChange('isTimeRestricted', {
                  mode: 'static',
                })}
              />
            </div>
            {formData.isTimeRestricted && (
              <TileActionContainer>
                <TimeRestrictionList>
                  <div>
                    <Radio
                      checked={formData.timeRestrictionType === 'daily'}
                      onChange={() =>
                        handleFormInputChange('timeRestrictionType', {
                          mode: 'static',
                        })('Daily')
                      }
                    />
                    <h3>Everyday</h3>
                  </div>
                  <div>
                    <Radio
                      checked={formData.timeRestrictionType === 'personal'}
                      onChange={() =>
                        handleFormInputChange('timeRestrictionType', {
                          mode: 'static',
                        })('Personal')
                      }
                    />
                    <h3>Personal Hours</h3>
                  </div>
                  <div>
                    <Radio
                      checked={formData.timeRestrictionType === 'work'}
                      onChange={() =>
                        handleFormInputChange('timeRestrictionType', {
                          mode: 'static',
                        })('Work')
                      }
                    />
                    <h3>Work Hours</h3>
                  </div>
                  <div>
                    <Radio
                      checked={formData.timeRestrictionType === 'custom'}
                      onChange={() =>
                        handleFormInputChange('timeRestrictionType', {
                          mode: 'static',
                        })('Custom')
                      }
                    />
                    <h3>Selected Days</h3>
                  </div>
                </TimeRestrictionList>
                <DescriptionContainer>
                  <p>Start time</p>
                  <DescriptionInput
                    type="time"
                    value={formData.timeRestrictionStart}
                    onChange={handleFormInputChange('timeRestrictionStart')}
                    minWidth={64}
                    maxWidth={64}
                  />
                  <p>End Time</p>
                  <DescriptionInput
                    type="time"
                    value={formData.timeRestrictionEnd}
                    onChange={handleFormInputChange('timeRestrictionEnd')}
                    minWidth={64}
                    maxWidth={64}
                  />
                </DescriptionContainer>
                <Seperator />
              </TileActionContainer>
            )}
            <div>
              <h3>Add location nickname</h3>
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

  return (
    <StyledCalendarCreateEvent $isexpanded={expanded}>
      <header>
        <div className="title">
          <h2>Add a New Tile</h2>
        </div>
        <button onClick={onClose}>
          <X size={16} color={theme.colors.text.primary} />
        </button>
      </header>

      {/* Tile Description */}
      <Section>
        <DescriptionContainer>
          <p>I need to</p>
          <DescriptionInput
            value={formData.action}
            onChange={handleFormInputChange('action')}
            minWidth={50}
            maxWidth={250}
          />
          <p>at</p>
          <DescriptionInput
            value={formData.location}
            onChange={handleFormInputChange('location')}
            minWidth={50}
            maxWidth={250}
          />
          <p>it will take me</p>
          <DescriptionInput
            value={formData.durationHours}
            onChange={handleFormInputChange('durationHours', {
              restriction: 'integer',
            })}
            minWidth={50}
            maxWidth={50}
            type="number"
          />
          <p>Hr</p>
          <DescriptionInput
            value={formData.durationMins}
            onChange={handleFormInputChange('durationMins', { restriction: 'integer' })}
            minWidth={50}
            maxWidth={50}
            type="number"
          />
          <p>Min, and I need to get it done by</p>
          <DescripitonDate
            type="date"
            value={dayjs(formData.deadline).format('YYYY-MM-DD')}
            onChange={(e) =>
              handleFormInputChange('deadline', { mode: 'static' })(
                dayjs(e.target.value)
              )
            }
          />
        </DescriptionContainer>
      </Section>

      <Seperator />
      <TipContainer>
        <Keyboard size={20} />
        <p>
          Press <b>[Enter]</b> when done.
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
            <header>Summary</header>
            <p>
              I need to <b>{formData.action}</b> at <b>{formData.location}</b> it will
              take me{' '}
              <b>
                {formData.durationHours} Hr {formData.durationMins} Min
              </b>
              , and I need to get it done by{' '}
              <b>{dayjs(formData.deadline).format('Do MMMM, YYYY')}</b>
            </p>
          </SummaryContainer>
        </>
      )}
      <ButtonContainer>
        <Button
          variant={'ghost'}
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          {expanded ? 'Less Options' : 'More Options'}
        </Button>
        <Button variant={'ghost'} onClick={resetForm}>
          Reset
        </Button>
        <Button variant="brand">Create Tile</Button>
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

const TimeRestrictionList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-bottom: 1rem;

	> div {
		display: flex;
		gap: 0.75rem;
		min-width: 0;
	}

	h3 {
		font-size: ${(props) => props.theme.typography.fontSize.sm};
		font-family: ${(props) => props.theme.typography.fontFamily.urban};
		font-weight: ${(props) => props.theme.typography.fontWeight.bold};
		color: ${(props) => props.theme.colors.gray[200]};
		leading: 1;
	}
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

const ButtonContainer = styled.div`
	position: sticky;
	bottom: 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.strong};
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

const DescripitonDate = styled.input`
	background: none;
	outline: none;
	color: ${(props) => props.theme.colors.highlight.text};
	border-bottom: 1.5px dashed ${(props) => props.theme.colors.highlight.text} !important;
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
			overflow-y: scroll;
			overflow-x: hidden;
	
  ${(props) =>
    props.$isexpanded
      ? `
			position: fixed;
			inset: 0;
			z-index: 1001;
			width: 100%;
		`
			: `
			border-radius: ${props.theme.borderRadius.xLarge};
			width: 100%;
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
