import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	// Ignore files and folders
	{
		ignores: ['dist/**', 'coverage/**'],
	},

	// File matching and config
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,

	// React settings
	{
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
		},
	},
];
