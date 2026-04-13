import { createStore } from 'zustand';
import dayjs from 'dayjs';
import {
	CalendarEvent,
	RestrictionProfile,
	ScheduleCreateEventResponse,
} from '../../types/schedule';

type CreateTileState = {
	isOpen: boolean;
	isExpanded: boolean;
	restrictionProfile: {
		work: RestrictionProfile | null;
		personal: RestrictionProfile | null;
		loading: boolean;
	};

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

	loadRestrictionProfiles: () => void;
	loadRestrictionProfilesComplete: (
		work: RestrictionProfile | null,
		personal: RestrictionProfile | null
	) => void;
};

type EditTileState = {
	isOpen: boolean;
	event: CalendarEvent | null;
};

type EditTileActions = {
	open: (event: CalendarEvent) => void;
	close: () => void;
};

type ViewInfo = {
	startDay: dayjs.Dayjs;
	daysInView: number;
};

export type CalendarUIStore = {
	demoMode: boolean;
	createTile: {
		state: CreateTileState;
		actions: CreateTileActions;
	};
	editTile: {
		state: EditTileState;
		actions: EditTileActions;
	};
	viewInfo: ViewInfo;
	setViewInfo: (info: ViewInfo) => void;
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
			demoMode,
			createTile: {
				state: {
					isOpen: false,
					isExpanded: false,

					restrictionProfile: {
						work: null,
						personal: null,
						loading: false,
					},

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
									loading: {
										isActive: false,
										tileName: undefined,
									},
									success: {
										isOpen: false,
										isNavigatingToTile: false,
										tile: undefined,
									},
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

					loadRestrictionProfiles: guarded(() =>
						set((state) => ({
							createTile: {
								...state.createTile,
								state: {
									...state.createTile.state,
									restrictionProfile: {
										loading: true,
										work: null,
										personal: null,
									},
								},
							},
						}))
					),

					loadRestrictionProfilesComplete: guarded((work, personal) =>
						set((state) => ({
							createTile: {
								...state.createTile,
								state: {
									...state.createTile.state,
									restrictionProfile: {
										loading: false,
										work,
										personal,
									},
								},
							},
						}))
					),
				},
			},

			viewInfo: {
				startDay: dayjs().startOf('day'),
				daysInView: 7,
			},
			setViewInfo: (info: ViewInfo) => set({ viewInfo: info }),

			editTile: {
				state: {
					isOpen: false,
					event: null,
				},

				actions: {
					open: guarded((event: CalendarEvent) =>
						set((state) => ({
							editTile: {
								...state.editTile,
								state: { isOpen: true, event },
							},
						}))
					),

					close: guarded(() =>
						set((state) => ({
							editTile: {
								...state.editTile,
								state: { isOpen: false, event: null },
							},
						}))
					),
				},
			},
		};
	});
