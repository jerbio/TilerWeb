import palette from './palette';

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
    backdrop: {
      default: string;
      glass: string;
    };
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
      strong: string;
      error: string;
    };
    // Highlight colors
    highlight: {
      text: string;
    };
    // Toggle colors
    toggle: {
      bg: string;
      bgChecked: string;
      circle: string;
      circleChecked: string;
    };
    // Date picker colors
    datepicker: {
      bg: string;
      headerBg: string;
      headerText: string;
      headerButton: string;
      headerButtonHover: string;
      dayText: string;
      dateText: string;
      dateDisabledText: string;
      dateOutsideMonthText: string;
      dateHoverBg: string;
      dateHoverText: string;
      dateSelectedBg: string;
      dateSelectedText: string;
    };
    // Calendar Colors
    calendar: {
      bg: string;
			grid: string;
      headerBg: string;
      headerTodayBg: string;
      headerDayText: string;
      headerDayTodayText: string;
      headerDateText: string;
      headerDateTodayText: string;
      headerNonViableDateText: string;
      headerNonViableDateBg: string;
      sidebarBg: string;
      border: string;
      sidebarButtonHover: string;
      sidebarButtonActive: string;
			eventInfoModalBg: string;
      summary: {
        bg: string;
        border: string;
        text: string;
        boldText: string;
        headerBg: string;
        header: string;
      };
    };
    // Button colors
    button: {
      primary: {
        bg: string;
        bgHover: string;
        border: string;
        text: string;
      };
      secondary: {
        bg: string;
        bgHover: string;
        text: string;
      };
      brand: {
        bg: string;
        bgHover: string;
        text: string;
      };
      ghost: {
        bg: string;
        bgHover: string;
        text: string;
      };
    };
    // Input colors
    input: {
      bg: string;
      text: string;
      placeholder: string;
      border: string;
      borderHover: string;
      focusRing: string;
      gradientNeutral: string;
    };
    // Utility colors
    white: string;
    black: string;
    // Additional colors
    // Color scales
  } & {
    [key in ColorScaleHue]: ColorScale;
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
