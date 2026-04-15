import { RGBColor } from '@/core/util/colors';
import styled from 'styled-components';
import { eventColors } from '@/core/constants/calendar_options';
import { OptionsFormController } from './options';

type ColorOptionsProps = {
	controller: OptionsFormController;
};

const CreateTileColorOptions: React.FC<ColorOptionsProps> = ({ controller }) => {
	return (
		<TileColorOptions>
			{eventColors.map((color) => {
				const optionRGBColor = new RGBColor(color);
				const hexColor = optionRGBColor.setLightness(0.6).toHex();
				return (
					<TileColorOption
						type="button"
						key={optionRGBColor.toHex()}
						$hexColor={hexColor}
						$selected={optionRGBColor.equals(controller.color)}
						onClick={() => controller.setColor(optionRGBColor)}
					></TileColorOption>
				);
			})}
		</TileColorOptions>
	);
};

export default CreateTileColorOptions;

export const TileColorOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: center;
	padding: 0.5rem 0;
`;

export const TileColorOption = styled.button<{ $hexColor: string; $selected: boolean }>`
	background-color: ${({ $hexColor }) => $hexColor};
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
