import palette from "./palette";

type ColorScale = {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type ColorScaleHue =
  | 'gray'
  | 'brand'
  | 'teal'
  | 'error'
  | 'warning'
  | 'success'
  | 'bluegray'
  | 'bluelight'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'orange';

export type AppTheme = {
  colors: {
		plain: string;
    // Text colors
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
      error: string;
    };
    // Background colors
    background: {
      page: string;
			header: string;
      card: string;
			card2: string;
    };
    // Border colors
    border: {
      default: string;
      subtle: string;
      error: string;
    };
    // Button colors
    button: {
      primary: {
        bg: string;
        text: string;
      };
      secondary: {
        bg: string;
        text: string;
        border: string;
      };
    };
    // Utility colors
    white: string;
    black: string;
    // Additional colors
    // Color scales
	} & {
    [key in ColorScaleHue]: ColorScale
	};
	typography: typeof palette.typography;
	buttonHeights: typeof palette.buttonHeights;
	inputHeights: typeof palette.inputHeights;
	space: typeof palette.space;
	inputs: typeof palette.inputs;
	borderRadius: typeof palette.borderRadius;
  container: typeof palette.container;
  screens: typeof palette.screens;
};
