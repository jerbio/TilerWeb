import useFormHandler from '@/hooks/useFormHandler';
import React, { useMemo } from 'react';
import { InitialCreateBlockFormState } from '.';
import styled from 'styled-components';
import Input from '../../input';
import DatePicker from '../../date_picker';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import TimeDropdown from '../../TimeDropdown';
import { useCalendarUI } from '../calendar-ui.provider';
import calendarConfig from '@/core/constants/calendar_config';
import LocationInput, { LocationInputController } from '../../location-input';

type InfoProps = {
  formHandler: ReturnType<typeof useFormHandler<InitialCreateBlockFormState>>;
};

const CreateBlockInfo: React.FC<InfoProps> = ({ formHandler }) => {
  const { formData, handleFormInputChange, setFormData } = formHandler;
  const ui = useCalendarUI((state) => state.createBlock);
  const { t } = useTranslation();

  const locationController = useMemo<LocationInputController>(
    () => ({
      location: formData.location,
			isVerified: formData.locationIsVerified,
      setLocation: (value: string) => {
        setFormData((prev) => ({
          ...prev,
          location: value,
          locationId: null,
          locationSource: '',
          locationIsVerified: false,
          locationTag: '',
        }));
      },
      clearLocation: () => {
        setFormData((prev) => ({
          ...prev,
          location: '',
          locationId: null,
          locationSource: '',
          locationIsVerified: false,
          locationTag: '',
        }));
      },
      setFromSelection: (loc) => {
        setFormData((prev) => ({
          ...prev,
          location: loc.address,
          locationId: loc.source !== 'google' ? loc.id : null,
          locationSource: loc.source,
          locationIsVerified: loc.isVerified,
          locationTag: loc.nickname || '',
        }));
      },
    }),
    [formData.location, formData.locationIsVerified, setFormData],
  );

  return (
    <Grid $isexpanded={ui.state.isExpanded}>
      <Input
        containerStyle={{ gridColumn: 'span 2' }}
        label={t('calendar.createBlock.info.name.label')}
        required
        name="name"
        placeholder={t('calendar.createBlock.info.name.placeholder')}
        value={formData.name}
        onChange={handleFormInputChange('name')}
      />
      <InputContainer>
        <label>{t('calendar.createBlock.info.start.label')}</label>
        <DatePicker
          value={dayjs(formData.start).format('YYYY-MM-DD')}
          placeholder={t('calendar.createBlock.info.start.placeholder')}
          onChange={(date) =>
            handleFormInputChange('start', {
              mode: 'static',
            })(dayjs(date))
          }
        />
      </InputContainer>
      <InputContainer>
        <label>{t('calendar.createBlock.info.startTime.label')}</label>
        <TimeDropdown
          interval={calendarConfig.CREATE_EVENT_MINUTE_INTERVAL}
          value={formData.startTime}
          onChange={handleFormInputChange('startTime', { mode: 'static' })}
          placeholder={t('calendar.createBlock.info.startTime.placeholder')}
        />
      </InputContainer>
      <Input
        label={t('calendar.createBlock.info.hours.label')}
        required
        type="number"
        name="durationHours"
        placeholder={t('calendar.createBlock.info.hours.placeholder')}
        value={formData.durationHours}
        onChange={handleFormInputChange('durationHours', {
          restriction: 'integer',
        })}
      />
      <Input
        label={t('calendar.createBlock.info.minutes.label')}
        required
        type="number"
        name="durationMins"
        step="5"
        placeholder={t('calendar.createBlock.info.minutes.placeholder')}
        value={formData.durationMins}
        onChange={handleFormInputChange('durationMins', {
          restriction: 'integer',
        })}
      />
      <LocationInput
        controller={locationController}
				containerStyle={{ gridColumn: 'span 2' }}
        label={t('calendar.createBlock.info.location.label')}
        placeholder={t('calendar.createBlock.info.location.placeholder')}
      />
    </Grid>
  );
};

const Grid = styled.div<{ $isexpanded: boolean }>`
	display: grid;
	gap: 1rem;
	margin-block: ${({ $isexpanded }) => ($isexpanded ? '2rem' : '0')};

	label,
	h3 {
		font-family: ${({ theme }) => theme.typography.fontFamily.urban};
		font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
		font-size: ${({ theme }) => theme.typography.fontSize.base};
		color: ${({ theme }) => theme.colors.text.primary};
	}

	@media (min-width: ${({ theme }) => theme.screens.md}) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const InputContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

export default CreateBlockInfo;
