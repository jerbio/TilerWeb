import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { logConversion } from './debugLog';
import type { ConversionEvent } from './types';

const baseEvent = (): ConversionEvent => ({
	eventId: '01JR7K2M8QX4',
	stage: 'signup_verified',
	occurredAt: '2026-08-20T00:00:00.000Z',
	anonymousId: 'anon-1',
	sessionId: 'sess-1',
	userId: 'TilerUser@@1',
	emailSha256: 'abc123',
	firstTouch: null,
	lastTouch: null,
	page: { path: '/signup', referrer: '', title: 'Tiler' },
	consent: { mode: 'bypass', grantedBy: 'config', analytics: true, marketing: true },
});

const lines = () => [
	{ destination: 'ga4' as const, event: 'sign_up', status: 'sent' as const },
	{ destination: 'meta' as const, event: 'CompleteRegistration', status: 'sent' as const },
];

let group: ReturnType<typeof vi.spyOn>;
let log: ReturnType<typeof vi.spyOn>;
let groupEnd: ReturnType<typeof vi.spyOn>;

const allOutput = () =>
	[...group.mock.calls, ...log.mock.calls].map((call) => JSON.stringify(call)).join('\n');

beforeEach(() => {
	group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
	log = vi.spyOn(console, 'log').mockImplementation(() => {});
	groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('logConversion', () => {
	it('emits nothing when the level is off', () => {
		logConversion(baseEvent(), lines(), 'off');

		expect(group).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('emits a header and one line per destination at summary level', () => {
		logConversion(baseEvent(), lines(), 'summary');

		expect(group).toHaveBeenCalledTimes(1);
		expect(groupEnd).toHaveBeenCalledTimes(1);
		expect(allOutput()).toContain('signup_verified');
		expect(allOutput()).toContain('ga4');
		expect(allOutput()).toContain('meta');
	});

	it('omits the envelope at summary level', () => {
		logConversion(baseEvent(), lines(), 'summary');
		expect(allOutput()).not.toContain('anonymousId');
	});

	it('includes the envelope at verbose level', () => {
		logConversion(baseEvent(), lines(), 'verbose');
		expect(allOutput()).toContain('anonymousId');
		expect(allOutput()).toContain('consent');
	});

	it('prefixes every record so it can be grepped out of an exported console log', () => {
		logConversion(baseEvent(), lines(), 'verbose');
		expect(group.mock.calls[0]?.join(' ')).toContain('[CVN]');
	});

	it('puts the eventId on the header and on every destination line', () => {
		logConversion(baseEvent(), lines(), 'summary');

		expect(group.mock.calls[0]?.join(' ')).toContain('01JR7K2M8QX4');
		for (const call of log.mock.calls) {
			expect(call.join(' ')).toContain('01JR7K2M8QX4');
		}
	});

	it('reports the status of every destination, including skips', () => {
		logConversion(
			baseEvent(),
			[
				{ destination: 'reddit', event: 'SignUp', status: 'skipped:not-configured' },
				{ destination: 'x', event: 'signup', status: 'skipped:no-consent' },
				{ destination: 'server', event: 'POST', status: 'queued' },
			],
			'summary'
		);

		const output = allOutput();
		expect(output).toContain('skipped:not-configured');
		expect(output).toContain('skipped:no-consent');
		expect(output).toContain('queued');
	});

	it('never prints a raw email address', () => {
		const event = { ...baseEvent(), email: 'someone@example.com' } as ConversionEvent;

		logConversion(event, lines(), 'verbose');

		expect(allOutput()).not.toContain('someone@example.com');
		expect(allOutput()).toContain('abc123');
	});

	it('does not throw when the console is unavailable mid-log', () => {
		log.mockImplementation(() => {
			throw new Error('console gone');
		});

		expect(() => logConversion(baseEvent(), lines(), 'verbose')).not.toThrow();
	});
});
