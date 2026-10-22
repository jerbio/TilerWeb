import { describe, expect, it } from 'vitest';
import { INVALID_EVENT_RESPONSE, parseCreatedScheduleEvent } from '../scheduleEventResponse';

const event = { id: 'created-1', name: 'Plan the week', start: 1792544400000, end: 1792548000000 };
const ok = (Content: unknown) => ({ Error: { Code: '0', Message: 'Success' }, Content });

describe('event creation response contract', () => {
	it.each([false, true])(
		'unwraps the current response (rigid=%s), allowing new metadata',
		(isRigid) => {
			const created = { ...event, isRigid };
			expect(
				parseCreatedScheduleEvent(
					ok({
						tilerEvent: created,
						subEvents: [],
						responseTimeline: { start: 0, end: 1 },
						idempotencyKey: 'request-1',
						futureField: true,
					})
				)
			).toBe(created);
		}
	);

	it('keeps supporting legacy event responses and numeric success codes', () => {
		const created = { ...event, calendarEvent: { id: 'parent', name: event.name } };
		expect(parseCreatedScheduleEvent({ ...ok(created), Error: { Code: 0 } })).toBe(created);
	});

	it.each([null, undefined])('allows an omitted or null parent (%s)', (calendarEvent) => {
		expect(parseCreatedScheduleEvent(ok({ ...event, calendarEvent })).id).toBe(event.id);
	});

	it.each([
		null,
		[],
		{},
		{ Error: null },
		{ Error: [] },
		{ Error: { Code: null } },
		{ Error: { Code: false } },
		{ Content: event },
		ok(null),
		ok([]),
		ok('success'),
		ok({ tilerEvent: null }),
		ok({ tilerEvent: [] }),
		ok({ subEvents: [event] }),
		ok({ tilerEvent: null, ...event }),
		ok({ ...event, id: '' }),
		ok({ ...event, name: {} }),
		ok({ ...event, start: '1792544400000' }),
		ok({ ...event, end: NaN }),
		ok({ ...event, end: event.start - 1 }),
		ok({ ...event, start: 8640000000000001 }),
		ok({ ...event, calendarEvent: [] }),
		ok({ ...event, calendarEvent: {} }),
	])('rejects incompatible payload %# with a useful error', (response) => {
		expect(() => parseCreatedScheduleEvent(response)).toThrow(INVALID_EVENT_RESPONSE);
	});

	it('surfaces API rejections even when HTTP was successful', () => {
		expect(() =>
			parseCreatedScheduleEvent({
				...ok(event),
				Error: { Code: '42', Message: 'This schedule is locked.' },
			})
		).toThrow('This schedule is locked.');
	});
});
