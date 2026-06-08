import { useCallback, useEffect, useRef, useState } from 'react';
import useFormHandler from '@/hooks/useFormHandler';
import useDebounce from '@/hooks/useDebounce';
import { scheduleService } from '@/services';
import { MINUTES_IN_HOUR, MS_PER_MINUTE } from '@/core/common/utils/timeUtils';
import type { TilePredictionLocation, TilePredictionResponse } from '@/core/common/types/schedule';
import type { InitialCreateTileFormState } from '.';

type CreateTileFormHandler = ReturnType<typeof useFormHandler<InitialCreateTileFormState>>;

type OwnedLocationValue = {
	location: string;
	locationId: string | null;
	locationSource: string;
	locationIsVerified: boolean;
	locationTag: string;
};

type PredictionOwnedFields = {
	durationMs: number | null;
	location: OwnedLocationValue | null;
};

export type TilePredictionAutofillFields = {
	duration: boolean;
	location: boolean;
};

export type TilePredictionAutofillFeedback = {
	isPredicting: boolean;
	highlightedFields: TilePredictionAutofillFields;
};

const EMPTY_OWNERSHIP: PredictionOwnedFields = {
	durationMs: null,
	location: null,
};

const EMPTY_AUTOFILL_FIELDS: TilePredictionAutofillFields = {
	duration: false,
	location: false,
};

const HIGHLIGHT_DURATION_MS = 1400;

export function durationMsToFormParts(ms: number) {
	const totalMins = Math.round(ms / MS_PER_MINUTE);
	return {
		durationHours: Math.floor(totalMins / MINUTES_IN_HOUR),
		durationMins: totalMins % MINUTES_IN_HOUR,
	};
}

export function locationToFormValue(location: TilePredictionLocation): OwnedLocationValue {
	return {
		location: location.address,
		locationId: location.source !== 'google' && !location.isAdHoc ? location.id : null,
		locationSource: location.source,
		locationIsVerified: location.isVerified,
		locationTag: location.nickname || '',
	};
}

function getFormDurationMs(formData: InitialCreateTileFormState) {
	return (formData.durationHours * MINUTES_IN_HOUR + formData.durationMins) * MS_PER_MINUTE;
}

function hasDefaultDuration(formData: InitialCreateTileFormState) {
	return formData.durationHours === 0 && formData.durationMins === 0;
}

function hasEmptyLocation(formData: InitialCreateTileFormState) {
	return (
		formData.location.trim().length === 0 &&
		formData.locationId === null &&
		formData.locationSource.length === 0 &&
		!formData.locationIsVerified &&
		formData.locationTag.length === 0
	);
}

function formMatchesLocation(formData: InitialCreateTileFormState, location: OwnedLocationValue) {
	return (
		formData.location === location.location &&
		formData.locationId === location.locationId &&
		formData.locationSource === location.locationSource &&
		formData.locationIsVerified === location.locationIsVerified &&
		formData.locationTag === location.locationTag
	);
}

function shouldAutofillDuration(
	formData: InitialCreateTileFormState,
	ownedDurationMs: number | null
) {
	return (
		hasDefaultDuration(formData) ||
		(ownedDurationMs !== null && getFormDurationMs(formData) === ownedDurationMs)
	);
}

function shouldAutofillLocation(
	formData: InitialCreateTileFormState,
	ownedLocation: OwnedLocationValue | null
) {
	return (
		hasEmptyLocation(formData) ||
		(ownedLocation !== null && formMatchesLocation(formData, ownedLocation))
	);
}

export function applyPredictionToCreateTileForm(
	formData: InitialCreateTileFormState,
	prediction: TilePredictionResponse | null,
	ownedFields: PredictionOwnedFields
) {
	if (!prediction) {
		return {
			formData,
			ownedFields,
			autofilledFields: { ...EMPTY_AUTOFILL_FIELDS },
		};
	}

	const nextFormData = { ...formData };
	const nextOwnedFields: PredictionOwnedFields = { ...ownedFields };
	const autofilledFields: TilePredictionAutofillFields = { ...EMPTY_AUTOFILL_FIELDS };
	const durationMs = prediction.duration?.[0] ?? null;
	const location = prediction.location?.[0] ?? null;

	if (durationMs !== null && shouldAutofillDuration(formData, ownedFields.durationMs)) {
		const durationParts = durationMsToFormParts(durationMs);
		nextFormData.durationHours = durationParts.durationHours;
		nextFormData.durationMins = durationParts.durationMins;
		nextOwnedFields.durationMs = durationMs;
		autofilledFields.duration = true;
	}

	if (location && shouldAutofillLocation(formData, ownedFields.location)) {
		const locationValue = locationToFormValue(location);
		nextFormData.location = locationValue.location;
		nextFormData.locationId = locationValue.locationId;
		nextFormData.locationSource = locationValue.locationSource;
		nextFormData.locationIsVerified = locationValue.locationIsVerified;
		nextFormData.locationTag = locationValue.locationTag;
		nextOwnedFields.location = locationValue;
		autofilledFields.location = true;
	}

	return { formData: nextFormData, ownedFields: nextOwnedFields, autofilledFields };
}

