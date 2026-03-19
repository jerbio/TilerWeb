import useFormHandler from '@/hooks/useFormHandler';
import React from 'react';
import { InitialCreateTileFormState } from '.';
import styled from 'styled-components';
import Input from '../../input';
import DatePicker from '../../date_picker';
import dayjs from 'dayjs';

type InfoProps = {
  formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const CreateTileInfo: React.FC<InfoProps> = ({
  formHandler: { formData, handleFormInputChange },
}) => {
  return (
    <Grid>
      <Input
        label="Tile Name"
        required
        name="action"
        placeholder={'What is the name of this tile?'}
        value={formData.action}
        onChange={handleFormInputChange('action')}
      />
      <Input
        label="Tile Location"
        name="location"
        placeholder={'Where is this tile held?'}
        value={formData.location}
        onChange={handleFormInputChange('location')}
      />
      <Input
        label="Tile Duration (hours)"
        required
        type="number"
        name="durationHours"
        placeholder={'How many hrs will it take?'}
        value={formData.durationHours}
        onChange={handleFormInputChange('durationHours', {
          restriction: 'integer',
        })}
      />
      <Input
        label="Tile Duration (mins)"
        required
        type="number"
        name="durationMins"
        placeholder={'How many mins will it take?'}
        value={formData.durationMins}
        onChange={handleFormInputChange('durationMins', {
          restriction: 'integer',
        })}
      />
      {!formData.isRecurring && (
        <RangeContainer>
          <h3>Time Range</h3>
          <RangeDescription>
            <p>Schedule between</p>
            <DatePicker
              value={dayjs(formData.start).format('YYYY-MM-DD')}
              maxDate={dayjs(formData.deadline).format('YYYY-MM-DD')}
              onChange={(date) =>
                handleFormInputChange('start', {
                  mode: 'static',
                })(dayjs(date))
              }
            />
            <p>and</p>
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
	grid-template-columns: 1fr 1fr;
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
