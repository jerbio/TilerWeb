import { useTranslation } from 'react-i18next';
import Button from '@/core/common/components/button';
import TileShareDialog from './TileShareDialog';

export default function TileShareDiscardDialog({
	onDiscard,
	onKeep,
	task = false,
	open = true,
	message,
}: {
	onDiscard: () => void;
	onKeep: () => void;
	task?: boolean;
	open?: boolean;
	message?: string;
}) {
	const { t } = useTranslation();
	return (
		<TileShareDialog
			size="compact"
			open={open}
			title={t('tileShareComposer.discardTitle', 'Discard changes?')}
			onClose={onKeep}
			footer={
				<>
					<Button type="button" onClick={onDiscard}>
						{t('tileShareComposer.discard', 'Discard changes')}
					</Button>
					<Button type="button" variant="brand" onClick={onKeep}>
						{t('tileShareComposer.keepEditing', 'Keep editing')}
					</Button>
				</>
			}
		>
			<p>
				{message ??
					(task
						? t(
								'tileShareComposer.discardTask',
								'Your unsaved tilette edits will be lost. Other tilettes will remain in the draft.'
							)
						: t(
								'tileShareComposer.discardShare',
								'Your share details and draft tilettes will be lost. No invitations have been sent.'
							))}
			</p>
		</TileShareDialog>
	);
}
