import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '@/core/common/components/button';
import { useTileNotes } from '@/hooks/useTileNotes';
import { tileShareNotesService, clusterNotesService } from '@/services/tileShareNotesService';
import MarkdownNoteField from './MarkdownNoteField';
import TileShareNote from './TileShareNote';
import TileShareDialog from './TileShareDialog';
import TileShareDiscardDialog from './TileShareDiscardDialog';

export default function TiletteNotes({
	id,
	canEdit,
	target = 'tilette',
}: {
	id: string;
	canEdit: boolean;
	target?: 'tilette' | 'cluster';
}) {
	const { t } = useTranslation();
	const { payload, isLoading, isSaving, error, conflict, refresh, save, clearConflict } =
		useTileNotes(
			id,
			'auto',
			target === 'cluster' ? clusterNotesService : tileShareNotesService
		);
	const [draft, setDraft] = useState<string | null>(null);
	const [initial, setInitial] = useState('');
	const [discard, setDiscard] = useState(false);
	const close = () => {
		if (isSaving) return;
		if (draft !== initial) setDiscard(true);
		else setDraft(null);
	};
	const submit = async () => {
		if (draft === null || isSaving || conflict) return;
		const result = await save(draft);
		if (result && !result.concurrencyConflict && !result.truncated) setDraft(null);
	};
	return (
		<section aria-label={t('tileShareNotes.title', 'Notes')}>
			<Top>
				<strong>{t('tileShareNotes.title', 'Notes')}</strong>
				{canEdit && payload && !isLoading && (
					<Button
						size="small"
						variant="ghost"
						onClick={() => {
							const note = payload.UserNote ?? '';
							setInitial(note);
							setDraft(note);
							clearConflict();
						}}
					>
						{t('tileShareNotes.edit', 'Edit notes')}
					</Button>
				)}
			</Top>
			{isLoading ? (
				<p role="status">{t('notesEditor.loading', 'Loading notes…')}</p>
			) : error && draft === null ? (
				<div role="alert">
					<p>{t('tileShareNotes.loadError', 'Could not load notes.')}</p>
					<Button variant="ghost" onClick={() => void refresh()}>
						{t('tileshareList.retry', 'Retry')}
					</Button>
				</div>
			) : payload?.UserNote ? (
				<TileShareNote content={payload.UserNote} />
			) : (
				<p>{t('tileShareNotes.empty', 'No notes yet.')}</p>
			)}
			<TileShareDialog
				size="wide"
				open={draft !== null}
				title={t('tileShareNotes.edit', 'Edit notes')}
				onClose={close}
				footer={
					<>
						<Button variant="ghost" disabled={isSaving} onClick={close}>
							{t('tilesharedemo.detail.edit.cancel', 'Cancel')}
						</Button>
						<Button
							variant="brand"
							disabled={isSaving || !!conflict}
							onClick={() => void submit()}
						>
							{t(
								isSaving
									? 'tilesharedemo.detail.edit.saving'
									: 'tilesharedemo.detail.edit.save'
							)}
						</Button>
					</>
				}
			>
				{error && (
					<p role="alert">
						{t(
							'tileShareNotes.saveError',
							'Could not save notes. Your edits are still here; try again.'
						)}
					</p>
				)}
				{payload?.truncated && (
					<p role="alert">
						{t(
							'tileShareNotes.truncated',
							'The note exceeded the server limit. Review the saved note before continuing.'
						)}
					</p>
				)}
				{conflict && (
					<div role="alert">
						<p>{t('notesEditor.conflict.title', 'Someone else updated this note.')}</p>
						<TileShareNote content={conflict.server.UserNote ?? ''} />
						<Button
							variant="primary"
							onClick={() => {
								setDraft(conflict.server.UserNote ?? '');
								setInitial(conflict.server.UserNote ?? '');
								clearConflict();
							}}
						>
							{t('tileShareNotes.useSaved', 'Use saved note')}
						</Button>
						<Button variant="primary" onClick={clearConflict}>
							{t('notesEditor.conflict.keep', 'Keep editing')}
						</Button>
					</div>
				)}
				<MarkdownNoteField
					name="note"
					label={t('tileShareNotes.title', 'Notes')}
					value={draft ?? ''}
					onChange={setDraft}
					disabled={isSaving}
					rows={8}
				/>
			</TileShareDialog>
			<TileShareDiscardDialog
				open={discard}
				task
				onKeep={() => setDiscard(false)}
				onDiscard={() => {
					setDiscard(false);
					setDraft(null);
				}}
			/>
		</section>
	);
}
const Top = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	strong {
		font-size: 14px;
		font-weight: 650;
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;
