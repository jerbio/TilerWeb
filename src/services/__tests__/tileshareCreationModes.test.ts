import { describe, expect, it } from 'vitest';
import { toCreateClusterParams } from '../tileshareService';
import {
	TileshareMode,
	TileshareFormState,
	TiletteDraft,
	TileShareCluster,
} from '@/core/common/types/tileshare';
import {
	parseTileshareMode,
	tileshareMode,
	emptyTileshareLocation,
} from '@/core/util/tileshareMode';

const context = { userName: 'owner', timeZone: 'UTC', timeZoneOffset: 0, defaultCallingCode: '1' };
const draft = (patch: Partial<TiletteDraft> = {}): TiletteDraft => ({
	id: 'local',
	name: 'Review',
	durationMinutes: '30',
	deadline: '',
	note: 'Read first',
	recipients: [],
	location: emptyTileshareLocation(),
	...patch,
});
const form = (patch: Partial<TileshareFormState> = {}): TileshareFormState => ({
	name: 'Training',
	deadline: '2026-12-01',
	location: '123 Main Street',
	locationDescription: 'Office',
	locationIsVerified: true,
	note: '',
	recipients: ['alice@example.com', '3035551212'],
	...patch,
});

describe('TileShare modes and creation', () => {
	it.each(Object.values(TileshareMode))('preserves Markdown whitespace in %s notes', (mode) => {
		const note = '    code();\n\n**Next step**\n';
		const result = toCreateClusterParams(
			form({ note, tilettes: [draft({ note })] }),
			mode,
			context
		);
		expect(result.Notes).toBe(note);
		expect(result.ClusterTemplateTileModels![0].NoteMiscData).toBe(note);
	});
	it.each(Object.values(TileshareMode))(
		'sends authoritative %s mode, including for an empty share',
		(mode) => {
			const result = toCreateClusterParams(form(), mode, context);
			expect(result.Mode).toBe(mode);
			expect(result.ClusterTemplateTileModels).toHaveLength(
				mode === TileshareMode.Broadcast ? 1 : 0
			);
		}
	);
	it('does not infer a mode from legacy flags or task counts', () => {
		expect(tileshareMode({ isMultiTilette: true } as TileShareCluster)).toBeNull();
		expect(
			tileshareMode({ mode: TileshareMode.Class, isMultiTilette: false } as TileShareCluster)
		).toBe(TileshareMode.Class);
		expect(parseTileshareMode(' CLASS ')).toBe(TileshareMode.Class);
		expect(parseTileshareMode('unexpected')).toBeNull();
	});
	it('assigns every Class participant to every nested tilette, preserving order and notes', () => {
		const result = toCreateClusterParams(
			form({
				tilettes: [
					draft(),
					draft({ id: 'second', name: 'Write', recipients: ['ignored@example.com'] }),
				],
			}),
			TileshareMode.Class,
			context
		);
		const tasks = result.ClusterTemplateTileModels!;
		expect(tasks.map((task) => task.OrderedIndex)).toEqual([0, 1]);
		expect(tasks.map((task) => task.Contacts)).toEqual([result.Contacts, result.Contacts]);
		expect(tasks[0].NoteMiscData).toBe('Read first');
		expect(tasks[0].DurationInMs).toBe(1800000);
	});
	it('keeps Project assignments independent and permits unassigned tasks', () => {
		const result = toCreateClusterParams(
			form({
				recipients: [],
				tilettes: [draft(), draft({ id: 'second', recipients: ['bob@example.com'] })],
			}),
			TileshareMode.Project,
			context
		);
		expect(result.ClusterTemplateTileModels!.map((task) => task.Contacts)).toEqual([
			[],
			[{ Email: 'bob@example.com' }],
		]);
		expect(result.ClusterTemplateTileModels!.every((task) => task.IncludeMe === false)).toBe(
			true
		);
	});
	it('keeps locations independent and preserves verification and descriptions', () => {
		const result = toCreateClusterParams(
			form({
				tilettes: [
					draft({
						location: {
							address: 'Community Hall',
							description: 'Room 1',
							isVerified: true,
						},
					}),
					draft({
						id: 'custom',
						location: { address: 'Library', description: 'Room 2', isVerified: false },
					}),
					draft({ id: 'none' }),
				],
			}),
			TileshareMode.Project,
			context
		);
		expect(result.AddressData).toEqual({
			Address: '123 Main Street',
			Description: 'Office',
			AddressIsVerified: true,
		});
		expect(result.ClusterTemplateTileModels!.map((task) => task.AddressData)).toEqual([
			{ Address: 'Community Hall', Description: 'Room 1', AddressIsVerified: true },
			{ Address: 'Library', Description: 'Room 2', AddressIsVerified: false },
			undefined,
		]);
	});
	it('uses a tilette deadline override and rejects invalid draft durations before sending', () => {
		const result = toCreateClusterParams(
			form({ tilettes: [draft({ deadline: '2026-11-01' })] }),
			TileshareMode.Project,
			context
		);
		expect(result.ClusterTemplateTileModels![0].EndTime).toBeLessThan(result.EndTime!);
		expect(() =>
			toCreateClusterParams(
				form({ tilettes: [draft({ durationMinutes: '-1' })] }),
				TileshareMode.Class,
				context
			)
		).toThrow();
	});
});
