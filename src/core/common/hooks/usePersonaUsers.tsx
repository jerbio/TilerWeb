import { useState, useEffect } from 'react';
import { Persona } from '../types/persona';
import TimeUtil from '../../util/time';

type PersonaUser = {
  userId: string;
  expiration: number;
  personaInfo?: {
    name?: string;
  };
};
export type PersonaUsers = Record<Persona['id'], PersonaUser | undefined>;
export type PersonaUserSetter = (
  personaId: Persona['id'],
  user: { userId: string | null; personaInfo?: { name?: string } }
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

  const setPersonaUser: PersonaUserSetter = (personaId, user) => {
    if (user.userId === null) {
      const newPersonaUsers = { ...personaUsers };
      delete newPersonaUsers[personaId];
      setPersonaUsers(newPersonaUsers);
      localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(newPersonaUsers));
    } else {
      const expiration = TimeUtil.now() + TimeUtil.inMilliseconds(1, 'd');
      const updatedUser: PersonaUser = {
        userId: user.userId,
        expiration,
        personaInfo: user.personaInfo,
      };
      const updatedPersonaUsers: PersonaUsers = {
        ...personaUsers,
        [personaId]: updatedUser,
      };
      setPersonaUsers(updatedPersonaUsers);
      localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(updatedPersonaUsers));
    }
  };

  return { personaUsers, setPersonaUser };
}

export default usePersonaUsers;
