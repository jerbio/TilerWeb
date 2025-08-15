import { Persona } from '@/core/common/types/persona';
import Custom from '@/assets/persona/custom.png';
import SWE from '@/assets/persona/swe.png';
import Healthcare from '@/assets/persona/healthcare.png';
import Engineer from '@/assets/persona/engineer.png';

class PersonaUtil {
  static getPersonaImage(personaId: Persona['id']): string {
    const personaImages: Record<Persona['id'], string> = {
      'custom-persona': Custom,
      'developer-persona': SWE,
      'healthcare-persona': Healthcare,
      'engineer-persona': Engineer,
    };

    return personaImages[personaId] || Custom;
  }
}

export default PersonaUtil;
