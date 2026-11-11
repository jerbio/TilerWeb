import { createInstance } from 'i18next';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Trans } from 'react-i18next';

const locales = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*.json', {
	eager: true,
});
const sources = import.meta.glob<string>(
	[
		'../../components/tileshare/**/*.tsx',
		'../../pages/app/tileshare/**/*.tsx',
		'../../core/common/components/date_picker.tsx',
		'../../core/common/components/AvatarCluster.tsx',
		'!**/__tests__/**',
		'!**/*.test.tsx',
	],
	{ query: '?raw', import: 'default', eager: true }
);

function literalKeys(node: ts.Node): string[] {
	if (ts.isStringLiteralLike(node)) return [node.text];
	if (ts.isConditionalExpression(node))
		return [...literalKeys(node.whenTrue), ...literalKeys(node.whenFalse)];
	return [];
}

// Scan the production call sites: comparing locale files alone misses keys absent from every language.
const keys = new Set<string>();
const hardcodedMessages: string[] = [];
keys.add('tileshareActivity.serviceUnavailable');
for (const [path, text] of Object.entries(sources)) {
	const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const visit = (node: ts.Node) => {
		const record = (text: string) => {
			if (/\p{L}/u.test(text.replace(/&[a-zA-Z]+;/g, '')))
				hardcodedMessages.push(
					`${path}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${text}`
				);
		};
		if (ts.isJsxText(node)) record(node.text.trim());
		if (
			ts.isJsxAttribute(node) &&
			/^(title|aria-label|aria-description|alt|placeholder|label|helperText)$/.test(
				node.name.getText(source)
			) &&
			node.initializer
		) {
			if (ts.isStringLiteral(node.initializer)) record(node.initializer.text);
			else if (ts.isJsxExpression(node.initializer) && node.initializer.expression)
				literalKeys(node.initializer.expression).forEach(record);
		}
		if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && node.expression)
			literalKeys(node.expression).forEach(record);
		if (
			ts.isCallExpression(node) &&
			node.expression.getText(source) === 't' &&
			node.arguments[0]
		) {
			for (const key of literalKeys(node.arguments[0])) keys.add(key);
		}
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isObjectLiteralExpression(node.initializer)
		) {
			const prefixes: Record<string, string> = path.endsWith('TileShareActivityTimeline.tsx')
				? {
						labels: 'tileshareActivity.events',
						actions: 'tileshareActivity.actions',
						commentSentences: 'tileshareActivity.sentences',
					}
				: path.endsWith('TiletteSchedulePreview.tsx')
					? { unavailableReasons: 'tilesharePreview.unavailable' }
					: {};
			const prefix = prefixes[node.name.getText(source)];
			if (prefix)
				for (const property of node.initializer.properties) {
					if (property.name) {
						const key = `${prefix}.${property.name.getText(source).replace(/['"]/g, '')}`;
						keys.add(key);
						if (prefix === 'tileshareActivity.actions')
							keys.add(key.replace('.actions.', '.sentences.'));
					}
				}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
}
for (const status of ['accepted', 'declined', 'none', 'tentative', 'unknown'])
	keys.add(`tileshareRsvp.${status}`);
for (const field of ['name', 'note', 'deadline', 'start', 'duration'])
	keys.add(`tileshareActivity.fields.${field}`);
for (const channel of ['email', 'sms', 'push']) keys.add(`tileshareActivity.channels.${channel}`);
for (const stage of ['unassigned', 'delegated', 'in_progress', 'completed'])
	keys.add(`tileShareFilters.stages.${stage}`);
for (const stage of ['unassigned', 'delegated', 'inProgress', 'completed'])
	keys.add(`tilesharedemo.detail.status.${stage}`);
for (const due of ['any', 'overdue', 'today', 'week', 'custom', 'none'])
	keys.add(`tileShareFilters.dates.${due}`);
for (const mode of ['project', 'class', 'broadcast'])
	for (const field of ['label', 'description', 'title', 'submit'])
		keys.add(`tileShareModes.${mode}.${field}`);
for (const due of ['all', 'overdue', 'today', 'next7Days', 'custom', 'noDeadline'])
	keys.add(`tileshareList.filterDeadline.${due}`);
for (const sort of ['createdDesc', 'createdAsc', 'deadlineAsc', 'deadlineDesc'])
	keys.add(`tileshareList.${sort}`);

