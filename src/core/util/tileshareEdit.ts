import dayjs from 'dayjs';
import {
	InvitationStatus,
	TileShareTemplate,
	UpdateTileletteParams,
} from '@/core/common/types/tileshare';
import { validDesignatedUsers } from './tileshareAssignees';

export type TileShareEditValues = {
	name: string;
	description: string;
	dueDate: number;
	moveShareDeadline?: boolean;
};

export const tileShareNameProblem = (name: string): 'required' | 'short' | 'long' | null => {
	const length = name.trim().length;
	return length === 0 ? 'required' : length < 3 ? 'short' : length > 100 ? 'long' : null;
};

/** Preserve the exact stored instant on a rename, including seconds and milliseconds. */
export function editedDeadline(date: string, time: string, seed: number | null): number | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
	if (
		seed !== null &&
		dayjs(seed).format('YYYY-MM-DD') === date &&
		dayjs(seed).format('HH:mm') === time
	)
		return seed;
	const parsed = new Date(`${date}T${time}:00`);
	if (
		!Number.isFinite(parsed.getTime()) ||
		dayjs(parsed).format('YYYY-MM-DDTHH:mm') !== `${date}T${time}`
	)
		return null;
	return parsed.getTime();
}

export function tiletteEditPatch(
	task: TileShareTemplate,
	shareDeadline: number | null,
	values: TileShareEditValues
): UpdateTileletteParams {
	if (!task.id) throw new Error('Missing tilette id');
	return {
		Id: task.id,
		...(values.name.trim() !== (task.name ?? '').trim() ? { Name: values.name.trim() } : {}),
		...(values.dueDate !== (task.end ?? shareDeadline) ? { EndTime: values.dueDate } : {}),
	};
}

/** Count tasks, rather than assignments; missing deadlines inherit the share's deadline. */
export function tilettesDueAfter(tasks: TileShareTemplate[], deadline: number) {
	let accepted = 0;
	let notAccepted = 0;
	for (const task of tasks) {
		if (task.end == null || task.end <= deadline) continue;
		if (
			validDesignatedUsers(task.designatedUsers).some(
				(user) => user.rsvpStatus === InvitationStatus.Accepted
			)
		)
			accepted++;
		else notAccepted++;
	}
	return { accepted, notAccepted };
}
