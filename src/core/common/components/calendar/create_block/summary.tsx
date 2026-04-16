import React from 'react';
import dayjs from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import { useTheme } from '@/core/theme/ThemeProvider';
import { InitialCreateBlockFormState } from '.';
import {
	ScheduleRepeatEndType,
	ScheduleRepeatFrequency,
	ScheduleRepeatStartType,
} from '@/core/common/types/schedule';
import TimeUtil from '@/core/util/time';
import { SummaryContainer } from '../create_tile/summary';

type SummaryProps = {
	formData: InitialCreateBlockFormState;
};

const CreateBlockSummary: React.FC<SummaryProps> = ({ formData }) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();

	const frequencyDescription = React.useMemo(() => {
		if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Yearly)
			return t('calendar.createBlock.summary.recurrenceFrequency.yearly');
		if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Monthly)
			return t('calendar.createBlock.summary.recurrenceFrequency.monthly');
		if (formData.recurrenceFrequency === ScheduleRepeatFrequency.Weekly)
			return t('calendar.createBlock.summary.recurrenceFrequency.weekly');
		return t('calendar.createBlock.summary.recurrenceFrequency.daily');
	}, [formData.recurrenceFrequency, t]);

	return (
		<SummaryContainer $darkmode={isDarkMode} $color={formData.color}>
			<header>{t('calendar.createBlock.summary.title')}</header>
			<p>
				<Trans
					i18nKey="calendar.createBlock.summary.description"
					components={{
						b: <b />,
					}}
					values={{
						name: formData.name,
						duration: TimeUtil.minutesDuration(
							TimeUtil.getRangeInMins(
								formData.startTime,
								formData.endTime,
								formData.start,
								formData.end
							)
						),
					}}
				/>
				{formData.location.trim().length > 0 && (
					<Trans
						i18nKey="calendar.createBlock.summary.locationDescription"
						components={{
							b: <b />,
						}}
						values={{
							location: formData.location,
						}}
					/>
				)}
				{formData.isRecurring && (
					<>
						<Trans
							components={{ b: <b /> }}
							i18nKey="calendar.createBlock.summary.recurring"
							values={{ recurrenceFrequency: frequencyDescription }}
						/>
						<Trans
							components={{ b: <b /> }}
							i18nKey="calendar.createBlock.summary.recurringStart"
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
								i18nKey="calendar.createBlock.summary.recurringEnd"
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

export default CreateBlockSummary;
