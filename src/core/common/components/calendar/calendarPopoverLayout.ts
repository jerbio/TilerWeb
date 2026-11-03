import calendarConfig from '@/core/constants/calendar_config';

/** Keep event details within the calendar, including narrow desktop panels. */
export function getCalendarPopoverLayout({
	anchorX,
	anchorY,
	anchorWidth,
	containerWidth,
	containerHeight,
	bottomInset = 0,
}: {
	anchorX: number;
	anchorY: number;
	anchorWidth: number;
	containerWidth: number;
	containerHeight: number;
	bottomInset?: number;
}) {
	const headerHeight = parseInt(calendarConfig.HEADER_HEIGHT);
	const defaultWidth = parseInt(calendarConfig.INFO_MODAL_WIDTH);
	const defaultHeight = parseInt(calendarConfig.INFO_MODAL_HEIGHT);
	const gap = Math.min(parseInt(calendarConfig.INFO_MODAL_GAP), Math.max(0, containerWidth / 2));
	const width = Math.min(defaultWidth, Math.max(0, containerWidth - 2 * gap));
	const right = anchorX + anchorWidth + gap;
	const preferredX = right + width <= containerWidth - gap ? right : anchorX - width - gap;
	const x = Math.max(gap, Math.min(preferredX, containerWidth - width - gap));
	const availableHeight = Math.max(0, containerHeight + headerHeight - bottomInset);
	const top = Math.min(headerHeight + gap, availableHeight);
	const y = Math.max(top, Math.min(anchorY, availableHeight - defaultHeight));
	return { x, y, width, maxHeight: Math.max(0, Math.min(defaultHeight, availableHeight - y)) };
}
