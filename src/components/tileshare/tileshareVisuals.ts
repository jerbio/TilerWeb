import { css } from 'styled-components';
import { AppTheme } from '@/core/theme/types';
import { lightTheme } from '@/core/theme/light';

type ShareTheme = AppTheme & { tileShare?: true };
const cache = new WeakMap<AppTheme, ShareTheme>();

/** Keep the app palette while applying TileShare's surface roles and proportions. */
export function tileShareTheme(parent: AppTheme = lightTheme): ShareTheme {
	if ((parent as ShareTheme).tileShare) return parent;
	const existing = cache.get(parent);
	if (existing) return existing;
	const next: ShareTheme = {
		...parent,
		tileShare: true,
		colors: {
			...parent.colors,
			plain: parent.colors.background.card,
			button: {
				...parent.colors.button,
				primary: {
					...parent.colors.button.primary,
					bg: parent.colors.background.card2,
					bgHover: parent.colors.input.borderHover,
				},
			},
			tabs: {
				...parent.colors.tabs,
				bg: parent.colors.input.bg,
			},
			datepicker: {
				...parent.colors.datepicker,
				dayText: parent.colors.text.secondary,
			},
			tagInput: {
				...parent.colors.tagInput,
				chipBg: parent.colors.background.card2,
			},
			emptyState: {
				icon: parent.colors.text.muted,
				text: parent.colors.text.secondary,
			},
		},
		typography: {
			...parent.typography,
			fontWeight: {
				...parent.typography.fontWeight,
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '650',
			},
			fontFamily: {
				...parent.typography.fontFamily,
				// Shared fields also use the same Urbanist face as the app navigation.
				inter: parent.typography.fontFamily.urban,
			},
		},
		buttonHeights: { small: '34px', medium: '42px', large: '46px' },
		inputHeights: { small: '36px', medium: '44px', large: '48px' },
		borderRadius: { ...parent.borderRadius, little: '10px', medium: '10px' },
	};
	cache.set(parent, next);
	return next;
}

export const tileShareControls = css`
	color: ${({ theme }) => theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-size: 14px;
	line-height: 1.6;
	-webkit-font-smoothing: antialiased;
	h1[tabindex='-1']:focus,
	h2[tabindex='-1']:focus {
		outline: none;
	}
	button,
	input,
	textarea {
		font-family: inherit;
	}
	button {
		font-weight: 600;
	}
	input:not([type='checkbox']):not([type='radio']),
	textarea {
		font-size: 14px;
		border-radius: 9px;
	}
	input:not([type='checkbox']):not([type='radio']) {
		min-width: 0;
		height: 44px;
	}
	div:has(> input:not([type='checkbox']):not([type='radio'])) {
		border-radius: 10px;
		height: auto;
	}
	label {
		color: ${({ theme }) => theme.colors.text.secondary};
		font-size: 13px;
		font-weight: 500;
	}
	input[type='checkbox'] {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		margin: 3px 0 0;
		accent-color: ${({ theme }) => theme.colors.button.brand.bg};
	}
	button:focus-visible,
	a:focus-visible,
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.brand[400]};
		outline-offset: 3px;
	}
	@media (max-width: 480px) {
		input:not([type='checkbox']):not([type='radio']),
		textarea {
			font-size: 16px;
		}
	}
`;
