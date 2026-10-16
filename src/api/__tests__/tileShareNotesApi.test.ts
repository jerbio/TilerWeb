import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TileShareNotesApi } from '../tileShareNotesApi';

vi.mock('@/config/config_getter', () => ({ Env: { get: () => 'https://test.example.com/' } }));
const fetchSpy = vi.spyOn(globalThis, 'fetch');
const response = (content: Record<string, unknown>) =>
	new Response(JSON.stringify({ Error: null, Content: content }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});

describe('TileShareNotesApi', () => {
	it('retrieves share-level notes using the cluster endpoint rather than a tilette id', async () => {
		fetchSpy.mockResolvedValue(
			response({ Id: 'Cluster+one', UserNote: '**Share note**', Etag: 'cluster-token' })
		);
		const result = await new TileShareNotesApi('cluster').getNotes('Cluster+one');
		const [url] = fetchSpy.mock.calls[0];
		expect(url instanceof Request ? url.url : String(url)).toBe(
			'https://test.example.com/api/TileShareCluster/Notes?Id=Cluster%2Bone'
		);
		expect(result.Content).toMatchObject({
			UserNote: '**Share note**',
			Etag: 'cluster-token',
			Scope: 'cluster',
		});
	});
	beforeEach(() => fetchSpy.mockReset());
	it('uses mobile’s notes route and encodes the tilette Id including plus signs', async () => {
		fetchSpy.mockResolvedValue(
			response({ Id: 'Tile+one+two', UserNote: '**Saved**', Etag: 'opaque+token==' })
		);
		const result = await new TileShareNotesApi().getNotes('Tile+one+two');
		const [url, options] = fetchSpy.mock.calls[0];
		expect(url instanceof Request ? url.url : String(url)).toBe(
			'https://test.example.com/api/TileshareTemplate/Notes?Id=Tile%2Bone%2Btwo'
		);
		expect(url instanceof Request ? url.cache : options?.cache).toBe('no-store');
		expect(result.Content).toMatchObject({
			EventId: 'Tile+one+two',
			UserNote: '**Saved**',
			Etag: 'opaque+token==',
		});
	});
	it('saves raw Markdown with the exact token and no calendar EventID or Scope', async () => {
		fetchSpy.mockResolvedValue(
			response({ Id: 'task', UserNote: '    code();\n', Etag: 'next' })
		);
		await new TileShareNotesApi().updateNotes({
			EventID: 'task',
			Scope: 'auto',
			UserNote: '    code();\n',
			Etag: 'opaque+token==',
		});
		const [url, options] = fetchSpy.mock.calls[0];
		expect(url instanceof Request ? url.url : String(url)).toBe(
			'https://test.example.com/api/TileshareTemplate/Notes'
		);
		expect(url instanceof Request ? url.method : options?.method).toBe('PUT');
		expect(
			url instanceof Request ? await url.clone().json() : JSON.parse(options?.body as string)
		).toEqual({
			Id: 'task',
			UserNote: '    code();\n',
			Etag: 'opaque+token==',
		});
	});
	it('accepts camelCase notes and exposes conflict tokens without treating them as success', async () => {
		fetchSpy.mockResolvedValue(
			response({ id: 'task', userNote: 'Latest', etag: 'fresh', concurrencyConflict: true })
		);
		const result = await new TileShareNotesApi().getNotes('task');
		expect(result.Content).toMatchObject({
			UserNote: 'Latest',
			Etag: 'fresh',
			concurrencyConflict: true,
		});
	});
	it('rejects a missing token rather than allowing an unprotected save', async () => {
		fetchSpy.mockResolvedValue(response({ Id: 'task', UserNote: 'Saved' }));
		await expect(new TileShareNotesApi().getNotes('task')).rejects.toThrow('missing Etag');
	});
});
