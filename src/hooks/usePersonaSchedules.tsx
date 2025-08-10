import { useState, useEffect } from 'react';
import { Persona } from '../types/persona';
import TimeUtil from '../util/helpers/time';

export type PersonaSchedule = Record<
  Persona['id'],
  | {
    scheduleId: string;
    scheduleExpiration: number;
  }
  | undefined
>;

type SetPersonaScheduleOptions = {
  store: boolean;
};
export type PersonaScheduleSetter = (
  personaId: Persona['id'],
  scheduleId: string | null,
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
        // Remove expired schedules
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

  function setPersonaSchedule(
    personaId: Persona['id'],
    scheduleId: string | null,
    options: SetPersonaScheduleOptions = { store: true }
  ) {
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
        },
      };
      setPersonaSchedules(newSchedules);
      if (options.store) {
        localStorage.setItem(PERSONA_SCHEDULE_KEY, JSON.stringify(newSchedules));
      }
    }
  }

  return { personaSchedules, setPersonaSchedule };
}

export default usePersonaSchedules;
