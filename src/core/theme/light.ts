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
      error: palette.colors.error[500]
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
				text: palette.colors.gray[700],
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
