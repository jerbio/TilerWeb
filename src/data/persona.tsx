import SWE from '../assets/image_assets/swe.png';
import Engineer from '../assets/image_assets/engineer.png';
import Healthcare from '../assets/image_assets/healthcare.png';
import Custom from '../assets/image_assets/custom.png';
import { Persona } from '../types/persona';

// function usePersonas() {
// 	const { t } = useTranslation();
// 	const personas = [
// 		{
// 			key: 0,
// 			occupation: t('home.persona.custom'),
// 			image: Custom,
// 			highlight: true,
// 		},
// 		{
// 			key: 1,
// 			occupation: t('home.persona.developer'),
// 			image: SWE,
// 		},
// 		{
// 			key: 2,
// 			occupation: t('home.persona.healthcare'),
// 			image: Healthcare,
// 		},
// 		{
// 			key: 3,
// 			occupation: t('home.persona.engineer'),
// 			image: Engineer,
// 		},
// 	];
//
// 	return {
// 		personas,
// 	};
// }

const personaImages: Record<Persona['id'], string> = {
	'custom-persona': Custom,
	'developer-persona': SWE,
	'healthcare-persona': Healthcare,
	'engineer-persona': Engineer,
};

export function getPersonaImage(personaId: Persona['id']): string {
	return personaImages[personaId] || Custom; // Fallback to Custom if not found
}
