import { createStore } from 'zustand';
import { ScheduleCreateEventResponse } from '../../types/schedule';

type CreateTileState = {
  isOpen: boolean;
  isExpanded: boolean;

  loading: {
    isActive: boolean;
    tileName?: string;
  };

  success: {
    isOpen: boolean;
    isNavigatingToTile: boolean;
    tile?: ScheduleCreateEventResponse['Content'];
  };
};

type CreateTileActions = {
  open: () => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;

  startLoading: (tileName: string) => void;
  endLoading: () => void;

  showSuccess: (tile: ScheduleCreateEventResponse['Content']) => void;
  hideSuccess: () => void;

  navigateToTile: () => void;
  navigateToTileComplete: () => void;
};

export type CalendarUIStore = {
  createTile: {
    state: CreateTileState;
    actions: CreateTileActions;
  };
};

export const createCalendarUIStore = (demoMode: boolean) =>
  createStore<CalendarUIStore>((set) => {
    // DEMO MODE safeguard
    function guarded<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
      return (...args: A) => {
        if (demoMode) return;
        fn(...args);
      };
    }

    return {
      createTile: {
        state: {
          isOpen: false,
          isExpanded: false,

          loading: {
            isActive: false,
          },

          success: {
            isOpen: false,
            isNavigatingToTile: false,
          },
        },

        actions: {
          open: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: { ...state.createTile.state, isOpen: true },
              },
            }))
          ),

          close: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  isOpen: false,
                  isExpanded: false,
                },
              },
            }))
          ),

          expand: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: { ...state.createTile.state, isExpanded: true },
              },
            }))
          ),

          collapse: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: { ...state.createTile.state, isExpanded: false },
              },
            }))
          ),

          startLoading: guarded((tileName: string) =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  loading: { isActive: true, tileName },
                },
              },
            }))
          ),

          endLoading: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  loading: { isActive: false },
                },
              },
            }))
          ),

          navigateToTile: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  success: {
                    ...state.createTile.state.success,
                    isNavigatingToTile: true,
                  },
                },
              },
            }))
          ),

          navigateToTileComplete: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  success: {
                    ...state.createTile.state.success,
                    isNavigatingToTile: false,
                  },
                },
              },
            }))
          ),

          showSuccess: guarded((tile: ScheduleCreateEventResponse['Content']) =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  success: {
                    ...state.createTile.state.success,
                    isOpen: true,
                    tile,
                  },
                },
              },
            }))
          ),

          hideSuccess: guarded(() =>
            set((state) => ({
              createTile: {
                ...state.createTile,
                state: {
                  ...state.createTile.state,
                  success: { isOpen: false, isNavigatingToTile: false },
                },
              },
            }))
          ),
        },
      },
    };
  });
