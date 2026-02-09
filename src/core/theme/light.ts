import { AppTheme } from "./types";
import palette from "./palette";

export const lightTheme: AppTheme = {
  colors: {
		plain: palette.colors.white,
    // Text colors
    text: {
      primary: palette.colors.gray[900],
      secondary: palette.colors.gray[600],
      muted: palette.colors.gray[500],
      inverse: palette.colors.white,
      error: palette.colors.error[600]
    },
    // Background colors
    background: {
      page: palette.colors.gray[100],
			header: palette.colors.white,
      card: palette.colors.white,
			card2: palette.colors.gray[100]
    },
    // Border colors
    border: {
      default: palette.colors.gray[200],
      subtle: palette.colors.gray[100],
      error: palette.colors.error[500],
			strong: palette.colors.gray[200],
    },
		// Highlight colors
		highlight: {
			text: 'hsla(224, 31%, 54%, 1)',
		},
		// Calendar colors
		calendar: {
			summary: {
			bg: 'hsla(36, 60%, 95%, 1)',
			border: 'hsla(34, 32%, 91%, 1)',
			text: 'hsla(34, 32%, 50%, 1)',
			boldText: 'hsla(34, 32%, 40%, 1)',
			headerBg: palette.colors.white,
			header: 'hsla(234, 10%, 39%, 1)',
			}
		},
		// Toggle colors
    toggle: {
			bg: palette.colors.gray[200],
			bgChecked: palette.colors.brand[400],
			circle: palette.colors.white,
			circleChecked: palette.colors.white,
    },
    // Button colors
    button: {
      primary: {
        bg: palette.colors.white,
				bgHover: palette.colors.gray[100],
				border: palette.colors.gray[200],
        text: palette.colors.black
      },
      secondary: {
        bg: palette.colors.black,
				bgHover: palette.colors.gray[900],
        text: palette.colors.white,
      },
			brand: {
				bg: palette.colors.brand[500],
        bgHover: palette.colors.brand[600],
        text: palette.colors.white,
			},
			ghost: {
				bg: 'transparent',
				bgHover: '#00000012',
				text: palette.colors.gray[500],
			}
    },
    // hues
		brand: palette.colors.brand,
    gray: palette.colors.gray,
    error: palette.colors.error,
    warning: palette.colors.warning,
    success: palette.colors.success,
    blue: palette.colors.blue,
    teal: palette.colors.teal,
    indigo: palette.colors.indigo,
    purple: palette.colors.purple,
    pink: palette.colors.pink,
    orange: palette.colors.orange,
		bluelight: palette.colors.bluelight,
		bluegray: palette.colors.bluegray,
		rose: palette.colors.rose,
    // Utility
    white: palette.colors.white,
    black: palette.colors.black,
  },
	typography: palette.typography,
	buttonHeights: palette.buttonHeights,
	inputHeights: palette.inputHeights,
	space: palette.space,
	inputs: palette.inputs,
	borderRadius: palette.borderRadius,
  container: palette.container,
  screens: palette.screens,
};
