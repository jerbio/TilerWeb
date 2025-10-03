import { personaService } from '@/services';
import { Persona } from '@/core/common/types/persona';
import TimeUtil from '@/core/util/time';

export interface PersonaUser {
  userId: string;
  expiration: number;
  personaInfo?: {
    name?: string;
  };
}

export type PersonaUsers = Record<Persona['id'], PersonaUser | undefined>;

class PersonaUserService {
  private readonly STORAGE_KEY = 'tiler-persona-users' as const;

  /**
   * Get all stored persona users from localStorage (with expiration cleanup)
   */
  getStoredPersonaUsers(): PersonaUsers {
    const storedPersonaUsers: PersonaUsers = JSON.parse(
      localStorage.getItem(this.STORAGE_KEY) || '{}'
    );

    // Clean up expired users
    for (const personaId in storedPersonaUsers) {
      const user = storedPersonaUsers[personaId]!;
      if (user.expiration < TimeUtil.now()) {
        delete storedPersonaUsers[personaId];
      }
    }

    // Save cleaned data back to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedPersonaUsers));
    return storedPersonaUsers;
  }

  /**
   * Get personas array with mapped indices (for selectedPersonaId lookup)
   */
  async getPersonasWithKeys(): Promise<Array<Persona & { key: number }>> {
    const data = await personaService.getPersonas();
    return data.personas.map((persona, index) => ({
      ...persona,
      key: index,
    }));
  }

  /**
   * Get persona info by selectedPersonaId (index-based lookup)
   */
  async getSelectedPersonaInfo(selectedPersonaId: number | null): Promise<PersonaUser | null> {
    if (selectedPersonaId === null) return null;

    try {
      // Get personas array with indices
      const personasWithKeys = await this.getPersonasWithKeys();

      // Find the persona at the selected index
      const selectedPersona = personasWithKeys[selectedPersonaId];
      if (!selectedPersona) return null;

      // Get stored persona users
      const storedPersonaUsers = this.getStoredPersonaUsers();
      const personaInfo = storedPersonaUsers[selectedPersona.id];

      return personaInfo || null;
    } catch (error) {
      console.warn('Failed to get selected persona info:', error);
      return null;
    }
  }

  /**
   * Get persona user by persona ID (direct lookup)
   */
  getPersonaUserById(personaId: Persona['id']): PersonaUser | null {
    const storedPersonaUsers = this.getStoredPersonaUsers();
    return storedPersonaUsers[personaId] || null;
  }

  /**
   * Set persona user data
   */
  setPersonaUser(
    personaId: Persona['id'],
    userData: { userId: string | null; personaInfo?: { name?: string } }
  ): void {
    const storedPersonaUsers = this.getStoredPersonaUsers();

    if (userData.userId === null) {
      // Remove user
      delete storedPersonaUsers[personaId];
    } else {
      // Add/update user
      const expiration = TimeUtil.now() + TimeUtil.inMilliseconds(1, 'd');
      storedPersonaUsers[personaId] = {
        userId: userData.userId,
        expiration,
        personaInfo: userData.personaInfo,
      };
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedPersonaUsers));
  }

  /**
   * Get persona by index (for selectedPersonaId)
   */
  async getPersonaByIndex(index: number): Promise<(Persona & { key: number }) | null> {
    try {
      const personasWithKeys = await this.getPersonasWithKeys();
      return personasWithKeys[index] || null;
    } catch (error) {
      console.warn('Failed to get persona by index:', error);
      return null;
    }
  }

  /**
   * Clear expired persona users
   */
  clearExpiredUsers(): void {
    this.getStoredPersonaUsers(); // This method already handles cleanup
  }
}

// Export singleton instance
export const personaUserService = new PersonaUserService();
export default personaUserService;