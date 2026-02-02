import { AppTheme } from "./types";
import palette from "./palette";

export const darkTheme: AppTheme = {
  colors: {
		plain: palette.colors.black,
    // Text colors
    text: {
      primary: palette.colors.gray[100],
      secondary: palette.colors.gray[400],
      muted: palette.colors.gray[500],
      inverse: palette.colors.white,
      error: palette.colors.error[400]
    },
    // Background colors
    background: {
      page: palette.colors.gray[900],
			header: palette.colors.gray[900],
      card: palette.colors.gray[900],
			card2: palette.colors.gray[800]
    },
    // Border colors
    border: {
      default: 'hsla(0, 4%, 14%, 1)',
      subtle: palette.colors.gray[800],
      error: palette.colors.error[500]
    },
    // Button colors
    button: {
      primary: {
        bg: palette.colors.black,
				bgHover: palette.colors.gray[900],
				border: palette.colors.gray[700],
        text: palette.colors.white
      },
      secondary: {
        bg: palette.colors.white,
				bgHover: palette.colors.gray[200],
        text: palette.colors.black,
      },
			brand: {
				bg: palette.colors.brand[500],
        bgHover: palette.colors.brand[600],
        text: palette.colors.white,
			},
			ghost: {
				bg: 'transparent',
				bgHover: '#ffffff12',
				text: palette.colors.gray[300],
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
