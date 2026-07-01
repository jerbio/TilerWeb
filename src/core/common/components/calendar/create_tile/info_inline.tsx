import React from 'react';
import useFormHandler from '@/hooks/useFormHandler';
import { Calendar } from 'lucide-react';
import styled, { useTheme as useStyledTheme } from 'styled-components';
import dayjs from 'dayjs';
import { Trans } from 'react-i18next';
import {
	InlineControl,
	InlineDatePickerContainer,
	InlineDatePickerDisplay,
	InlineInput,
	InitialCreateTileFormState,
} from '.';
import DatePicker from '../../date_picker';
import {
	EMPTY_PREDICTION_FEEDBACK,
	PredictionLoadingBar,
	type TilePredictionAutofillFeedback,
} from './prediction-feedback';

type InfoProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
	predictionFeedback?: TilePredictionAutofillFeedback;
};

const CreateTileInfoInline: React.FC<InfoProps> = ({
	formHandler: { formData, handleFormInputChange },
	predictionFeedback = EMPTY_PREDICTION_FEEDBACK,
}) => {
	const theme = useStyledTheme();
	const feedbackInputStyle = (highlighted: boolean): React.CSSProperties => ({
		borderRadius: 4,
		backgroundColor: highlighted ? theme.colors.datepicker.dateSelectedBg + '16' : undefined,
		boxShadow: highlighted ? `0 0 0 1px ${theme.colors.datepicker.dateSelectedBg}` : undefined,
		transition: 'background-color 0.45s ease, box-shadow 0.45s ease',
	});

	return (
		<>
			{predictionFeedback.isPredicting && (
				<InlinePredictionLoading>
					<PredictionLoadingBar />
				</InlinePredictionLoading>
			)}
			<InlineControl>
				<Trans
					i18nKey="calendar.createTile.info.description"
					components={{
						action: (
							<InlineInput
								markRequired
								value={formData.action}
								onChange={handleFormInputChange('action')}
								minWidth={50}
								maxWidth={250}
							/>
						),
						location: (
							<InlineInput
								value={formData.location}
								onChange={handleFormInputChange('location')}
								minWidth={50}
								maxWidth={250}
								style={feedbackInputStyle(
									predictionFeedback.highlightedFields.location
								)}
							/>
						),
						hours: (
							<InlineInput
								markRequired
								value={formData.durationHours}
								onChange={handleFormInputChange('durationHours', {
									restriction: 'integer',
								})}
								minWidth={50}
								maxWidth={50}
								type="number"
								style={feedbackInputStyle(
									predictionFeedback.highlightedFields.duration
								)}
							/>
						),
						minutes: (
							<InlineInput
								markRequired
								value={formData.durationMins}
								step={5}
								onChange={handleFormInputChange('durationMins', {
									restriction: 'integer',
								})}
								minWidth={50}
								maxWidth={50}
								type="number"
								style={feedbackInputStyle(
									predictionFeedback.highlightedFields.duration
								)}
							/>
						),
						date: (
							<InlineDatePickerContainer>
								<InlineDatePickerDisplay>
									{dayjs(formData.deadline)
										.toDate()
										.toLocaleDateString(undefined, {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit',
										})}
									<Calendar color={theme.colors.text.secondary} size={20} />
								</InlineDatePickerDisplay>
								<DatePicker
									ghostInput
									value={dayjs(formData.deadline).format('YYYY-MM-DD')}
									minDate={dayjs(formData.start).format('YYYY-MM-DD')}
									onChange={(date) =>
										handleFormInputChange('deadline', {
											mode: 'static',
										})(dayjs(date))
									}
								/>
							</InlineDatePickerContainer>
						),
					}}
				/>
			</InlineControl>
		</>
	);
};

const InlinePredictionLoading = styled.div`
	margin-bottom: 0.5rem;
`;

export default CreateTileInfoInline;
