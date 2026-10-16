import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import TagInput from '@/core/common/components/TagInput';
import { TiletteDraft, TileshareMode } from '@/core/common/types/tileshare';
import { defaultTiletteDeadline } from '@/core/util/tileshareDraft';
import TileShareLocationFields from './TileShareLocationFields';
import MarkdownNoteField from './MarkdownNoteField';

export default function TiletteDraftFields({
	value,
	onChange,
	mode,
	shareDeadline,
	disabled = false,
	allowMoveShareDeadline = true,
}: {
	value: TiletteDraft;
	onChange: (value: TiletteDraft) => void;
	mode: TileshareMode;
	shareDeadline?: string;
	disabled?: boolean;
	allowMoveShareDeadline?: boolean;
}) {
	const { t } = useTranslation();
	const id = useId();
	const update = (patch: Partial<TiletteDraft>) => onChange({ ...value, ...patch });
	return (
		<fieldset
			disabled={disabled}
			style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: 16 }}
		>
			<Input
				name={`${id}-name`}
				label={t('tilesharedemo.detail.add.fields.name.label')}
				placeholder={t('tilesharedemo.detail.add.fields.name.placeholder')}
				value={value.name}
				onChange={(event) => update({ name: event.target.value })}
			/>
			<DatePicker
				label={t('tilesharedemo.detail.add.fields.deadline.label')}
				placeholder={t('tilesharedemo.detail.add.fields.deadline.placeholder')}
				value={defaultTiletteDeadline(value.deadline || shareDeadline)}
				onChange={(deadline) => update({ deadline, moveShareDeadline: false })}
			/>
			{!value.deadline && shareDeadline && (
				<small>{t('tileShareModes.deadlineDefault', { deadline: shareDeadline })}</small>
			)}
			{value.deadline && shareDeadline && value.deadline > shareDeadline && (
				<p role="status">
					{t(
						'tileShareEdit.afterShare',
						'This tilette is due after the share’s deadline ({{deadline}}).',
						{ deadline: shareDeadline }
					)}
				</p>
			)}
			{allowMoveShareDeadline &&
				value.deadline &&
				shareDeadline &&
				value.deadline > shareDeadline && (
					<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<input
							type="checkbox"
							checked={value.moveShareDeadline ?? false}
							onChange={(event) =>
								update({ moveShareDeadline: event.target.checked })
							}
						/>
						{t('tileShareComposer.moveShareDeadline', { deadline: value.deadline })}
					</label>
				)}
			<TileShareLocationFields
				value={value.location}
				onChange={(location) => update({ location })}
				disabled={disabled}
			/>
			<MarkdownNoteField
				name={`${id}-note`}
				label={t('tilesharedemo.detail.add.fields.note.label')}
				placeholder={t('tilesharedemo.detail.add.fields.note.placeholder')}
				value={value.note}
				onChange={(note) => update({ note })}
				disabled={disabled}
				rows={3}
			/>
			{mode === TileshareMode.Class ? (
				<p>{t('tileShareModes.everyone')}</p>
			) : (
				<TagInput
					value={value.recipients}
					onChange={(recipients) => update({ recipients })}
					disabled={disabled}
					placeholder={t('tilesharedemo.detail.add.shareTo.placeholder')}
					addLabel={t('tileShareModes.addRecipient')}
					removeLabel={(recipient) => t('tileShareModes.removeRecipient', { recipient })}
					inputProps={{ 'aria-label': t('tileShareModes.assignees') }}
				/>
			)}
		</fieldset>
	);
}
