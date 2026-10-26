import { describe, expect, it } from 'vitest';
import { isPlausibleClickId, parseAttribution, scrubInvalidClickIds } from './attribution';

/**
 * Reddit rejects a conversion whose click_id is not a real one, and reports it as
 * "Invalid match key" against the whole account. Anyone can put ?rdt_cid=junk in a
 * URL — a crawler, a QA run, a shared link with a truncated param — so an
 * implausible value must never be stored or forwarded.
 *
 * Real click ids are long opaque tokens: gclid ~50-90 chars, fbclid 100+,
 * msclkid 32 hex, rdt_cid and twclid comfortably above 20.
 */
describe('isPlausibleClickId', () => {
	it.each([
		['reddit', 'MTc1NTY5NzYwMC4xMjM0NTY3ODkwLjEyMzQ1Njc4OTA'],
		['google', 'Cj0KCQjw1um3BhDkARIsAJZ_2ykP0kO5wq3nQ0FakeExampleValueHere'],
		['meta', 'IwAR3xKfakeExampleValueThatIsVeryLongIndeedAndKeepsGoing123456'],
		['bing', '0123456789abcdef0123456789abcdef'],
	])('accepts a realistic %s click id', (_platform, id) => {
		expect(isPlausibleClickId(id)).toBe(true);
	});

	it.each([
		['my test value', 'RDT7'],
		['another test value', 'RDTE2E'],
		['short', 'R1'],
		['obvious placeholder', 'GCLADSTEST'],
		['empty', ''],
		['whitespace', '   '],
	])('rejects %s', (_label, id) => {
		expect(isPlausibleClickId(id)).toBe(false);
	});

	it('rejects a value containing characters a click id never has', () => {
		expect(isPlausibleClickId('<script>alert(1)</script>abcdefghij')).toBe(false);
		expect(isPlausibleClickId('a value with spaces in it here')).toBe(false);
	});
});

describe('parseAttribution click id filtering', () => {
	it('drops an implausible click id rather than forwarding a bad match key', () => {
		const a = parseAttribution('https://tiler.app/?rdt_cid=RDT7&utm_source=reddit', '');

		expect(a.clickIds.rdt_cid).toBeUndefined();
		// The campaign itself is still attributed; only the bad match key is dropped.
		expect(a.source).toBe('reddit');
		expect(a.channel).toBe('reddit');
	});

	it('keeps a realistic click id', () => {
		const real = 'MTc1NTY5NzYwMC4xMjM0NTY3ODkwLjEyMzQ1Njc4OTA';
		const a = parseAttribution(`https://tiler.app/?rdt_cid=${real}`, '');

		expect(a.clickIds.rdt_cid).toBe(real);
		expect(a.channel).toBe('reddit');
	});

	it('still derives the channel from a click id it had to drop', () => {
		const a = parseAttribution('https://tiler.app/?fbclid=FB7', '');

		expect(a.clickIds.fbclid).toBeUndefined();
		expect(a.channel).toBe('facebook');
	});
});

/**
 * The vendor pixels read the click id straight from `location.search` themselves, so
 * filtering our own payload is not enough — an implausible value has to leave the URL
 * before any pixel is injected.
 */
describe('scrubInvalidClickIds', () => {
	const run = (search: string) => {
		window.history.replaceState({}, '', '/' + search);
		const changed = scrubInvalidClickIds();
		return { changed, search: window.location.search };
	};

	it('removes an implausible click id from the address bar', () => {
		const { changed, search } = run('?rdt_cid=RDT7&utm_source=reddit');

		expect(changed).toBe(true);
		expect(search).not.toContain('RDT7');
		expect(search).toContain('utm_source=reddit');
	});

	it('leaves a realistic click id alone', () => {
		const real = 'MTc1NTY5NzYwMC4xMjM0NTY3ODkwLjEyMzQ1Njc4OTA';
		const { changed, search } = run(`?rdt_cid=${real}`);

		expect(changed).toBe(false);
		expect(search).toContain(real);
	});

	it('does nothing when there is no click id at all', () => {
		const { changed, search } = run('?utm_source=reddit');

		expect(changed).toBe(false);
		expect(search).toBe('?utm_source=reddit');
	});

	it('removes every bad click id in one pass', () => {
		const { search } = run('?rdt_cid=RDT7&fbclid=FB7&twclid=TW7&utm_campaign=keep');

		expect(search).not.toMatch(/RDT7|FB7|TW7/);
		expect(search).toContain('utm_campaign=keep');
	});
});
