import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import CalendarEventInfo from '../calendar_event_info';
import { ScheduleSubCalendarEvent, ThirdPartyType } from '@/core/common/types/schedule';
import { CalendarUIProvider } from '../calendar-ui.provider';

// Mock services
vi.mock('@/services', () => ({
	scheduleService: {
		completeScheduleEvent: vi.fn(),
		setScheduleEventAsNow: vi.fn(),
		procrastinateScheduleEvent: vi.fn(),
		updateSubCalendarEvent: vi.fn(),
		deleteScheduleEvent: vi.fn(),
	},
}));

import { scheduleService } from '@/services';

// Minimal mock event that satisfies the component's usage
const createMockEvent = (
	overrides: Partial<ScheduleSubCalendarEvent> = {}
): ScheduleSubCalendarEvent =>
	({
		id: 'sub-event-id-123',
		name: 'Test Event',
		start: 1711296000000,
		end: 1711303200000,
		originalStart: 1711296000000,
		originalEnd: 1711303200000,
		calendarEventStart: 1711296000000,
		calendarEventEnd: 1711900800000,
		isSleep: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isRecurring: false,
		isProcrastinateEvent: false,
		isReadOnly: false,
		isWhatIf: false,
		colorRed: 120,
		colorGreen: 80,
		colorBlue: 200,
		colorOpacity: 1,
		address: '',
		addressDescription: '',
		description: '',
		searchdDescription: '',
		emojis: null,
		location: { longitude: 0, latitude: 0, address: '', description: '', isVerified: false },
		blob: { type: 0, note: '', id: 'blob-id' },
		styleProperties: {},
		split: 0,
		thirdPartyType: ThirdPartyType.Tiler,
		...overrides,
	}) as ScheduleSubCalendarEvent;

const renderWithProviders = (ui: React.ReactElement) =>
	render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider defaultTheme="light">
				<CalendarUIProvider>{ui}</CalendarUIProvider>
			</ThemeProvider>
		</I18nextProvider>
	);

