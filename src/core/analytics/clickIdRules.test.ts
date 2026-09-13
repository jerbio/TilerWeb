import { describe, expect, it, vi, afterEach } from 'vitest';
import { DEFAULT_CLICK_ID_RULES, getClickIdRules, parseClickIdRules } from './clickIdRules';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('DEFAULT_CLICK_ID_RULES', () => {
	it('covers the networks the tracker ships with', () => {
		const params = DEFAULT_CLICK_ID_RULES.map((r) => r.param);

		expect(params).toEqual(
			expect.arrayContaining([
				'gclid',
				'gbraid',
				'wbraid',
				'fbclid',
				'rdt_cid',
				'twclid',
				'msclkid',
			])
		);
	});

	it('maps each param to the channel that issued it', () => {
		const channelOf = (param: string) =>
			DEFAULT_CLICK_ID_RULES.find((r) => r.param === param)?.channel;

		expect(channelOf('gclid')).toBe('google');
		expect(channelOf('fbclid')).toBe('facebook');
		expect(channelOf('rdt_cid')).toBe('reddit');
		expect(channelOf('twclid')).toBe('twitter');
		expect(channelOf('msclkid')).toBe('bing');
	});
});

describe('parseClickIdRules', () => {
	it('adds a network that is not built in', () => {
		const rules = parseClickIdRules('ttclid:tiktok:20', DEFAULT_CLICK_ID_RULES);
		const added = rules.find((r) => r.param === 'ttclid');

		expect(added).toEqual({ param: 'ttclid', channel: 'tiktok', minLength: 20 });
		// Built-ins survive.
		expect(rules.find((r) => r.param === 'gclid')).toBeDefined();
	});

	it('overrides a built-in rule rather than duplicating it', () => {
		const rules = parseClickIdRules('rdt_cid:reddit:8', DEFAULT_CLICK_ID_RULES);
		const reddit = rules.filter((r) => r.param === 'rdt_cid');

		expect(reddit).toHaveLength(1);
		expect(reddit[0]!.minLength).toBe(8);
	});

	it('accepts several rules separated by commas', () => {
		const rules = parseClickIdRules('ttclid:tiktok:20, li_fat_id:linkedin:12', []);

		expect(rules).toHaveLength(2);
		expect(rules[1]).toEqual({ param: 'li_fat_id', channel: 'linkedin', minLength: 12 });
	});

	it('defaults the minimum length when omitted', () => {
		const rules = parseClickIdRules('ttclid:tiktok', []);

		expect(rules[0]!.minLength).toBe(16);
	});

	it('falls back to the other channel for an unrecognised one', () => {
		const rules = parseClickIdRules('xyzclid:notarealnetwork:20', []);

		expect(rules[0]!.channel).toBe('other');
	});

	it.each([
		['no param', ':tiktok:20'],
		['a length that is not a number', 'ttclid:tiktok:abc'],
		['an empty entry', ''],
		['only separators', ',,,'],
	])('ignores %s rather than producing a broken rule', (_label, spec) => {
		expect(parseClickIdRules(spec, [])).toEqual([]);
	});

	it('never lets a configured minimum drop below one', () => {
		const rules = parseClickIdRules('ttclid:tiktok:0', []);

		expect(rules[0]!.minLength).toBeGreaterThanOrEqual(1);
	});
});

describe('getClickIdRules', () => {
	it('returns the built-in rules when nothing is configured', () => {
		vi.stubEnv('VITE_CLICK_ID_RULES', '');

		expect(getClickIdRules()).toEqual(DEFAULT_CLICK_ID_RULES);
	});

	it('merges the configured rules over the built-in ones', () => {
		vi.stubEnv('VITE_CLICK_ID_RULES', 'ttclid:tiktok:20');
		const rules = getClickIdRules();

		expect(rules.find((r) => r.param === 'ttclid')).toBeDefined();
		expect(rules.find((r) => r.param === 'gclid')).toBeDefined();
	});
});