export function useTilePredictionAutofill(formHandler: CreateTileFormHandler, enabled: boolean) {
	const { formData, setFormData } = formHandler;
	const [isPredicting, setIsPredicting] = useState(false);
	const [highlightedFields, setHighlightedFields] = useState<TilePredictionAutofillFields>({
		...EMPTY_AUTOFILL_FIELDS,
	});
	const debouncedAction = useDebounce(formData.action, 500);
	const requestIdRef = useRef(0);
	const lastRequestedNameRef = useRef('');
	const ownedFieldsRef = useRef<PredictionOwnedFields>({ ...EMPTY_OWNERSHIP });
	const formDataRef = useRef(formData);
	const highlightTimersRef = useRef<{
		duration: ReturnType<typeof setTimeout> | null;
		location: ReturnType<typeof setTimeout> | null;
	}>({
		duration: null,
		location: null,
	});

	const clearFieldHighlights = useCallback(() => {
		Object.values(highlightTimersRef.current).forEach((timer) => {
			if (timer) clearTimeout(timer);
		});
		highlightTimersRef.current = { duration: null, location: null };
		setHighlightedFields({ ...EMPTY_AUTOFILL_FIELDS });
	}, []);

	const showFieldHighlights = useCallback(
		(fields: TilePredictionAutofillFields) => {
			if (!fields.duration && !fields.location) {
				clearFieldHighlights();
				return;
			}

			setHighlightedFields(fields);

			(['duration', 'location'] as const).forEach((field) => {
				if (highlightTimersRef.current[field]) {
					clearTimeout(highlightTimersRef.current[field]);
					highlightTimersRef.current[field] = null;
				}

				if (!fields[field]) return;

				highlightTimersRef.current[field] = setTimeout(() => {
					setHighlightedFields((prev) => ({ ...prev, [field]: false }));
					highlightTimersRef.current[field] = null;
				}, HIGHLIGHT_DURATION_MS);
			});
		},
		[clearFieldHighlights]
	);

	const clearOwnedFields = useCallback(() => {
		const ownedFields = ownedFieldsRef.current;
		setFormData((prev) => {
			const next = { ...prev };
			let changed = false;

			if (
				ownedFields.durationMs !== null &&
				getFormDurationMs(prev) === ownedFields.durationMs
			) {
				next.durationHours = 0;
				next.durationMins = 0;
				changed = true;
			}

			if (ownedFields.location && formMatchesLocation(prev, ownedFields.location)) {
				next.location = '';
				next.locationId = null;
				next.locationSource = '';
				next.locationIsVerified = false;
				next.locationTag = '';
				changed = true;
			}

			const result = changed ? next : prev;
			formDataRef.current = result;
			return result;
		});
		ownedFieldsRef.current = { ...EMPTY_OWNERSHIP };
	}, [setFormData]);

	useEffect(() => {
		formDataRef.current = formData;
		const ownedFields = ownedFieldsRef.current;
		if (
			ownedFields.durationMs !== null &&
			getFormDurationMs(formData) !== ownedFields.durationMs
		) {
			ownedFieldsRef.current = {
				...ownedFieldsRef.current,
				durationMs: null,
			};
		}

		if (ownedFields.location && !formMatchesLocation(formData, ownedFields.location)) {
			ownedFieldsRef.current = {
				...ownedFieldsRef.current,
				location: null,
			};
		}
	}, [formData]);

	useEffect(() => {
		if (!enabled) {
			requestIdRef.current += 1;
			lastRequestedNameRef.current = '';
			setIsPredicting(false);
			ownedFieldsRef.current = { ...EMPTY_OWNERSHIP };
			clearFieldHighlights();
		}
	}, [clearFieldHighlights, enabled]);

	useEffect(() => {
		if (!enabled) return;

		const name = debouncedAction.trim();
		if (name.length < 3) {
			requestIdRef.current += 1;
			lastRequestedNameRef.current = '';
			setIsPredicting(false);
			clearOwnedFields();
			clearFieldHighlights();
			return;
		}

		if (name === lastRequestedNameRef.current) return;

		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		lastRequestedNameRef.current = name;
		setIsPredicting(true);
		clearOwnedFields();
		clearFieldHighlights();

		scheduleService
			.getNewTilePrediction(name)
			.then((prediction) => {
				if (requestIdRef.current !== requestId) return;

				const applied = applyPredictionToCreateTileForm(
					formDataRef.current,
					prediction,
					ownedFieldsRef.current
				);
				ownedFieldsRef.current = applied.ownedFields;
				formDataRef.current = applied.formData;
				setFormData(applied.formData);
				showFieldHighlights(applied.autofilledFields);
				setIsPredicting(false);
			})
			.catch((error) => {
				if (requestIdRef.current !== requestId) return;
				console.error('Error fetching tile prediction', error);
				setIsPredicting(false);
			});
	}, [
		clearFieldHighlights,
		clearOwnedFields,
		debouncedAction,
		enabled,
		setFormData,
		showFieldHighlights,
	]);

	useEffect(
		() => () => {
			Object.values(highlightTimersRef.current).forEach((timer) => {
				if (timer) clearTimeout(timer);
			});
		},
		[]
	);

	return { isPredicting, highlightedFields };
}
