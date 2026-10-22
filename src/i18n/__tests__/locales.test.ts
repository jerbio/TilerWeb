import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import english from '../locales/en.json';

const locales = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*.json', {
	eager: true,
});

function leaves(value: unknown, path: string[] = []): [string, unknown][] {
	if (value !== null && typeof value === 'object') {
		return Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
	}
	return [[JSON.stringify(path), value]];
}

function tokens(value: string): string[] {
	return (value.match(/\{\{[^}]+\}\}|<\/?[^>]+>|https?:\/\/[^\s<>]+/g) ?? []).sort();
}

const source = leaves(english);
const pluralKeys = source
	.map(([path]) => (JSON.parse(path) as string[]).join('.'))
	.filter((key) => key.endsWith('_other'))
	.map((key) => key.replace(/_other$/, ''));

describe('locale resources', () => {
	for (const [file, resource] of Object.entries(locales)) {
		const language = file.split('/').pop()!.replace('.json', '');
		if (language === 'en') continue;

		describe(language, () => {
			const translated = new Map(leaves(resource.default));

			it('covers every English entry and preserves interpolation, markup, and form identifiers', () => {
				for (const [path, value] of source) {
					expect(translated.has(path), `Missing ${path}`).toBe(true);
					const target = translated.get(path);
					expect(typeof target, path).toBe(typeof value);
					if (typeof value !== 'string' || typeof target !== 'string') continue;
					if (value.trim()) expect(target.trim(), path).not.toBe('');
					expect(tokens(target), path).toEqual(tokens(value));
					expect(target, path).not.toMatch(/ZXQ\s*\d+\s*ZXQ/);
					const parts = JSON.parse(path) as string[];
					const key = parts[parts.length - 1];
					if (key === 'key' || key === 'value' || key === 'icon') {
						expect(target, path).toBe(value);
					}
				}
			});

			it('provides the plural forms used by this language without English fallback', async () => {
				const i18n = createInstance();
				await i18n.init({
					lng: language,
					fallbackLng: false,
					resources: { [language]: { translation: resource.default } },
				});
				for (const key of pluralKeys) {
					for (const count of [0, 1, 2, 5, 21, 1.5, 1_000_000]) {
						const category = new Intl.PluralRules(language).select(count);
						const qualifiedKey = `${key}_${category}`;
						expect(i18n.exists(qualifiedKey), qualifiedKey).toBe(true);
						const result = i18n.t(key, { count });
						expect(result, key).not.toBe(key);
						expect(result, key).not.toContain('{{');
					}
				}
			});
		});
	}
});
