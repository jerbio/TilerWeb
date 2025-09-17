import { useState, useEffect } from 'react';
import { Persona } from '../types/persona';
import TimeUtil from '../../util/time';

export type PersonaUsers = Record<
  Persona['id'],
  { userId: string; expiration: number } | undefined
>;

type PersonaUserSetterOptions = {
  store: boolean;
};
export type PersonaUserSetter = (
  personaId: Persona['id'],
  userId: string | null,
  options?: PersonaUserSetterOptions
) => void;

function usePersonaUsers() {
  const PERSONA_STORAGE_KEY = 'tiler-persona-users' as const;
  function getStoredPersonaUsers(): PersonaUsers {
    const storedPersonaUsers: PersonaUsers = JSON.parse(
      localStorage.getItem(PERSONA_STORAGE_KEY) || '{}'
    );

    for (const personaId in storedPersonaUsers) {
      const user = storedPersonaUsers[personaId]!;
      if (user.expiration < TimeUtil.now()) {
        // Remove expired schedules
        delete storedPersonaUsers[personaId];
      }
    }

    return storedPersonaUsers;
  }

  const [personaUsers, setPersonaUsers] = useState<PersonaUsers>({});
  useEffect(() => {
    const users = getStoredPersonaUsers();
    setPersonaUsers(users);
  }, []);

  function setPersonaUser(
    personaId: Persona['id'],
    userId: string | null,
    options: PersonaUserSetterOptions = { store: true }
  ) {
    if (userId === null) {
      const newPersonaUsers = { ...personaUsers };
      delete newPersonaUsers[personaId];
      setPersonaUsers(newPersonaUsers);
      if (options.store) {
        localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(newPersonaUsers));
      }
    } else {
      const expiration = TimeUtil.now() + TimeUtil.inMilliseconds(1, 'd');
      const updatedPersonaUsers: PersonaUsers = {
        ...personaUsers,
        [personaId]: {
          userId,
          expiration,
        },
      };
      setPersonaUsers(updatedPersonaUsers);
      if (options.store) {
        localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(updatedPersonaUsers));
      }
    }
  }

  return { personaUsers, setPersonaUser };
}

export default usePersonaUsers;
