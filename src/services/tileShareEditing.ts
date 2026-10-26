import {
	TileShareCluster,
	TileShareTemplate,
	UpdateClusterParams,
	UpdateTileletteParams,
} from '@/core/common/types/tileshare';
import {
	TileShareEditValues,
	tileShareNameProblem,
	tiletteEditPatch,
} from '@/core/util/tileshareEdit';

type Writer = {
	updateTilette: (params: UpdateTileletteParams) => Promise<unknown>;
	updateCluster: (params: UpdateClusterParams) => Promise<unknown>;
};

export class ShareDeadlineUpdateError extends Error {
	constructor() {
		super('The tilette was saved, but the share deadline could not be updated.');
	}
}

/** One edit session remembers successful steps, so retrying a partial save only sends the rest. */
export class TiletteEditSession {
	private task: TileShareTemplate;
	private share: TileShareCluster;
	constructor(
		task: TileShareTemplate,
		share: TileShareCluster,
		private writer: Writer
	) {
		this.task = { ...task };
		this.share = { ...share };
	}
	async save(values: TileShareEditValues) {
		if (tileShareNameProblem(values.name) || !Number.isFinite(values.dueDate))
			throw new Error('Invalid tilette details');
		if (this.task.start != null && values.dueDate < this.task.start)
			throw new Error('Deadline precedes the tilette start');
		const patch = tiletteEditPatch(this.task, this.share.end, values);
		if (patch.Name !== undefined || patch.EndTime !== undefined) {
			await this.writer.updateTilette(patch);
			this.task = {
				...this.task,
				name: values.name.trim(),
				...(patch.EndTime !== undefined ? { end: patch.EndTime } : {}),
			};
		}
		if (values.moveShareDeadline && this.share.end != null && values.dueDate > this.share.end) {
			if (!this.share.id) throw new ShareDeadlineUpdateError();
			try {
				await this.writer.updateCluster({
					Id: this.share.id,
					StartTime: this.share.start ?? this.share.end,
					EndTime: values.dueDate,
				});
				this.share = { ...this.share, end: values.dueDate };
			} catch {
				throw new ShareDeadlineUpdateError();
			}
		}
	}
}
