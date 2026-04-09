import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { initialCreateBlockFormState } from '../../data';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { scheduleService } from '@/services';
import { CalendarUIProvider } from '../../calendar-ui.provider';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey, components }: { i18nKey: string; components?: Array<React.ReactNode> }) => (
    <span>
      {i18nKey}
      {components && Object.values(components)}
    </span>
  ),
}));
vi.mock('@/services', () => ({
  scheduleService: {
    createEvent: vi.fn(),
  },
}));
vi.mock('@/core/common/components/calendar/CalendarRequestProvider', () => ({
  useCalendarDispatch: () => vi.fn(),
}));

import CalendarCreateBlock from '..';
import dayjs from 'dayjs';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider defaultTheme="dark">
      <CalendarUIProvider demoMode={false}>{ui}</CalendarUIProvider>
    </ThemeProvider>
  );
}
async function openModal() {
  await userEvent.click(screen.getByTestId('open-create-block'));
}

// helper form setup
const mockFormState = initialCreateBlockFormState;
function setupForm(overrides: Partial<typeof mockFormState> = {}) {
  return {
    formData: { ...mockFormState, ...overrides },
    handleFormInputChange: vi.fn(() => vi.fn()),
    setFormData: vi.fn(),
    resetForm: vi.fn(),
  };
}
const mockCreateBlockResponse = {
  calendarEvent: {
    id: '123',
  },
} as Awaited<ReturnType<typeof scheduleService.createEvent>>;

describe('CalendarCreateBlock', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('opens modal', async () => {
    const form = setupForm();

    renderWithProviders(<CalendarCreateBlock formHandler={form} refetchEvents={vi.fn()} />);

    await openModal();

    expect(screen.getByText('calendar.createBlock.title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /calendar.createBlock.buttons.submit/i })
    ).toBeInTheDocument();
  });

  it('disables submit when invalid', async () => {
    const form = setupForm();

    renderWithProviders(<CalendarCreateBlock formHandler={form} refetchEvents={vi.fn()} />);

    await openModal();

    const submit = screen.getByRole('button', { name: /calendar.createBlock.buttons.submit/i });
    expect(submit).toBeDisabled();
  });

  it('enables submit when valid', async () => {
    const form = setupForm({
      name: 'Deep Work',
			start: dayjs('2001-05-24'),
			startTime: '11:30 PM',
    });

    renderWithProviders(<CalendarCreateBlock formHandler={form} refetchEvents={vi.fn()} />);

    await openModal();

    const submit = screen.getByRole('button', { name: /calendar.createBlock.buttons.submit/i });
    expect(submit).not.toBeDisabled();
  });

  it('submits correct payload', async () => {
    const form = setupForm({
      name: 'Deep Work',
      startTime: '11:30 PM',
			start: dayjs('2001-05-24'),
			end: dayjs('2001-05-25'),
      endTime: '12:45 AM',
    });
    const refetchEvents = vi.fn();

    const createEventMock = scheduleService.createEvent as ReturnType<typeof vi.fn>;
    createEventMock.mockResolvedValue(mockCreateBlockResponse);

    renderWithProviders(
      <CalendarCreateBlock formHandler={form} refetchEvents={refetchEvents} />
    );

    await openModal();

    await userEvent.click(
      screen.getByRole('button', { name: /calendar.createBlock.buttons.submit/i })
    );

    await waitFor(() => {
      expect(scheduleService.createEvent).toHaveBeenCalled();
    });

		const payload = createEventMock.mock.calls[0][0];

    expect(payload.Name).toBe('Deep Work');
    expect(payload.Rigid).toBe('true');
    expect(payload.DurationDays).toBe('0');
    expect(payload.DurationHours).toBe('1');
		expect(payload.DurationMinute).toBe('15');
		// Start Time
		expect(payload.StartDay).toBe('24');
    expect(payload.StartMonth).toBe('05');
    expect(payload.StartYear).toBe('2001');
		expect(payload.StartHour).toBe('23');
		expect(payload.StartMinute).toBe('30');
		// End Time
		expect(payload.EndDay).toBe('25');
    expect(payload.EndMonth).toBe('05');
    expect(payload.EndYear).toBe('2001');
    expect(payload.EndHour).toBe('0');
    expect(payload.EndMinute).toBe('45');

    expect(refetchEvents).toHaveBeenCalled();
  });
});
