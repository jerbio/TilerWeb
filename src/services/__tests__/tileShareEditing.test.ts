import { describe, expect, it, vi } from 'vitest';
import { ShareDeadlineUpdateError, TiletteEditSession } from '../tileShareEditing';
import { TileShareCluster, TileShareTemplate } from '@/core/common/types/tileshare';

const task = {
	id: 'task',
	name: 'Write brief',
	end: 2000,
	start: 0,
	duration: 3600000,
} as TileShareTemplate;
const share = { id: 'share', end: 3000, start: 0 } as TileShareCluster;
const values = { name: 'Write brief', description: 'not sent', dueDate: 2000 };
function setup(t = task, s = share) {
	const writer = {
		updateTilette: vi.fn().mockResolvedValue({}),
		updateCluster: vi.fn().mockResolvedValue({}),
	};
	return { writer, session: new TiletteEditSession(t, s, writer) };
}
describe('tilette edit saves', () => {
	it('does not write unchanged details or materialize an inherited deadline', async () => {
		const { session, writer } = setup({ ...task, end: null });
		await session.save({ ...values, dueDate: share.end! });
		expect(writer.updateTilette).not.toHaveBeenCalled();
		expect(writer.updateCluster).not.toHaveBeenCalled();
	});
	it('renames without sending a timeline, notes or duration', async () => {
		const { session, writer } = setup();
		await session.save({ ...values, name: 'New brief' });
		expect(writer.updateTilette).toHaveBeenCalledExactlyOnceWith({
			Id: 'task',
			Name: 'New brief',
		});
	});
	it('changes only the deadline, without forcing a share extension', async () => {
		const { session, writer } = setup();
		await session.save({ ...values, dueDate: 4000 });
		expect(writer.updateTilette).toHaveBeenCalledExactlyOnceWith({ Id: 'task', EndTime: 4000 });
		expect(writer.updateCluster).not.toHaveBeenCalled();
	});
	it('updates a later share deadline only when explicitly requested and preserves a zero start', async () => {
		const { session, writer } = setup({ ...task, end: 4000 });
		await session.save({ ...values, dueDate: 4000, moveShareDeadline: true });
		expect(writer.updateTilette).not.toHaveBeenCalled();
		expect(writer.updateCluster).toHaveBeenCalledExactlyOnceWith({
			Id: 'share',
			StartTime: 0,
			EndTime: 4000,
		});
	});
	it('retries only the share update after the tilette has already saved', async () => {
		const { session, writer } = setup();
		writer.updateCluster.mockRejectedValueOnce(new Error('offline'));
		const changed = { ...values, name: 'New brief', dueDate: 4000, moveShareDeadline: true };
		await expect(session.save(changed)).rejects.toBeInstanceOf(ShareDeadlineUpdateError);
		await session.save(changed);
		expect(writer.updateTilette).toHaveBeenCalledTimes(1);
		expect(writer.updateCluster).toHaveBeenCalledTimes(2);
	});
	it('does not update the share when the tilette save fails', async () => {
		const { session, writer } = setup();
		writer.updateTilette.mockRejectedValueOnce(new Error('offline'));
		const changed = { ...values, dueDate: 4000, moveShareDeadline: true };
		await expect(session.save(changed)).rejects.toThrow('offline');
		expect(writer.updateCluster).not.toHaveBeenCalled();
		await session.save(changed);
		expect(writer.updateTilette).toHaveBeenCalledTimes(2);
	});
	it('blocks invalid names and deadlines before the stored start', async () => {
		const { session, writer } = setup();
		await expect(session.save({ ...values, name: 'ab' })).rejects.toThrow();
		await expect(session.save({ ...values, dueDate: -1 })).rejects.toThrow();
		expect(writer.updateTilette).not.toHaveBeenCalled();
	});
});
