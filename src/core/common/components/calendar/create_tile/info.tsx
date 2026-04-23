import useFormHandler from '@/hooks/useFormHandler';
import React, { useMemo } from 'react';
import { InitialCreateTileFormState } from '.';
import styled from 'styled-components';
import Input from '../../input';
import DatePicker from '../../date_picker';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import LocationInput, { LocationInputController } from '../../location-input';

type InfoProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const CreateTileInfo: React.FC<InfoProps> = ({
	formHandler: { formData, handleFormInputChange, setFormData },
}) => {
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
		[formData.location, formData.locationIsVerified, setFormData]
	);

	return (
		<Grid>
			<Input
				label={t('calendar.createTile.info.action.label')}
				required
				name="action"
				placeholder={t('calendar.createTile.info.action.placeholder')}
				value={formData.action}
				onChange={handleFormInputChange('action')}
			/>
			<Input
				label={t('calendar.createTile.info.tileSplit.label')}
				name="count"
				type="number"
				placeholder={t('calendar.createTile.info.tileSplit.placeholder')}
				value={formData.count}
				onChange={handleFormInputChange('count', {
					restriction: 'integer',
				})}
			/>
			<Input
				label={t('calendar.createTile.info.locationTag.label')}
				name="locationTag"
				placeholder={t('calendar.createTile.info.locationTag.placeholder')}
				value={formData.locationTag}
				onChange={handleFormInputChange('locationTag')}
			/>
			<LocationInput
				containerStyle={{ gridColumn: 'span 2' }}
				controller={locationController}
				label={t('calendar.createTile.info.location.label')}
				placeholder={t('calendar.createTile.info.location.placeholder')}
			/>
			<Input
				label={t('calendar.createTile.info.hours.label')}
				required
				type="number"
				name="durationHours"
				placeholder={t('calendar.createTile.info.hours.placeholder')}
				value={formData.durationHours}
				onChange={handleFormInputChange('durationHours', {
					restriction: 'integer',
				})}
			/>
			<Input
				label={t('calendar.createTile.info.minutes.label')}
				required
				type="number"
				name="durationMins"
				step="5"
				placeholder={t('calendar.createTile.info.minutes.placeholder')}
				value={formData.durationMins}
				onChange={handleFormInputChange('durationMins', {
					restriction: 'integer',
				})}
			/>
			{!formData.isRecurring && (
				<RangeContainer>
					<h3>{t('calendar.createTile.info.range.label')}</h3>
					<RangeDescription>
						<p>{t('calendar.createTile.info.range.description')}</p>
						<DatePicker
							value={dayjs(formData.start).format('YYYY-MM-DD')}
							maxDate={dayjs(formData.deadline).format('YYYY-MM-DD')}
							onChange={(date) =>
								handleFormInputChange('start', {
									mode: 'static',
								})(dayjs(date))
							}
						/>
						<p>{t('calendar.createTile.info.range.conjunction')}</p>
						<DatePicker
							value={dayjs(formData.deadline).format('YYYY-MM-DD')}
							minDate={dayjs(formData.start).format('YYYY-MM-DD')}
							onChange={(date) =>
								handleFormInputChange('deadline', {
									mode: 'static',
								})(dayjs(date))
							}
						/>
					</RangeDescription>
				</RangeContainer>
			)}
		</Grid>
	);
};

const Grid = styled.div`
	display: grid;
	gap: 1rem;
	margin-block: 2rem;

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

const RangeContainer = styled.div`
	display: flex;
	flex-direction: column;
	grid-column: span 2;

	h3 {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 3px;
	}
`;

const RangeDescription = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 1ch;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};

	& > div {
		input {
			padding-inline: 1rem !important;
		}

		@media (min-width: ${({ theme }) => theme.screens.sm}) {
			flex: 1;
		}
	}
`;

export default CreateTileInfo;
