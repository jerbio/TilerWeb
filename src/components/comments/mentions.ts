import { CommentParticipant, CommentPerson } from '@/core/common/types/comment';

/** Mentions are stored as `<@userId>` tokens so names are always resolved live by the server. */
const TOKEN = /<@([A-Za-z0-9_-]{1,128})>/g;
const MAX_QUERY_LENGTH = 40;
const MAX_SUGGESTIONS = 8;

export type MentionSegment =
	| { type: 'text'; value: string }
	| { type: 'mention'; id: string; name: string | null };

export type SelectedMention = { id: string; displayName: string };

/** Distinct ids tagged in token text; the server requires this list to match the tokens exactly. */
export function mentionedUserIds(text: string): string[] {
	return [...new Set(Array.from(text.matchAll(TOKEN), (m) => m[1]))];
}

export function mentionSegments(text: string, people: CommentPerson[] = []): MentionSegment[] {
	const names = new Map(people.map((p) => [p.id, p.isDeleted ? null : p.displayName]));
	const segments: MentionSegment[] = [];
	let last = 0;
	for (const match of text.matchAll(TOKEN)) {
		const index = match.index ?? 0;
		if (index > last) segments.push({ type: 'text', value: text.slice(last, index) });
		segments.push({ type: 'mention', id: match[1], name: names.get(match[1]) ?? null });
		last = index + match[0].length;
	}
	if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
	return segments;
}

/** Converts stored text to editable text; mentions of deleted people keep their raw token. */
export function toDisplayText(
	text: string,
	people: CommentPerson[] = []
): { text: string; selected: SelectedMention[] } {
	const selected: SelectedMention[] = [];
	const display = mentionSegments(text, people)
		.map((s) => {
			if (s.type === 'text') return s.value;
			if (!s.name) return `<@${s.id}>`;
			if (!selected.some((m) => m.id === s.id))
				selected.push({ id: s.id, displayName: s.name });
			return `@${s.name}`;
		})
		.join('');
	return { text: display, selected };
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replaces `@Name` for picked people with tokens; a name the user edited stays plain text. */
export function toTokenText(text: string, selected: SelectedMention[]): string {
	const byLength = [...selected].sort((a, b) => b.displayName.length - a.displayName.length);
	return byLength.reduce(
		(acc, m) =>
			acc.replace(
				new RegExp(`@${escapeRegExp(m.displayName)}(?![\\p{L}\\p{N}_])`, 'gu'),
				`<@${m.id}>`
			),
		text
	);
}

/** The `@query` being typed at the caret, or null when the caret is not inside one. */
export function activeMentionQuery(
	text: string,
	caret: number
): { start: number; query: string } | null {
	const before = text.slice(0, caret);
	const start = before.lastIndexOf('@');
	if (start < 0) return null;
	if (start > 0 && !/\s/.test(before[start - 1])) return null;
	const query = before.slice(start + 1);
	if (query.includes('\n') || query.length > MAX_QUERY_LENGTH) return null;
	return { start, query };
}

export function filterParticipants(
	people: CommentParticipant[],
	query: string
): CommentParticipant[] {
	const q = query.trim().toLowerCase();
	return people
		.filter((p) => !p.isViewer)
		.filter((p) => {
			if (!q) return true;
			const name = p.displayName.toLowerCase();
			return name.startsWith(q) || name.split(/\s+/).some((word) => word.startsWith(q));
		})
		.slice(0, MAX_SUGGESTIONS);
}
