import { RGBColor } from '@/core/util/colors';
import { eventColorOptions } from '@/core/common/components/calendar/data';
import styled from 'styled-components';
import useFormHandler from '@/hooks/useFormHandler';
import { InitialCreateTileFormState } from '.';

type ColorOptionsProps = {
	formHandler: ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;
};

const ColorOptions: React.FC<ColorOptionsProps> = ({
	formHandler: { formData, handleFormInputChange },
}) => {
	return (
		<TileColorOptions>
			{eventColorOptions.map((color) => {
				const optionRGBColor = new RGBColor(color);
				return (
					<TileColorOption
						type="button"
						key={optionRGBColor.toHex()}
						$color={optionRGBColor}
						$selected={optionRGBColor.equals(formData.color)}
						onClick={() => {
							handleFormInputChange('color', { mode: 'static' })(optionRGBColor);
						}}
					></TileColorOption>
				);
			})}
		</TileColorOptions>
	);
};

export default ColorOptions;

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
		props.$selected ? `2px solid ${props.theme.colors.brand[500]}` : '2px solid transparent'};
	outline-offset: 4px;
	transition: outline 0.2s ease-in-out;
`;
