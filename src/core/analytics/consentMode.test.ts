import { describe, expect, it, vi, beforeEach } from 'vitest';

const getPreferences = vi.fn();

vi.mock('@/core/common/components/consent/consent-manager', () => ({
	consentManager: {
		get getPreferences() {
			return getPreferences;
		},
	},
	default: {
		get getPreferences() {
			return getPreferences;
		},
	},
}));

import { resolveConsent, resolveConsentFor } from './consentMode';

beforeEach(() => {
	getPreferences.mockReset();
});

describe('resolveConsentFor', () => {
	it('grants everything in bypass mode regardless of stored preferences', () => {
		const snapshot = resolveConsentFor('bypass', {
			necessary: true,
			analytics: false,
			marketing: false,
			preferences: false,
		});

		expect(snapshot).toEqual({
			mode: 'bypass',
			grantedBy: 'config',
			analytics: true,
			marketing: true,
		});
	});

	it('grants everything in bypass mode even with no stored decision', () => {
		expect(resolveConsentFor('bypass', null)).toEqual({
			mode: 'bypass',
			grantedBy: 'config',
			analytics: true,
			marketing: true,
		});
	});

	it('denies everything in enforce mode until the user decides', () => {
		expect(resolveConsentFor('enforce', null)).toEqual({
			mode: 'enforce',
			grantedBy: 'none',
			analytics: false,
			marketing: false,
		});
	});

	it('mirrors the user decision in enforce mode', () => {
		expect(
			resolveConsentFor('enforce', {
				necessary: true,
				analytics: true,
				marketing: false,
				preferences: true,
			})
		).toEqual({
			mode: 'enforce',
			grantedBy: 'user',
			analytics: true,
			marketing: false,
		});
	});
});

describe('resolveConsent', () => {
	it('never reads stored preferences while in bypass mode', () => {
		const snapshot = resolveConsent('bypass');

		expect(snapshot.analytics).toBe(true);
		expect(snapshot.marketing).toBe(true);
		expect(getPreferences).not.toHaveBeenCalled();
	});

	it('delegates to the consent manager in enforce mode', () => {
		getPreferences.mockReturnValue({
			necessary: true,
			analytics: true,
			marketing: true,
			preferences: true,
		});

		const snapshot = resolveConsent('enforce');

		expect(getPreferences).toHaveBeenCalledTimes(1);
		expect(snapshot).toEqual({
			mode: 'enforce',
			grantedBy: 'user',
			analytics: true,
			marketing: true,
		});
	});

	it('fails closed when the consent manager throws in enforce mode', () => {
		getPreferences.mockImplementation(() => {
			throw new Error('storage unavailable');
		});

		expect(resolveConsent('enforce')).toEqual({
			mode: 'enforce',
			grantedBy: 'none',
			analytics: false,
			marketing: false,
		});
	});
});
