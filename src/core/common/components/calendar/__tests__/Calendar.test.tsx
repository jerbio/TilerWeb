import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { CalendarRequestProvider } from '../CalendarRequestProvider';
import { CalendarUIProvider, useCalendarUI } from '../calendar-ui.provider';
import Calendar from '../calendar';
import { CalendarViewOptions } from '../calendar.types';

vi.mock('react-i18next', () => ({
	initReactI18next: {
		type: '3rdParty',
		init: () => {},
	},
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock('@/core/util/analytics', () => ({
	default: {
		trackCalendarEvent: vi.fn(),
	},
}));

vi.mock('@/core/common/hooks/useIsMobile', () => ({
	default: () => false,
}));

vi.mock('swiper/react', async () => {
	const React = await import('react');

	const Swiper = React.forwardRef<
		{ swiper: { disable: () => void; enable: () => void; slideTo: () => void } },
		{ children?: React.ReactNode }
	>(({ children }, ref) => {
		React.useImperativeHandle(ref, () => ({
			swiper: {
				disable: () => {},
				enable: () => {},
				slideTo: () => {},
			},
		}));

		return React.createElement('div', { 'data-testid': 'mock-swiper' }, children);
	});
	Swiper.displayName = 'MockSwiper';

	return {
		Swiper,
		SwiperSlide: ({ children }: { children?: React.ReactNode }) =>
			React.createElement('div', null, children),
	};
});

vi.mock('../calendar_content', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-calendar-content' }),
	};
});

vi.mock('../calendar_content_dummy', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-calendar-content-dummy' }),
	};
});

vi.mock('../calendar_create_selection', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-create-selection' }),
	};
});

vi.mock('../calendar_event_info', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-calendar-event-info' }),
	};
});

vi.mock('../create_block', async () => {
	const React = await import('react');
	return {
		default: () => React.createElement('div', { 'data-testid': 'mock-create-block' }),
	};
});

vi.mock('../create_tile', async () => {
	const React = await import('react');

	function MockCalendarCreateTile() {
		const [count, setCount] = React.useState(0);

		return React.createElement(
			'div',
			{ 'data-testid': 'mock-create-tile' },
			React.createElement(
				'button',
				{ type: 'button', onClick: () => setCount((prev) => prev + 1) },
				`Count ${count}`
			)
		);
	}

	return { default: MockCalendarCreateTile };
});

const viewOptions: CalendarViewOptions = {
	width: 720,
	startDay: dayjs('2026-05-05'),
	daysInView: 3,
};

function CalendarTestControls() {
	const ui = useCalendarUI((state) => state.createTile);

	return (
		<div>
			<button type="button" onClick={ui.actions.open}>
				Open tile externally
			</button>
			<button type="button" onClick={ui.actions.expand}>
				Expand tile externally
			</button>
			<button type="button" onClick={ui.actions.collapse}>
				Collapse tile externally
			</button>
		</div>
	);
}

function renderCalendar() {
	return render(
		<ThemeProvider defaultTheme="light">
			<CalendarRequestProvider>
				<CalendarUIProvider demoMode={false}>
					<CalendarTestControls />
					<Calendar
						events={[]}
						eventsLoading={false}
						viewRef={{ current: null }}
						viewOptions={viewOptions}
						setViewOptions={vi.fn()}
						refetchEvents={vi.fn()}
					/>
				</CalendarUIProvider>
			</CalendarRequestProvider>
		</ThemeProvider>
	);
}

describe('Calendar', () => {
	it('preserves create tile local state when expanding and collapsing the modal host', async () => {
		const user = userEvent.setup();
		renderCalendar();

		await user.click(screen.getByRole('button', { name: 'Open tile externally' }));
		await user.click(screen.getByRole('button', { name: 'Count 0' }));

		expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Expand tile externally' }));

		expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Collapse tile externally' }));

		expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
	});
});
