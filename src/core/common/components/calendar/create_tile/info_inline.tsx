import React from 'react';
import useFormHandler from '@/hooks/useFormHandler';
import { Calendar } from 'lucide-react';
import { useTheme as useStyledTheme } from 'styled-components';
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

type InfoProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const CreateTileInfoInline: React.FC<InfoProps> = ({
	formHandler: { formData, handleFormInputChange },
}) => {
	const theme = useStyledTheme();

	return (
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
						/>
					),
					date: (
						<InlineDatePickerContainer>
							<InlineDatePickerDisplay>
								{dayjs(formData.deadline).toDate().toLocaleDateString(undefined, {
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
	);
};

export default CreateTileInfoInline;
