import { describe, expect, it, vi } from 'vitest';
import { createDestinationRegistry } from './registry';
import type { ConversionDestination } from './types';
import type { ConsentSnapshot, ConversionEvent } from '../types';

const event = (stage: ConversionEvent['stage'] = 'signup_verified'): ConversionEvent => ({
	eventId: 'evt-1',
	stage,
	occurredAt: '2026-08-20T00:00:00.000Z',
	anonymousId: 'anon-1',
	sessionId: 'sess-1',
	firstTouch: null,
	lastTouch: null,
	page: { path: '/signup', referrer: '', title: 'Tiler' },
	consent: { mode: 'bypass', grantedBy: 'config', analytics: true, marketing: true },
});

const granted: ConsentSnapshot = {
	mode: 'bypass',
	grantedBy: 'config',
	analytics: true,
	marketing: true,
};

const deniedMarketing: ConsentSnapshot = {
	mode: 'enforce',
	grantedBy: 'user',
	analytics: true,
	marketing: false,
};

const fake = (overrides: Partial<ConversionDestination> = {}): ConversionDestination => ({
	id: 'meta',
	consentCategory: 'marketing',
	isConfigured: () => true,
	load: vi.fn(),
	send: vi.fn().mockReturnValue('sent'),
	...overrides,
});

describe('createDestinationRegistry', () => {
	it('dispatches to a configured, consented destination', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		const lines = registry.dispatch(event(), granted);

		expect(meta.load).toHaveBeenCalledTimes(1);
		expect(meta.send).toHaveBeenCalledWith(expect.anything(), 'CompleteRegistration');
		expect(lines).toEqual([
			{ destination: 'meta', event: 'CompleteRegistration', status: 'sent' },
		]);
	});

	it('produces no line at all for a stage the destination does not map', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		const lines = registry.dispatch(event('demo_started'), granted);

		expect(lines).toEqual([]);
		expect(meta.send).not.toHaveBeenCalled();
		expect(meta.load).not.toHaveBeenCalled();
	});

	it('reports an unconfigured destination instead of silently doing nothing', () => {
		const meta = fake({ isConfigured: () => false });
		const registry = createDestinationRegistry([meta]);

		expect(registry.dispatch(event(), granted)).toEqual([
			{
				destination: 'meta',
				event: 'CompleteRegistration',
				status: 'skipped:not-configured',
			},
		]);
		expect(meta.load).not.toHaveBeenCalled();
	});

	it('never loads a pixel whose consent category is denied', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		expect(registry.dispatch(event(), deniedMarketing)).toEqual([
			{ destination: 'meta', event: 'CompleteRegistration', status: 'skipped:no-consent' },
		]);
		expect(meta.load).not.toHaveBeenCalled();
		expect(meta.send).not.toHaveBeenCalled();
	});

	it('honours the analytics category independently of marketing', () => {
		const ga4 = fake({ id: 'ga4', consentCategory: 'analytics' });
		const registry = createDestinationRegistry([ga4]);

		const lines = registry.dispatch(event(), deniedMarketing);

		expect(lines[0]?.status).toBe('sent');
	});

	it('loads each destination only once across repeated dispatches', () => {
		const meta = fake();
		const registry = createDestinationRegistry([meta]);

		registry.dispatch(event(), granted);
		registry.dispatch(event(), granted);

		expect(meta.load).toHaveBeenCalledTimes(1);
		expect(meta.send).toHaveBeenCalledTimes(2);
	});

	it('isolates a throwing destination so the rest still receive the event', () => {
		const broken = fake({
			id: 'meta',
			send: vi.fn().mockImplementation(() => {
				throw new Error('pixel blew up');
			}),
		});
		const healthy = fake({ id: 'reddit' });
		const registry = createDestinationRegistry([broken, healthy]);

		const lines = registry.dispatch(event(), granted);

		expect(lines).toContainEqual({
			destination: 'meta',
			event: 'CompleteRegistration',
			status: 'error',
		});
		expect(lines).toContainEqual({ destination: 'reddit', event: 'SignUp', status: 'sent' });
		expect(healthy.send).toHaveBeenCalledTimes(1);
	});

	it('isolates a destination that throws during load', () => {
		const broken = fake({
			load: vi.fn().mockImplementation(() => {
				throw new Error('script injection failed');
			}),
		});
		const registry = createDestinationRegistry([broken]);

		expect(() => registry.dispatch(event(), granted)).not.toThrow();
		expect(registry.dispatch(event(), granted)[0]?.status).toBe('error');
	});
});
