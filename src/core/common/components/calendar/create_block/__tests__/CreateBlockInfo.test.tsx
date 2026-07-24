import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import CreateBlockInfo from '../info';
import { InitialCreateBlockFormState } from '..';
import { initialCreateBlockFormState } from '../../data';
import { CalendarUIProvider } from '../../calendar-ui.provider';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

const mockSearchLocations = vi.fn();
vi.mock('@/services', () => ({
	scheduleService: {
		searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
	},
}));

describe('CreateBlockInfo – location nickname uniqueness flow', () => {
	const savedLocation = {
		id: 'saved-1',
		description: 'My Office',
		address: '100 Office Blvd',
		longitude: 0,
		latitude: 0,
		isVerified: false,
		isDefault: false,
		isNull: false,
		thirdPartyId: '',
		userId: 'user-123',
		source: 'none',
		nickname: 'office',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchLocations.mockResolvedValue([]);
	});

	function StatefulInfo({ initial = {} }: { initial?: Partial<InitialCreateBlockFormState> }) {
		const [formData, setFormData] = React.useState<InitialCreateBlockFormState>({
			...initialCreateBlockFormState,
			...initial,
		});

		const handler = {
			formData,
			setFormData,
			resetForm: vi.fn(),
			handleFormInputChange:
				(field: keyof InitialCreateBlockFormState) =>
				(eventOrValue: { target?: { value: unknown } } | unknown) => {
					const value =
						eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
							? (eventOrValue.target as { value: unknown }).value
							: eventOrValue;
					setFormData((prev) => ({ ...prev, [field]: value }));
				},
		} as unknown as Parameters<typeof CreateBlockInfo>[0]['formHandler'];

		return (
			<ThemeProvider defaultTheme="dark">
				<CalendarUIProvider demoMode={false}>
					<CreateBlockInfo formHandler={handler} />
				</CalendarUIProvider>
				<div data-testid="state-locationId">{String(formData.locationId)}</div>
				<div data-testid="state-locationTag">{formData.locationTag}</div>
				<div data-testid="state-location">{formData.location}</div>
			</ThemeProvider>
		);
	}

	async function openDropdown(user: ReturnType<typeof userEvent.setup>, query: string) {
		const locationInput = screen.getByPlaceholderText(
			'calendar.createBlock.info.location.placeholder'
		);
		await user.clear(locationInput);
		await user.type(locationInput, query);
		await vi.advanceTimersByTimeAsync(400);
		await waitFor(() => {
			expect(mockSearchLocations).toHaveBeenCalled();
		});
	}

	it('clears the locationId when the nickname (locationTag) is edited', async () => {
		const user = userEvent.setup();
		render(<StatefulInfo initial={{ locationId: 'saved-1', locationTag: 'office' }} />);

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('saved-1');

		const tagInput = screen.getByPlaceholderText(
			'calendar.createBlock.info.locationTag.placeholder'
		);
		await user.type(tagInput, '2');

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('null');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('office2');
	});

	it('keeps the locationId when selecting a saved result from the picker', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockSearchLocations.mockResolvedValue([savedLocation]);
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<StatefulInfo />);

		await openDropdown(user, 'office');
		await waitFor(() => {
			expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
		});

		await user.click(screen.getByText('100 Office Blvd'));

		expect(screen.getByTestId('state-locationId')).toHaveTextContent('saved-1');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('office');
		expect(screen.getByTestId('state-location')).toHaveTextContent('100 Office Blvd');
		vi.useRealTimers();
	});

	it('copies only the address and clears the locationId without adopting the nickname', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockSearchLocations.mockResolvedValue([savedLocation]);
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(<StatefulInfo />);

		await openDropdown(user, 'office');
		await waitFor(() => {
			expect(screen.getByText('100 Office Blvd')).toBeInTheDocument();
		});

		await user.click(screen.getByLabelText('calendarEvent.edit.copyAddressOnly'));

		expect(screen.getByTestId('state-location')).toHaveTextContent('100 Office Blvd');
		expect(screen.getByTestId('state-locationId')).toHaveTextContent('null');
		expect(screen.getByTestId('state-locationTag')).toHaveTextContent('');
		vi.useRealTimers();
	});
});
