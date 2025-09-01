import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	// Ignore files and folders
	{
		ignores: ['dist/**'],
	},
	{
  rules: {
    'unused-vars': 'off', // You can set this to 'off' as well to completely ignore, but not advisable
  }
},

	// File matching and config
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
];
