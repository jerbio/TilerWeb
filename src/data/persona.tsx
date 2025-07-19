import { useTranslation } from 'react-i18next';
import SWE from '../assets/image_assets/swe.png';
import Engineer from '../assets/image_assets/engineer.png';
import Healthcare from '../assets/image_assets/healthcare.png';
import Custom from '../assets/image_assets/custom.png';

function usePersonas() {
	const { t } = useTranslation();
	const personas = [
		{
			key: 0,
			occupation: t('home.persona.custom'),
			image: Custom,
			highlight: true,
		},
		{
			key: 1,
			occupation: t('home.persona.developer'),
			image: SWE,
		},
		{
			key: 2,
			occupation: t('home.persona.healthcare'),
			image: Healthcare,
		},
		{
			key: 3,
			occupation: t('home.persona.engineer'),
			image: Engineer,
		},
	];

	return {
		personas,
	};
}

export default usePersonas;
