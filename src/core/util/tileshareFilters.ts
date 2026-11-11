import type { ClusterPageParams } from '@/core/common/types/tileshare';

export const deadlineOptions = {
	all: 'Any deadline',
	overdue: 'Overdue',
	today: 'Today',
	next7Days: 'Next 7 days',
	custom: 'Custom range',
	noDeadline: 'No deadline',
} as const;

export type DeadlineOption = keyof typeof deadlineOptions;

function parseLocalDate(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00`);
	if (!Number.isFinite(date.getTime())) return null;
	const [year, month, day] = value.split('-').map(Number);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
		? date
		: null;
}

/** Convert local calendar days to UTC bounds; advance calendar days to respect DST. */
export function deadlineParams(
	option: DeadlineOption,
	from: string,
	to: string,
	now = new Date()
): ClusterPageParams | null {
	if (option === 'all') return {};
	if (option === 'overdue') return { deadlineFilter: 'Overdue' };
	if (option === 'noDeadline') return { deadlineFilter: 'NoDeadline' };
	if (option === 'custom') {
		const start = from ? parseLocalDate(from) : null;
		const end = to ? parseLocalDate(to) : null;
		if ((!from && !to) || (from && !start) || (to && !end) || (start && end && start > end))
			return null;
		end?.setDate(end.getDate() + 1);
		return {
			deadlineFilter: 'Range',
			deadlineFrom: start?.getTime(),
			deadlineBefore: end?.getTime(),
		};
	}
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + (option === 'today' ? 1 : 7));
	return {
		deadlineFilter: 'Range',
		deadlineFrom: start.getTime(),
		deadlineBefore: end.getTime(),
	};
}

import {
	ContactModel,
	DesignatedUser,
	InvitationStatus,
	TileletteStatus,
	TileShareTemplate,
} from '@/core/common/types/tileshare';
import { assignmentContact } from './classShareParticipants';
import { contactKeys } from './tileshareMode';
import { validDesignatedUsers } from './tileshareAssignees';
import {
	deriveAssignmentStatus,
	deriveMyTileletteStatus,
	deriveTileletteStatus,
} from './tileshareProgress';

export const responseFilters = ['none', 'tentative', 'accepted', 'declined', 'unknown'] as const;
export const dueFilters = ['any', 'overdue', 'today', 'week', 'custom', 'none'] as const;
export type ShareFilters = {
	statuses: TileletteStatus[];
	responses: (typeof responseFilters)[number][];
	people: string[];
	query: string;
	due: (typeof dueFilters)[number];
	from: string;
	to: string;
};
export type FilterEnvironment = {
	now: number;
	timeZone: string;
	locale?: string;
	people: ContactModel[];
};
export const emptyShareFilters = (): ShareFilters => ({
	statuses: [],
	responses: [],
	people: [],
	query: '',
	due: 'any',
	from: '',
	to: '',
});
const dateOnly = (value: unknown): value is string =>
	typeof value === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	Number.isFinite(new Date(`${value}T12:00:00Z`).valueOf()) &&
	new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
export function parseShareFilters(value: unknown): ShareFilters {
	const defaults = emptyShareFilters();
	if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
	const input = value as Record<string, unknown>;
	const strings = (field: string) =>
		Array.isArray(input[field])
			? [...new Set(input[field].filter((v): v is string => typeof v === 'string'))]
			: [];
	return {
		statuses: strings('statuses').filter((v): v is TileletteStatus =>
			Object.values(TileletteStatus).includes(v as TileletteStatus)
		),
		responses: strings('responses').filter((v): v is ShareFilters['responses'][number] =>
			responseFilters.includes(v as ShareFilters['responses'][number])
		),
		people: strings('people').filter((v) => /^(id|email|phone):/.test(v)),
		query: typeof input.query === 'string' ? input.query : '',
		due: dueFilters.includes(input.due as ShareFilters['due'])
			? (input.due as ShareFilters['due'])
			: 'any',
		from: dateOnly(input.from) ? input.from : '',
		to: dateOnly(input.to) ? input.to : '',
	};
}
export function hasShareFilters(filters: ShareFilters) {
	return !!(
		filters.statuses.length ||
		filters.responses.length ||
		filters.people.length ||
		filters.query.trim() ||
		filters.due !== 'any'
	);
}
export function responseOf(assignment: DesignatedUser): ShareFilters['responses'][number] {
	if (assignment.rsvpStatus === InvitationStatus.Pending) return 'none';
	return responseFilters.includes(assignment.rsvpStatus as ShareFilters['responses'][number])
		? (assignment.rsvpStatus as ShareFilters['responses'][number])
		: 'unknown';
}
export function filterTimeZone(zone?: string | null): string {
	try {
		if (zone) {
			new Intl.DateTimeFormat('en', { timeZone: zone });
			return zone;
		}
	} catch {
		/* Use the browser's zone for invalid account values. */
	}
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
export function localDate(epoch: number, timeZone: string): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(epoch);
	return ['year', 'month', 'day']
		.map((type) => parts.find((p) => p.type === type)!.value)
		.join('-');
}
export function selectedPerson(
	person: ContactModel,
	filters: ShareFilters,
	env: FilterEnvironment
): boolean {
	if (!filters.people.length) return true;
	const keys = contactKeys(person);
	return filters.people.some(
		(key) =>
			keys.includes(key) ||
			env.people.some(
				(known) =>
					contactKeys(known).includes(key) &&
					contactKeys(known).some((alias) => keys.includes(alias))
			)
	);
}
function matchesContent(
	tilette: TileShareTemplate,
	status: TileletteStatus,
	filters: ShareFilters,
	env: FilterEnvironment
): boolean {
	if (filters.statuses.length && !filters.statuses.includes(status)) return false;
	if (
		!(tilette.name ?? '')
			.toLocaleLowerCase(env.locale)
			.includes(filters.query.trim().toLocaleLowerCase(env.locale))
	)
		return false;
	if (filters.due === 'any') return true;
	const deadline = tilette.end;
	const valid =
		deadline != null &&
		Number.isFinite(deadline) &&
		Number.isFinite(new Date(deadline).valueOf());
	if (filters.due === 'none') return !valid;
	if (!valid) return false;
	if (filters.due === 'overdue')
		return deadline < env.now && status !== TileletteStatus.Completed;
	const day = localDate(deadline, env.timeZone);
	const today = localDate(env.now, env.timeZone);
	if (filters.due === 'today') return day === today;
	if (filters.due === 'week') {
		const end = new Date(`${today}T12:00:00Z`);
		end.setUTCDate(end.getUTCDate() + 6);
		return day >= today && day <= end.toISOString().slice(0, 10);
	}
	return (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to);
}
export function matchesAssignment(
	tilette: TileShareTemplate,
	assignment: DesignatedUser,
	filters: ShareFilters,
	env: FilterEnvironment
): boolean {
	return (
		matchesContent(tilette, deriveAssignmentStatus(assignment), filters, env) &&
		selectedPerson(assignmentContact(assignment), filters, env) &&
		(!filters.responses.length || filters.responses.includes(responseOf(assignment)))
	);
}
export function matchesTilette(
	tilette: TileShareTemplate,
	filters: ShareFilters,
	env: FilterEnvironment,
	viewerId?: string
): boolean {
	const assignments = validDesignatedUsers(tilette.designatedUsers).filter(
		(a) => !viewerId || a.userId === viewerId
	);
	if (viewerId && !assignments.length) return false;
	if (
		!matchesContent(
			tilette,
			viewerId ? deriveMyTileletteStatus(tilette, viewerId) : deriveTileletteStatus(tilette),
			filters,
			env
		)
	)
		return false;
	if (!filters.people.length && !filters.responses.length) return true;
	return assignments.some(
		(a) =>
			selectedPerson(assignmentContact(a), filters, env) &&
			(!filters.responses.length || filters.responses.includes(responseOf(a)))
	);
}
export function matchesEmptyParticipant(
	person: ContactModel,
	filters: ShareFilters,
	env: FilterEnvironment
): boolean {
	return (
		selectedPerson(person, filters, env) &&
		(!filters.statuses.length || filters.statuses.includes(TileletteStatus.Unassigned)) &&
		!filters.responses.length &&
		!filters.query.trim() &&
		filters.due === 'any'
	);
}
