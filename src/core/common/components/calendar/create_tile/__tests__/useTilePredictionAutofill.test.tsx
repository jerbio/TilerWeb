import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFormHandler from '@/hooks/useFormHandler';
import { initialCreateTileFormState } from '../../data';
import type { InitialCreateTileFormState } from '..';
import type { TilePredictionLocation } from '@/core/common/types/schedule';
import {
	applyPredictionToCreateTileForm,
	durationMsToFormParts,
	locationToFormValue,
	useTilePredictionAutofill,
} from '../useTilePredictionAutofill';

const mocks = vi.hoisted(() => ({
	getNewTilePrediction: vi.fn(),
}));

vi.mock('@/services', () => ({
	scheduleService: {
		getNewTilePrediction: mocks.getNewTilePrediction,
	},
}));

function makeForm(overrides: Partial<InitialCreateTileFormState> = {}): InitialCreateTileFormState {
	return {
		...initialCreateTileFormState,
		...overrides,
	};
}

function makeLocation(overrides: Partial<TilePredictionLocation> = {}): TilePredictionLocation {
	return {
		id: 'loc-1',
		description: '',
		address: '1 Market St',
		longitude: 0,
		latitude: 0,
		isDefault: false,
		isNull: false,
		thirdPartyId: null,
		userId: null,
		nickname: 'Office',
		source: 'tiler' as TilePredictionLocation['source'],
		isVerified: true,
		isAdHoc: false,
		...overrides,
	};
}

function renderAutofillHook(initialState = makeForm(), enabled = true) {
	return renderHook(() => {
		const formHandler = useFormHandler(initialState);
		const feedback = useTilePredictionAutofill(formHandler, enabled);
		return { ...formHandler, feedback };
	});
}

describe('tile prediction mapping helpers', () => {
	it('maps duration milliseconds into form hour and minute fields', () => {
		expect(durationMsToFormParts(5_400_000)).toEqual({
			durationHours: 1,
			durationMins: 30,
		});
	});

	it('maps saved locations into form location fields', () => {
		expect(locationToFormValue(makeLocation())).toEqual({
			location: '1 Market St',
			locationId: 'loc-1',
			locationSource: 'tiler',
			locationIsVerified: true,
			locationTag: 'Office',
		});
	});

	it('does not keep a location id for google or ad hoc locations', () => {
		expect(
			locationToFormValue(makeLocation({ source: 'google', isAdHoc: true })).locationId
		).toBeNull();
	});

	it('fills empty/default duration and location fields from prediction', () => {
		const applied = applyPredictionToCreateTileForm(
			makeForm(),
			{ duration: [3_600_000], location: [makeLocation()] },
			{ durationMs: null, location: null }
		);

		expect(applied.formData.durationHours).toBe(1);
		expect(applied.formData.durationMins).toBe(0);
		expect(applied.formData.location).toBe('1 Market St');
		expect(applied.formData.locationId).toBe('loc-1');
	});

	it('does not overwrite manual duration or location values', () => {
		const applied = applyPredictionToCreateTileForm(
			makeForm({
				durationHours: 2,
				durationMins: 15,
				location: 'Manual location',
			}),
			{ duration: [3_600_000], location: [makeLocation()] },
			{ durationMs: null, location: null }
		);

		expect(applied.formData.durationHours).toBe(2);
		expect(applied.formData.durationMins).toBe(15);
		expect(applied.formData.location).toBe('Manual location');
	});
});

describe('useTilePredictionAutofill', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mocks.getNewTilePrediction.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('fetches after a meaningful debounced title and directly fills the form', async () => {
		mocks.getNewTilePrediction.mockResolvedValue({
			duration: [7_200_000],
			location: [makeLocation({ address: 'Home', nickname: 'Home' })],
		});
		const { result } = renderAutofillHook();

		act(() => {
			result.current.setFormData((prev) => ({ ...prev, action: 'Study' }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(result.current.formData.durationHours).toBe(2);
		expect(result.current.formData.location).toBe('Home');
		expect(mocks.getNewTilePrediction).toHaveBeenCalledOnce();
		expect(mocks.getNewTilePrediction).toHaveBeenCalledWith('Study');
	});

	it('does not refetch when prediction-driven form values change but title is unchanged', async () => {
		mocks.getNewTilePrediction.mockResolvedValue({
			duration: [7_200_000],
			location: [makeLocation()],
		});
		const { result } = renderAutofillHook();

		act(() => {
			result.current.setFormData((prev) => ({ ...prev, action: 'Study' }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(result.current.formData.durationHours).toBe(2);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});

		expect(mocks.getNewTilePrediction).toHaveBeenCalledOnce();
	});

	it('ignores titles shorter than three characters', async () => {
		const { result } = renderAutofillHook();

		act(() => {
			result.current.setFormData((prev) => ({ ...prev, action: 'St' }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(mocks.getNewTilePrediction).not.toHaveBeenCalled();
	});

	it('exposes fetching feedback while prediction is pending', async () => {
		let resolvePrediction: (value: { duration: number[] }) => void = () => {};
		mocks.getNewTilePrediction.mockReturnValue(
			new Promise((resolve) => {
				resolvePrediction = resolve;
			})
		);
		const { result } = renderAutofillHook();

		act(() => {
			result.current.setFormData((prev) => ({ ...prev, action: 'Study' }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(result.current.feedback.isPredicting).toBe(true);

		await act(async () => {
			resolvePrediction({ duration: [3_600_000] });
		});

		expect(result.current.feedback.isPredicting).toBe(false);
	});

	it('highlights fields that were autofilled and clears the highlight after a delay', async () => {
		mocks.getNewTilePrediction.mockResolvedValue({
			duration: [7_200_000],
			location: [makeLocation({ address: 'Home', nickname: 'Home' })],
		});
		const { result } = renderAutofillHook();

		act(() => {
			result.current.setFormData((prev) => ({ ...prev, action: 'Study' }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(500);
		});

		expect(result.current.feedback.highlightedFields).toEqual({
			duration: true,
			location: true,
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1400);
		});

		expect(result.current.feedback.highlightedFields).toEqual({
			duration: false,
			location: false,
		});
	});
});
