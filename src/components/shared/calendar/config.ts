import styles from '../../../util/styles';

const calendarConfig = {
	HEADER_DATE_MIN_WIDTH: '150px',
	HEADER_HEIGHT: '34px',
	TIMELINE_WIDTH: '70px',
	BORDER_COLOR: styles.colors.gray[700],
	MIN_CELL_HEIGHT: '72px',
};

export default calendarConfig;
export type CalendarConfig = typeof calendarConfig;