describe('CalendarEventInfo – Action Buttons', () => {
	const mockOnEventAction = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders Complete, Now, and Defer action buttons when event is provided', () => {
		renderWithProviders(
			<CalendarEventInfo
				event={createMockEvent()}
				onEventAction={mockOnEventAction}
			/>
		);

		expect(screen.getByTitle('Complete')).toBeInTheDocument();
		expect(screen.getByTitle('Now')).toBeInTheDocument();
		expect(screen.getByTitle('Defer')).toBeInTheDocument();
	});

	it('does not render action buttons when event is null', () => {
		renderWithProviders(
			<CalendarEventInfo event={null} onEventAction={mockOnEventAction} />
		);

		expect(screen.queryByTitle('Complete')).not.toBeInTheDocument();
		expect(screen.queryByTitle('Now')).not.toBeInTheDocument();
		expect(screen.queryByTitle('Defer')).not.toBeInTheDocument();
	});

	describe('Complete action', () => {
		it('calls scheduleService.completeScheduleEvent with event id', async () => {
			vi.mocked(scheduleService.completeScheduleEvent).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Complete'));

			await waitFor(() => {
				expect(scheduleService.completeScheduleEvent).toHaveBeenCalledWith(
					'sub-event-id-123'
				);
			});
		});

		it('calls onEventAction callback on success', async () => {
			vi.mocked(scheduleService.completeScheduleEvent).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Complete'));

			await waitFor(() => {
				expect(mockOnEventAction).toHaveBeenCalled();
			});
		});

		it('does not call onEventAction on failure', async () => {
			vi.mocked(scheduleService.completeScheduleEvent).mockRejectedValueOnce(
				new Error('Network error')
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Complete'));

			await waitFor(() => {
				expect(scheduleService.completeScheduleEvent).toHaveBeenCalled();
			});
			expect(mockOnEventAction).not.toHaveBeenCalled();
		});
	});

	describe('Now action', () => {
		it('calls scheduleService.setScheduleEventAsNow with event id', async () => {
			vi.mocked(scheduleService.setScheduleEventAsNow).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Now'));

			await waitFor(() => {
				expect(scheduleService.setScheduleEventAsNow).toHaveBeenCalledWith(
					'sub-event-id-123'
				);
			});
		});

		it('calls onEventAction callback on success', async () => {
			vi.mocked(scheduleService.setScheduleEventAsNow).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Now'));

			await waitFor(() => {
				expect(mockOnEventAction).toHaveBeenCalled();
			});
		});
	});

	describe('Defer action', () => {
		it('shows duration picker when Defer button is clicked', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Defer'));

			// Duration picker inputs should appear
			expect(screen.getByLabelText('Days')).toBeInTheDocument();
			expect(screen.getByLabelText('Hours')).toBeInTheDocument();
			expect(screen.getByLabelText('Minutes')).toBeInTheDocument();
		});

		it('hides action buttons and shows picker inputs when Defer is clicked', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			// Buttons visible initially
			expect(screen.getByTitle('Complete')).toBeInTheDocument();

			fireEvent.click(screen.getByTitle('Defer'));

			// Buttons replaced by picker
			expect(screen.queryByTitle('Complete')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Now')).not.toBeInTheDocument();
		});

		it('hides duration picker when cancel is clicked', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			// Open picker
			fireEvent.click(screen.getByTitle('Defer'));
			expect(screen.getByLabelText('Days')).toBeInTheDocument();

			// Cancel
			fireEvent.click(screen.getByLabelText('Cancel'));

			// Buttons should be back
			expect(screen.getByTitle('Complete')).toBeInTheDocument();
			expect(screen.queryByLabelText('Days')).not.toBeInTheDocument();
		});

		it('confirm button is disabled when all durations are zero', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Defer'));

			const confirmButton = screen.getByLabelText('Confirm');
			expect(confirmButton).toBeDisabled();
		});

		it('calls procrastinateScheduleEvent with correct params when confirmed', async () => {
			vi.mocked(scheduleService.procrastinateScheduleEvent).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			// Open picker
			fireEvent.click(screen.getByTitle('Defer'));

			// Set duration values
			const daysInput = screen.getByLabelText('Days');
			const hoursInput = screen.getByLabelText('Hours');
			const minsInput = screen.getByLabelText('Minutes');

			fireEvent.change(daysInput, { target: { value: '1' } });
			fireEvent.change(hoursInput, { target: { value: '2' } });
			fireEvent.change(minsInput, { target: { value: '30' } });

			// Confirm
			fireEvent.click(screen.getByLabelText('Confirm'));

			const expectedMs = ((1 * 24 + 2) * 60 + 30) * 60 * 1000;

			await waitFor(() => {
				expect(scheduleService.procrastinateScheduleEvent).toHaveBeenCalledWith({
					EventID: 'sub-event-id-123',
					DurationDays: 1,
					DurationHours: 2,
					DurationMins: 30,
					DurationInMs: expectedMs,
				});
			});
		});

		it('calls onEventAction after successful defer', async () => {
			vi.mocked(scheduleService.procrastinateScheduleEvent).mockResolvedValueOnce({
				subCalendarEvents: [],
			});

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Defer'));

			const daysInput = screen.getByLabelText('Days');
			fireEvent.change(daysInput, { target: { value: '1' } });

			fireEvent.click(screen.getByLabelText('Confirm'));

			await waitFor(() => {
				expect(mockOnEventAction).toHaveBeenCalled();
			});
		});

		it('resets duration fields when picker is reopened', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			// Open picker and set values
			fireEvent.click(screen.getByTitle('Defer'));
			fireEvent.change(screen.getByLabelText('Days'), { target: { value: '5' } });

			// Cancel
			fireEvent.click(screen.getByLabelText('Cancel'));

			// Reopen
			fireEvent.click(screen.getByTitle('Defer'));

			// Values should be reset
			expect(screen.getByLabelText('Days')).toHaveValue(0);
			expect(screen.getByLabelText('Hours')).toHaveValue(0);
			expect(screen.getByLabelText('Minutes')).toHaveValue(0);
		});
	});

	describe('Button disabled state', () => {
		it('disables all action buttons while an action is loading', async () => {
			// Make complete hang (never resolves during this test)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let resolveComplete: (value: any) => void;
			vi.mocked(scheduleService.completeScheduleEvent).mockImplementation(
				() => new Promise((resolve) => { resolveComplete = resolve; })
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Complete'));

			// While loading, other buttons should be disabled
			await waitFor(() => {
				expect(screen.getByTitle('Now')).toBeDisabled();
				expect(screen.getByTitle('Defer')).toBeDisabled();
			});

			// Resolve to clean up
			resolveComplete!({ subCalendarEvents: [] });
		});
	});

	describe('Save (update) action', () => {
		it('calls scheduleService.updateSubCalendarEvent with changed name', async () => {
			vi.mocked(scheduleService.updateSubCalendarEvent).mockResolvedValueOnce(
				createMockEvent() as ScheduleSubCalendarEvent
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					isEditable={true}
				/>
			);

			// Click the event name to enter edit mode
			const nameElement = screen.getByText('Test Event');
			fireEvent.click(nameElement);

			// Change the name
			const nameInput = screen.getByDisplayValue('Test Event');
			fireEvent.change(nameInput, { target: { value: 'Updated Event' } });
			fireEvent.blur(nameInput);

			// Click Save button
			const saveButton = screen.getByTitle('Save');
			fireEvent.click(saveButton);

			await waitFor(() => {
				expect(scheduleService.updateSubCalendarEvent).toHaveBeenCalledWith(
					'sub-event-id-123',
					expect.objectContaining({ name: 'Updated Event' })
				);
			});
		});

		it('calls onEventAction after successful save', async () => {
			vi.mocked(scheduleService.updateSubCalendarEvent).mockResolvedValueOnce(
				createMockEvent() as ScheduleSubCalendarEvent
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					isEditable={true}
				/>
			);

			// Edit name
			fireEvent.click(screen.getByText('Test Event'));
			const nameInput = screen.getByDisplayValue('Test Event');
			fireEvent.change(nameInput, { target: { value: 'Updated Event' } });
			fireEvent.blur(nameInput);

			// Save
			fireEvent.click(screen.getByTitle('Save'));

			await waitFor(() => {
				expect(mockOnEventAction).toHaveBeenCalled();
			});
		});

		it('does not call onEventAction on save failure', async () => {
			vi.mocked(scheduleService.updateSubCalendarEvent).mockRejectedValueOnce(
				new Error('Network error')
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					isEditable={true}
				/>
			);

			// Edit name
			fireEvent.click(screen.getByText('Test Event'));
			const nameInput = screen.getByDisplayValue('Test Event');
			fireEvent.change(nameInput, { target: { value: 'Updated Event' } });
			fireEvent.blur(nameInput);

			// Save
			fireEvent.click(screen.getByTitle('Save'));

			await waitFor(() => {
				expect(scheduleService.updateSubCalendarEvent).toHaveBeenCalled();
			});
			expect(mockOnEventAction).not.toHaveBeenCalled();
		});

		it('does not include third-party fields when saving a Tiler event', async () => {
			vi.mocked(scheduleService.updateSubCalendarEvent).mockResolvedValueOnce(
				createMockEvent() as ScheduleSubCalendarEvent
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent({
						thirdPartyType: ThirdPartyType.Tiler,
						thirdPartyId: 'some-id',
						thirdPartyUserId: 'some-user',
					})}
					onEventAction={mockOnEventAction}
					isEditable={true}
				/>
			);

			// Edit name
			fireEvent.click(screen.getByText('Test Event'));
			const nameInput = screen.getByDisplayValue('Test Event');
			fireEvent.change(nameInput, { target: { value: 'Updated Event' } });
			fireEvent.blur(nameInput);

			// Save
			fireEvent.click(screen.getByTitle('Save'));

			await waitFor(() => {
				expect(scheduleService.updateSubCalendarEvent).toHaveBeenCalled();
			});

			const [, updates] = vi.mocked(scheduleService.updateSubCalendarEvent).mock.calls[0];
			expect(updates).toEqual(expect.objectContaining({ name: 'Updated Event' }));
			expect(updates).not.toHaveProperty('calendarType');
		});
	});

	describe('Third-party event behavior', () => {
		it('shows Delete button instead of Complete/Now/Defer for third-party events', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent({
						thirdPartyType: ThirdPartyType.Google,
						thirdPartyId: 'google-event-123',
						thirdPartyUserId: 'google-user-456',
					})}
					onEventAction={mockOnEventAction}
				/>
			);

			expect(screen.getByTitle('Delete')).toBeInTheDocument();
			expect(screen.queryByTitle('Complete')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Now')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Defer')).not.toBeInTheDocument();
		});

		it('does not show name edit pencil icon for third-party events', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent({
						thirdPartyType: ThirdPartyType.Google,
						thirdPartyId: 'google-event-123',
						thirdPartyUserId: 'google-user-456',
					})}
					onEventAction={mockOnEventAction}
					isEditable={true}
				/>
			);

			// Name should be displayed but not editable
			expect(screen.getByText('Test Event')).toBeInTheDocument();
			// The edit-icon pencil should not be present for the name
			const nameContainer = screen.getByText('Test Event').closest('div');
			expect(nameContainer?.querySelector('.edit-icon')).not.toBeInTheDocument();
		});

		it('calls deleteScheduleEvent with third-party fields when Delete is clicked', async () => {
			vi.mocked(scheduleService.deleteScheduleEvent).mockResolvedValueOnce(
				{} as ReturnType<typeof scheduleService.deleteScheduleEvent> extends Promise<infer T> ? T : never
			);

			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent({
						thirdPartyType: ThirdPartyType.Google,
						thirdPartyId: 'google-event-123',
						thirdPartyUserId: 'google-user-456',
					})}
					onEventAction={mockOnEventAction}
				/>
			);

			fireEvent.click(screen.getByTitle('Delete'));

			await waitFor(() => {
				expect(scheduleService.deleteScheduleEvent).toHaveBeenCalledWith(
					expect.any(String),
					ThirdPartyType.Google,
					'google-event-123',
					'google-user-456'
				);
			});
		});
	});

	describe('Read-only mode (readOnly prop)', () => {
		it('hides Complete, Now, and Defer action buttons when readOnly is true', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			expect(screen.queryByTitle('Complete')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Now')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Defer')).not.toBeInTheDocument();
		});

		it('hides More Options row when readOnly is true', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			expect(screen.queryByText('More options')).not.toBeInTheDocument();
		});

		it('hides Delete button for third-party events when readOnly is true', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent({
						thirdPartyType: ThirdPartyType.Google,
						thirdPartyId: 'google-event-123',
						thirdPartyUserId: 'google-user-456',
					})}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
		});

		it('does not show edit pencil icon on event name when readOnly is true', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			expect(screen.getByText('Test Event')).toBeInTheDocument();
			const nameContainer = screen.getByText('Test Event').closest('div');
			expect(nameContainer?.querySelector('.edit-icon')).not.toBeInTheDocument();
		});

		it('does not enter name editing mode on click when readOnly is true', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			fireEvent.click(screen.getByText('Test Event'));

			// Should not show an input field
			expect(screen.queryByDisplayValue('Test Event')).not.toBeInTheDocument();
			// Name should still be a heading, not editable
			expect(screen.getByText('Test Event')).toBeInTheDocument();
		});

		it('still displays event details (start, end, duration) in read-only mode', () => {
			renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			// Event name is visible
			expect(screen.getByText('Test Event')).toBeInTheDocument();
			// Time labels are visible
			expect(screen.getByText('Starts:')).toBeInTheDocument();
			expect(screen.getByText('Ends:')).toBeInTheDocument();
			expect(screen.getByText('Duration:')).toBeInTheDocument();
		});

		it('does not show edit pencil icons on time fields when readOnly is true', () => {
			const { container } = renderWithProviders(
				<CalendarEventInfo
					event={createMockEvent()}
					onEventAction={mockOnEventAction}
					readOnly
				/>
			);

			const allEditIcons = container.querySelectorAll('.edit-icon');
			expect(allEditIcons.length).toBe(0);
		});
	});
});
