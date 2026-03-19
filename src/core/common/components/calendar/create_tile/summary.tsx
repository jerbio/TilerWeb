import React from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { RGB, RGBColor } from '@/core/util/colors';
import { Trans, useTranslation } from 'react-i18next';
import { useTheme } from '@/core/theme/ThemeProvider';
import { InitialCreateTileFormState } from '.';
import {
  ScheduleRepeatEndType,
  ScheduleRepeatFrequency,
  ScheduleRepeatStartType,
} from '@/core/common/types/schedule';

type SummaryProps = {
  formData: InitialCreateTileFormState;
};

const Summary: React.FC<SummaryProps> = ({ formData }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const frequencyDescription = React.useMemo(() => {
    if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Yearly)
      return t('calendar.createTile.summary.recurrenceFrequency.yearly');
    if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Monthly)
      return t('calendar.createTile.summary.recurrenceFrequency.monthly');
    if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Weekly)
      return t('calendar.createTile.summary.recurrenceFrequency.weekly');
    return t('calendar.createTile.summary.recurrenceFrequency.daily');
  }, [formData.recurrenceFrequency, t]);

  return (
    <SummaryContainer $darkmode={isDarkMode} $color={formData.color}>
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
            deadline: dayjs(formData.deadline).toDate().toLocaleDateString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }),
          }}
        />
        {formData.isRecurring && (
          <>
            <Trans
              components={{ b: <b /> }}
              i18nKey="calendar.createTile.summary.recurring"
              values={{ recurrenceFrequency: frequencyDescription }}
            />
            <Trans
              components={{ b: <b /> }}
              i18nKey="calendar.createTile.summary.recurringStart"
              values={{
                recurrenceStart: dayjs(
                  formData.recurrenceStartType === ScheduleRepeatStartType.Default
                    ? formData.start
                    : formData.recurrenceStartDate
                )
                  .toDate()
                  .toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }),
              }}
            />
            {formData.recurrenceEndType === ScheduleRepeatEndType.On && (
              <Trans
                components={{ b: <b /> }}
                i18nKey="calendar.createTile.summary.recurringEnd"
                values={{
                  recurrenceEnd: dayjs(formData.recurrenceEndDate)
                    .toDate()
                    .toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    }),
                }}
              />
            )}
          </>
        )}
      </p>
    </SummaryContainer>
  );
};

export default Summary;

const SummaryContainer = styled.div<{ $darkmode: boolean; $color: RGB }>`
	${({ theme, $darkmode, $color }) => {
    const summaryColor = new RGBColor($color);
    return `
line-height: 1.5;
			position: sticky;
			bottom: calc(52px + 1rem);
			font-family: ${theme.typography.fontFamily.urban};
			font-size: ${theme.typography.fontSize.base};
			margin-bottom: 1rem;
			margin-right: 1rem;
			margin-left: auto;
			width: 100%;
			max-width: ${theme.screens.md};
			border-radius: ${theme.borderRadius.xLarge};
			padding: 1rem;
			color: ${summaryColor.setLightness($darkmode ? 0.85 : 0.3).toHex()};
			border: 1px solid ${summaryColor.setLightness($darkmode ? 0.3 : 0.8).toHex()};
			background-color: ${summaryColor.setLightness($darkmode ? 0.2 : 0.9).toHex()};
			font-weight: ${theme.typography.fontWeight.semibold};

			transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

			b {
				color: ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				border-bottom: 1px solid ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				min-width: 20px;
				display: inline-block;
				transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
			}

			header {
				background-color: ${summaryColor.setLightness($darkmode ? 0.3 : 1).toHex()};
				color: ${summaryColor.setLightness($darkmode ? 0.95 : 0.2).toHex()};
				width: fit-content;
				padding: 0.25rem 0.75rem !important;
				border-radius: ${theme.borderRadius.large} !important;
				margin-bottom: 0.5rem;
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
			}
		`;
  }}
`;
