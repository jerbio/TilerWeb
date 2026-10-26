import type { CreatedScheduleEvent } from '@/core/common/types/schedule';

export const INVALID_EVENT_RESPONSE =
	'Tiler returned an unexpected response while creating your tile or block. Check your schedule before trying again.';

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		Math.abs(value) <= 8640000000000000
	);
}

/** Validate at the network boundary before response data can enter UI state. */
export function parseCreatedScheduleEvent(response: unknown): CreatedScheduleEvent {
	if (!isObject(response) || !isObject(response.Error)) {
		throw new Error(INVALID_EVENT_RESPONSE);
	}
	const { Code, Message } = response.Error;
	if (typeof Code !== 'string' && typeof Code !== 'number') {
		throw new Error(INVALID_EVENT_RESPONSE);
	}
	if (Code !== '0' && Code !== 0) {
		throw new Error(isText(Message) ? Message : 'Tiler could not create your tile or block.');
	}
	const content = response.Content;
	const event = isObject(content) && 'tilerEvent' in content ? content.tilerEvent : content;
	if (
		!isObject(event) ||
		!isText(event.id) ||
		!isText(event.name) ||
		!isTimestamp(event.start) ||
		!isTimestamp(event.end) ||
		event.end < event.start
	) {
		throw new Error(INVALID_EVENT_RESPONSE);
	}
	if (
		event.calendarEvent != null &&
		(!isObject(event.calendarEvent) || !isText(event.calendarEvent.id))
	) {
		throw new Error(INVALID_EVENT_RESPONSE);
	}
	return event as CreatedScheduleEvent;
}
