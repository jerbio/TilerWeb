import { useState, useEffect } from 'react';
import { Persona } from '../types/persona';
import TimeUtil from '../../util/time';
import { UserInfo } from '@/global_state';

export type PersonaSchedule = Record<
  Persona['id'],
  | {
    scheduleId: string;
    scheduleExpiration: number;
    userInfo: UserInfo | null;
  }
  | undefined
>;

type SetPersonaScheduleOptions = {
  store: boolean;
};
export type PersonaScheduleSetter = (
  personaId: Persona['id'],
  scheduleId: string | null,
  userInfo: UserInfo | null,
  options?: SetPersonaScheduleOptions
) => void;

function usePersonaSchedules() {
  const PERSONA_SCHEDULE_KEY = 'tiler-persona-schedule' as const;
  function getStoredSchedules(): PersonaSchedule {
    const storedSchedules: PersonaSchedule = JSON.parse(
      localStorage.getItem(PERSONA_SCHEDULE_KEY) || '{}'
    );
    for (const personaId in storedSchedules) {
      const schedule = storedSchedules[personaId]!;
      if (schedule.scheduleExpiration < TimeUtil.now()) {
        delete storedSchedules[personaId];
      }
    }
    return storedSchedules;
  }

  const [personaSchedules, setPersonaSchedules] = useState<PersonaSchedule>({});
  useEffect(() => {
    const storedSchedules = getStoredSchedules();
    setPersonaSchedules(storedSchedules);
  }, []);

  const setPersonaSchedule: PersonaScheduleSetter = (
    personaId: Persona['id'],
    scheduleId: string | null,
    userInfo: UserInfo | null,
    options = { store: true }
  ) => {
    if (scheduleId === null) {
      const newSchedules = { ...personaSchedules };
      delete newSchedules[personaId];
      setPersonaSchedules(newSchedules);
      if (options.store) {
        localStorage.setItem(PERSONA_SCHEDULE_KEY, JSON.stringify(newSchedules));
      }
    } else {
      const scheduleExpiration = TimeUtil.now() + TimeUtil.inMilliseconds(1, 'd');
      const newSchedules = {
        ...personaSchedules,
        [personaId]: {
          scheduleId,
          scheduleExpiration,
          userInfo: userInfo ? { ...userInfo } : null, // Store a copy of userInfo
        },
      };
      setPersonaSchedules(newSchedules);
      if (options.store) {
        localStorage.setItem(PERSONA_SCHEDULE_KEY, JSON.stringify(newSchedules));
      }
    }
  };

  return { personaSchedules, setPersonaSchedule };
}

export default usePersonaSchedules;
