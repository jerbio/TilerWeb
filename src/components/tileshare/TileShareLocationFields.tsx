import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LocationInput, { LocationInputController } from '@/core/common/components/location-input';
import Input from '@/core/common/components/input';
import { TileshareLocation } from '@/core/common/types/tileshare';
import { emptyTileshareLocation } from '@/core/util/tileshareMode';

export default function TileShareLocationFields({
	value,
	onChange,
	disabled = false,
	placeholder,
}: {
	value: TileshareLocation;
	onChange: (value: TileshareLocation) => void;
	disabled?: boolean;
	placeholder?: string;
}) {
	const { t } = useTranslation();
	const id = useId();
	const controller = useMemo<LocationInputController>(
		() => ({
			location: value.address,
			isVerified: value.isVerified,
			setLocation: (address) => onChange({ ...value, address, isVerified: false }),
			clearLocation: () => onChange(emptyTileshareLocation()),
			setFromSelection: (result) =>
				onChange({
					address: result.address,
					description: result.description ?? '',
					isVerified: result.isVerified,
				}),
		}),
		[value, onChange]
	);
	return (
		<fieldset
			disabled={disabled}
			style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: 12 }}
		>
			<LocationInput
				controller={controller}
				disabled={disabled}
				label={t('tileShareModes.location', 'Location (optional)')}
				placeholder={placeholder ?? t('calendarEvent.edit.locationSearchPlaceholder')}
			/>
			<Input
				name={id}
				label={t('calendarEvent.edit.locationDescription')}
				placeholder={t('calendarEvent.edit.locationDescriptionPlaceholder')}
				value={value.description}
				onChange={(event) => onChange({ ...value, description: event.target.value })}
			/>
		</fieldset>
	);
}
