import palette from '@/core/theme/palette';

const calendarConfig = {
	HEADER_HEIGHT: '34px',
	TIMELINE_WIDTH: '70px',
	BORDER_COLOR: palette.colors.gray[700],
	CELL_HEIGHT: '96px',
	MIN_CELL_HEIGHT: '60px',
	MIN_CELL_WIDTH: '175px',
	INFO_MODAL_HEIGHT: '260px',
	INFO_MODAL_WIDTH: '300px',
	INFO_MODAL_GAP: '12px',
};

export default calendarConfig;
export type CalendarConfig = typeof calendarConfig;