describe('TileShare internationalization', () => {
	it('keeps visible messages and accessibility labels out of hardcoded JSX', () => {
		expect(hardcodedMessages).toEqual([]);
	});
	for (const [file, resource] of Object.entries(locales)) {
		const language = file.split('/').pop()!.replace('.json', '');
		it(`${language} resolves TileShare UI messages without English fallback`, async () => {
			const i18n = createInstance();
			await i18n.init({
				lng: language,
				fallbackLng: false,
				resources: { [language]: { translation: resource.default } },
			});
			expect(Object.keys(sources).length).toBeGreaterThan(40);
			expect(keys.size).toBeGreaterThan(250);
			for (const key of keys) {
				expect(
					i18n.exists(key) ||
						i18n.exists(key, { count: 1 }) ||
						i18n.exists(key, { count: 2 }),
					`${language}: ${key}`
				).toBe(true);
				const message = i18n.getResource(language, 'translation', key);
				const english = key
					.split('.')
					.reduce<unknown>(
						(value, part) =>
							value && typeof value === 'object'
								? (value as Record<string, unknown>)[part]
								: undefined,
						locales['../locales/en.json'].default
					);
				if (typeof message === 'string' && typeof english === 'string') {
					const variables = (value: string) =>
						[...value.matchAll(/{{\s*([^},]+)[^}]*}}/g)]
							.map((match) => match[1].trim())
							.sort();
					expect(variables(message), `${language}: ${key} interpolation`).toEqual(
						variables(english)
					);
				}
			}
		});
		it(`${language} interpolates participant names and locale-formatted counts`, async () => {
			const i18n = createInstance();
			await i18n.init({
				lng: language,
				fallbackLng: false,
				resources: { [language]: { translation: resource.default } },
			});
			const activity = renderToStaticMarkup(
				createElement(Trans, {
					i18n,
					i18nKey: 'tileshareActivity.sentences.assignment_accepted',
					components: {
						actor: createElement('span', null, 'Zoë'),
						title: createElement('strong', null, 'Design'),
					},
				})
			);
			expect(activity).toContain('<span>Zoë</span>');
			expect(activity).toContain('<strong>Design</strong>');
			expect(activity).not.toContain('<actor');
			expect(activity).not.toContain('<title');
			if (language === 'de') expect(activity).toContain('<strong>Design</strong> angenommen');
			if (language === 'ja')
				expect(activity).toContain('<strong>Design</strong>を承諾しました');
			for (const key of ['review', 'progress', 'success', 'partial', 'failed']) {
				const message = i18n.t(`classParticipantAddition.${key}`, {
					recipient: 'Zoë',
					count: 12345,
					processed: 12345,
					total: 12345,
					saved: 12345,
					failed: 12345,
				});
				expect(message).toContain('Zoë');
				expect(message).toContain(new Intl.NumberFormat(language).format(12345));
				expect(message).not.toContain('{{');
			}
			const status = i18n.t('tileshareRsvp.accepted');
			for (const key of [
				'assignProgress',
				'assignResult',
				'assignReview',
				'bulkReview',
				'removeAllReview',
			]) {
				const message = i18n.t(`tileShareBoard.${key}`, {
					name: 'Design',
					response: status,
					count: 12345,
					processed: 12345,
					total: 12345,
					saved: 12345,
					failed: 12345,
				});
				expect(message).toContain(new Intl.NumberFormat(language).format(12345));
				expect(message).not.toContain('{{');
			}
			for (const key of ['progress', 'partial', 'failed', 'success', 'review']) {
				const message = i18n.t(`participantRemoval.${key}`, {
					recipient: 'Zoë',
					count: 12345,
					processed: 12345,
					total: 12345,
					saved: 12345,
					failed: 12345,
				});
				expect(message).toContain('Zoë');
				expect(message).toContain(new Intl.NumberFormat(language).format(12345));
				expect(message).not.toContain('{{');
			}
			const response = i18n.t('shareExperience.responseCount', {
				response: status,
				count: 12345,
			});
			expect(response).toContain(status);
			expect(response).toContain(new Intl.NumberFormat(language).format(12345));
			expect(i18n.t('tilesharePreview.explanationOptions')).not.toBe(
				i18n.t('tilesharePreview.explanationOverview')
			);
			expect(i18n.t('tilesharePreview.selectCandidateAvailable')).not.toBe(
				i18n.t('tilesharePreview.selectCandidateUnavailable')
			);
		});
	}
});
