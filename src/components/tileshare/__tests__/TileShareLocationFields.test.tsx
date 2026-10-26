import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import TileShareLocationFields from '../TileShareLocationFields';
import { emptyTileshareLocation } from '@/core/util/tileshareMode';

const mocks = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock('@/services', () => ({ scheduleService: { searchLocations: mocks.search } }));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
function Form() {
	const [value, setValue] = useState(emptyTileshareLocation);
	return (
		<>
			<TileShareLocationFields value={value} onChange={setValue} />
			<output>{JSON.stringify(value)}</output>
		</>
	);
}
beforeEach(() => mocks.search.mockReset());
describe('TileShare location lookup', () => {
	it('looks up typed locations and preserves verification when selecting and editing description', async () => {
		mocks.search.mockResolvedValue([
			{
				id: 'office',
				address: '123 Main Street',
				description: 'Main office',
				isVerified: true,
				source: 'google',
			},
		]);
		render(<Form />);
		fireEvent.change(screen.getByLabelText('Location (optional)'), {
			target: { value: 'Main' },
		});
		await screen.findByText('123 Main Street');
		expect(mocks.search).toHaveBeenCalledWith('Main');
		fireEvent.click(screen.getByText('123 Main Street'));
		expect(screen.getByTestId('location-verified-badge')).toBeTruthy();
		expect(screen.getByLabelText('calendarEvent.edit.locationDescription')).toHaveValue(
			'Main office'
		);
		fireEvent.change(screen.getByLabelText('calendarEvent.edit.locationDescription'), {
			target: { value: 'Meeting room' },
		});
		expect(screen.getByRole('status').textContent).toContain('"isVerified":true');
		fireEvent.change(screen.getByLabelText('Location (optional)'), {
			target: { value: 'Unlisted place' },
		});
		expect(screen.queryByTestId('location-verified-badge')).toBeNull();
	});
	it('clears the address, description, and verified state together', async () => {
		mocks.search.mockResolvedValue([
			{
				id: 'saved',
				address: 'Saved office',
				description: 'Work',
				isVerified: true,
				source: 'saved',
			},
		]);
		render(<Form />);
		fireEvent.change(screen.getByLabelText('Location (optional)'), {
			target: { value: 'Saved' },
		});
		fireEvent.click(await screen.findByText('Saved office'));
		const clear = screen
			.getByLabelText('Location (optional)')
			.parentElement?.querySelector('button');
		expect(clear).toBeTruthy();
		fireEvent.click(clear!);
		expect(screen.getByLabelText('Location (optional)')).toHaveValue('');
		expect(screen.getByLabelText('calendarEvent.edit.locationDescription')).toHaveValue('');
		expect(screen.queryByTestId('location-verified-badge')).toBeNull();
	});
	it('drops an old search response after the user changes the query', async () => {
		let resolveOld!: (value: unknown[]) => void;
		mocks.search
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve;
					})
			)
			.mockResolvedValueOnce([]);
		render(<Form />);
		fireEvent.change(screen.getByLabelText('Location (optional)'), {
			target: { value: 'Old office' },
		});
		await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(1));
		fireEvent.change(screen.getByLabelText('Location (optional)'), {
			target: { value: 'New office' },
		});
		resolveOld([{ id: 'old', address: 'Stale result', source: 'google' }]);
		await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(2));
		expect(screen.queryByText('Stale result')).toBeNull();
	});
});
