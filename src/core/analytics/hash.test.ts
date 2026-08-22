import { describe, expect, it } from 'vitest';
import { hashEmail, sha256Hex } from './hash';

describe('sha256Hex', () => {
	it('produces the known digest for a known input', async () => {
		await expect(sha256Hex('abc')).resolves.toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
		);
	});

	it('produces a 64 character lowercase hex string', async () => {
		const digest = await sha256Hex('anything');
		expect(digest).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('hashEmail', () => {
	it('normalises case and whitespace before hashing', async () => {
		const canonical = await hashEmail('user@example.com');

		await expect(hashEmail('  USER@Example.COM  ')).resolves.toBe(canonical);
	});

	it('returns undefined for an empty address rather than hashing nothing', async () => {
		await expect(hashEmail('')).resolves.toBeUndefined();
		await expect(hashEmail('   ')).resolves.toBeUndefined();
		await expect(hashEmail(undefined)).resolves.toBeUndefined();
	});

	it('never returns the raw address', async () => {
		const digest = await hashEmail('user@example.com');

		expect(digest).not.toContain('@');
		expect(digest).not.toContain('user');
	});
});
