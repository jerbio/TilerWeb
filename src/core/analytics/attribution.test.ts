import { describe, expect, it, beforeEach } from 'vitest';
import {
	FIRST_TOUCH_KEY,
	LAST_TOUCH_KEY,
	getFirstTouch,
	getLastTouch,
	hasCampaignSignal,
	parseAttribution,
	recordTouch,
} from './attribution';

beforeEach(() => {
	localStorage.clear();
});

describe('parseAttribution', () => {
	it('reads every utm parameter', () => {
		const attribution = parseAttribution(
			'https://tiler.app/discover?utm_source=reddit&utm_medium=cpc&utm_campaign=q3&utm_content=hero&utm_term=calendar',
			''
		);

		expect(attribution.source).toBe('reddit');
		expect(attribution.medium).toBe('cpc');
		expect(attribution.campaign).toBe('q3');
		expect(attribution.content).toBe('hero');
		expect(attribution.term).toBe('calendar');
	});

	it('reads every supported click id', () => {
		// Realistic lengths: short values are rejected as fabricated match keys.
		const id = (prefix: string) => prefix + 'A1b2C3d4E5f6G7h8I9j0';
		const attribution = parseAttribution(
			`https://tiler.app/?gclid=${id('gcl')}&gbraid=${id('gbr')}&wbraid=${id('wbr')}` +
				`&fbclid=${id('fbc')}&rdt_cid=${id('rdt')}&twclid=${id('twc')}&msclkid=${id('msc')}`,
			''
		);

		expect(attribution.clickIds).toEqual({
			gclid: id('gcl'),
			gbraid: id('gbr'),
			wbraid: id('wbr'),
			fbclid: id('fbc'),
			rdt_cid: id('rdt'),
			twclid: id('twc'),
			msclkid: id('msc'),
		});
	});

	it('reads the existing ref and ad params used by ReferralController', () => {
		const attribution = parseAttribution('https://tiler.app/?ref=reddit&ad=1', '');

		expect(attribution.ref).toBe('reddit');
		expect(attribution.isAd).toBe(true);
		expect(attribution.channel).toBe('reddit');
	});

	it('treats a missing ad param as not an ad', () => {
		expect(parseAttribution('https://tiler.app/?ref=reddit', '').isAd).toBe(false);
	});

	it('prefers utm_source over ref when deriving the channel', () => {
		expect(
			parseAttribution('https://tiler.app/?utm_source=google&ref=reddit', '').channel
		).toBe('google');
	});

	it('falls back to the referrer when there are no campaign params', () => {
		const attribution = parseAttribution(
			'https://tiler.app/discover',
			'https://www.reddit.com/r/productivity'
		);

		expect(attribution.channel).toBe('reddit');
		expect(attribution.referrer).toBe('https://www.reddit.com/r/productivity');
	});

	it('records the landing path without the query string', () => {
		expect(parseAttribution('https://tiler.app/articles/x?utm_source=a', '').landingPath).toBe(
			'/articles/x'
		);
	});

	it('derives the twitter channel from a twclid alone', () => {
		expect(parseAttribution('https://tiler.app/?twclid=abc', '').channel).toBe('twitter');
	});

	it('derives the facebook channel from an fbclid alone', () => {
		expect(parseAttribution('https://tiler.app/?fbclid=abc', '').channel).toBe('facebook');
	});

	it('derives the google channel from a gclid alone', () => {
		expect(parseAttribution('https://tiler.app/?gclid=abc', '').channel).toBe('google');
	});

	it('derives the reddit channel from an rdt_cid alone', () => {
		expect(parseAttribution('https://tiler.app/?rdt_cid=abc', '').channel).toBe('reddit');
	});
});

describe('hasCampaignSignal', () => {
	it('is true when a utm parameter is present', () => {
		expect(hasCampaignSignal(parseAttribution('https://tiler.app/?utm_source=a', ''))).toBe(
			true
		);
	});

	it('is true when a click id is present', () => {
		expect(
			hasCampaignSignal(
				parseAttribution('https://tiler.app/?fbclid=IwAR3xA1b2C3d4E5f6G7h8', '')
			)
		).toBe(true);
	});

	it('is true when an external referrer is present', () => {
		expect(
			hasCampaignSignal(parseAttribution('https://tiler.app/', 'https://www.reddit.com/'))
		).toBe(true);
	});

	it('is false for a bare direct visit', () => {
		expect(hasCampaignSignal(parseAttribution('https://tiler.app/timeline', ''))).toBe(false);
	});
});

describe('recordTouch', () => {
	it('writes both first and last touch on the very first visit', () => {
		recordTouch('https://tiler.app/?utm_source=reddit&utm_campaign=q3', '');

		expect(getFirstTouch()?.source).toBe('reddit');
		expect(getLastTouch()?.source).toBe('reddit');
		expect(localStorage.getItem(FIRST_TOUCH_KEY)).toBeTruthy();
		expect(localStorage.getItem(LAST_TOUCH_KEY)).toBeTruthy();
	});

	it('never overwrites first touch', () => {
		recordTouch('https://tiler.app/?utm_source=reddit', '');
		recordTouch('https://tiler.app/?utm_source=google', '');

		expect(getFirstTouch()?.source).toBe('reddit');
	});

	it('overwrites last touch when a new campaign arrives', () => {
		recordTouch('https://tiler.app/?utm_source=reddit', '');
		recordTouch('https://tiler.app/?utm_source=google', '');

		expect(getLastTouch()?.source).toBe('google');
	});

	it('does not clobber attribution on an in-app navigation with no params', () => {
		recordTouch('https://tiler.app/?utm_source=reddit&utm_campaign=q3', '');
		recordTouch('https://tiler.app/discover', '');
		recordTouch('https://tiler.app/articles', '');

		expect(getFirstTouch()?.source).toBe('reddit');
		expect(getLastTouch()?.source).toBe('reddit');
	});

	it('still records a first touch for a direct visit so every user has attribution', () => {
		recordTouch('https://tiler.app/', '');

		expect(getFirstTouch()).not.toBeNull();
		expect(getFirstTouch()?.channel).toBe('none');
	});

	it('recovers from corrupt stored attribution', () => {
		localStorage.setItem(FIRST_TOUCH_KEY, 'not json');

		expect(() => recordTouch('https://tiler.app/?utm_source=x', '')).not.toThrow();
		expect(getFirstTouch()?.source).toBe('x');
	});

	it('returns null before anything was recorded', () => {
		expect(getFirstTouch()).toBeNull();
		expect(getLastTouch()).toBeNull();
	});
});
