import { describe, it, expect } from 'vitest';
import {
	activeMentionQuery,
	filterParticipants,
	mentionedUserIds,
	mentionSegments,
	toDisplayText,
	toTokenText,
} from '../mentions';

const ada = { id: 'u-ada', displayName: 'Ada Okafor', isDeleted: false };

describe('mention helpers', () => {
	it('lists each mentioned user id once, in order', () => {
		expect(mentionedUserIds('hi <@b> and <@a>, again <@b>')).toEqual(['b', 'a']);
		expect(mentionedUserIds('no tags @Ada')).toEqual([]);
	});

	it('splits text into plain and mention segments using live names', () => {
		expect(mentionSegments('Nice one, <@u-ada>. Thanks', [ada])).toEqual([
			{ type: 'text', value: 'Nice one, ' },
			{ type: 'mention', id: 'u-ada', name: 'Ada Okafor' },
			{ type: 'text', value: '. Thanks' },
		]);
	});

	it('marks mentions of deleted or unknown people with a null name', () => {
		expect(mentionSegments('<@gone>', [])).toEqual([
			{ type: 'mention', id: 'gone', name: null },
		]);
	});

	it('round-trips between stored tokens and editable display text', () => {
		const { text, selected } = toDisplayText('hi <@u-ada>!', [ada]);
		expect(text).toBe('hi @Ada Okafor!');
		expect(toTokenText(text, selected)).toBe('hi <@u-ada>!');
	});

	it('leaves a mention as plain text once its name is edited', () => {
		expect(toTokenText('hi @Ada Oka', [{ id: 'u-ada', displayName: 'Ada Okafor' }])).toBe(
			'hi @Ada Oka'
		);
	});

	it('prefers the longest matching name', () => {
		const selected = [
			{ id: 'a', displayName: 'Ada' },
			{ id: 'b', displayName: 'Ada Okafor' },
		];
		expect(toTokenText('@Ada Okafor and @Ada', selected)).toBe('<@b> and <@a>');
	});

	it('finds the active @query before the caret', () => {
		expect(activeMentionQuery('hello @Ad', 9)).toEqual({ start: 6, query: 'Ad' });
		expect(activeMentionQuery('@', 1)).toEqual({ start: 0, query: '' });
		expect(activeMentionQuery('mail me@x', 9)).toBeNull();
		expect(activeMentionQuery('hi @Ada\nnext', 12)).toBeNull();
	});

	it('filters participants by name and leaves out the viewer', () => {
		const people = [
			{ id: 'me', displayName: 'Tunde Adebayo', isViewer: true },
			{ id: 'u-ada', displayName: 'Ada Okafor', isViewer: false },
			{ id: 'u-kemi', displayName: 'Kemi Balogun', isViewer: false },
		];
		expect(filterParticipants(people, 'ad').map((p) => p.id)).toEqual(['u-ada']);
		expect(filterParticipants(people, '').map((p) => p.id)).toEqual(['u-ada', 'u-kemi']);
	});
});
