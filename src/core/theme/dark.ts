import { AppTheme } from './types';
import palette from './palette';

export const darkTheme: AppTheme = {
  colors: {
    plain: palette.colors.black,
		backdrop: {
			default: 'rgba(0, 0, 0, 0.5)',
			glass: '#232323a7',
		},
    // Text colors
    text: {
      primary: palette.colors.gray[200],
      secondary: palette.colors.gray[400],
      muted: palette.colors.gray[500],
      inverse: palette.colors.white,
      error: palette.colors.error[400],
    },
    // Background colors
    background: {
      page: palette.colors.gray[900],
      header: palette.colors.gray[900],
      card: palette.colors.gray[900],
      card2: palette.colors.gray[800],
    },
    // Highlight colors
    highlight: {
      text: 'hsla(23, 100%, 86%, 1)',
    },
    // Calendar colors
    calendar: {
			bg: palette.colors.gray[900],
			grid: palette.colors.gray[700],
			headerBg: palette.colors.gray[800],
			headerTodayBg: palette.colors.gray[700],
			headerDayText: palette.colors.gray[400],
			headerDayTodayText: palette.colors.white,
			headerDateText: palette.colors.gray[200],
			headerDateTodayText: palette.colors.brand[400],
			headerNonViableDateText: palette.colors.gray[900],	
			headerNonViableDateBg: palette.colors.gray[200],
			border: palette.colors.gray[700], 
			sidebarBg: '#1f1f1f',
			sidebarButtonHover: palette.colors.gray[800],
			sidebarButtonActive: palette.colors.gray[700],
			eventInfoModalBg: palette.colors.gray[800],
      summary: {
        bg: 'hsla(36, 70%, 16%, 1)',
        border: 'hsla(36, 71%, 19%, 1)',
        text: 'hsla(36, 30%, 65%, 1)',
        boldText: palette.colors.white,
        headerBg: 'hsla(36, 70%, 21%, 1)',
        header: 'hsla(36, 21%, 73%, 1)',
      },
    },
    // Border colors
    border: {
      default: 'hsla(0, 4%, 14%, 1)',
      subtle: palette.colors.gray[800],
      error: palette.colors.error[500],
      strong: palette.colors.gray[800],
    },
    // Toggle colors
    toggle: {
      bg: palette.colors.gray[700],
      bgChecked: palette.colors.brand[400],
      circle: palette.colors.gray[400],
      circleChecked: palette.colors.white,
    },
		// Date picker colors
		datepicker: {
      bg: palette.colors.gray[900],
			headerBg: palette.colors.gray[800],
			headerText: palette.colors.white,
			headerButton: palette.colors.gray[400],
			headerButtonHover: palette.colors.gray[100],
			dayText: palette.colors.gray[500],
			dateText: palette.colors.gray[100],
			dateDisabledText: palette.colors.gray[600],
			dateOutsideMonthText: palette.colors.gray[600],
			dateHoverBg: palette.colors.gray[700],
			dateHoverText: palette.colors.white,
			dateSelectedBg: palette.colors.brand[500],
      dateSelectedText: palette.colors.white,
		},
    // Button colors
    button: {
      primary: {
        bg: palette.colors.black,
        bgHover: palette.colors.gray[900],
        border: palette.colors.gray[700],
        text: palette.colors.white,
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
      },
    },
    // Input colors
    input: {
      bg: palette.colors.gray[900],
      text: palette.colors.white,
      placeholder: palette.colors.gray[500],
      border: palette.colors.gray[800],
      borderHover: palette.colors.gray[700],
      focusRing: palette.colors.gray[900],
      gradientNeutral: palette.colors.gray[700],
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
