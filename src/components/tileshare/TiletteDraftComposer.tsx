import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
	ArrowDown,
	ArrowUp,
	ArrowRight,
	CalendarDays,
	Check,
	MapPin,
	Plus,
	Trash2,
	UserRound,
} from 'lucide-react';
import Button from '@/core/common/components/button';
import { TiletteDraft, TileshareMode } from '@/core/common/types/tileshare';
import { isValidRecipient } from '@/core/util/contact';
import { newTiletteDraft } from '@/core/util/tileshareDraft';
import TiletteDraftFields from './TiletteDraftFields';
import TileShareDialog from './TileShareDialog';
import TileShareDiscardDialog from './TileShareDiscardDialog';
import { tileShareReveal, tileShareInteraction } from './tileshareMotion';

export default function TiletteDraftComposer({
	value,
	onChange,
	mode,
	shareDeadline,
	onMoveShareDeadline,
	participants = [],
	disabled = false,
}: {
	value: TiletteDraft[];
	onChange: (value: TiletteDraft[]) => void;
	mode: TileshareMode;
	shareDeadline: string;
	onMoveShareDeadline: (deadline: string) => void;
	participants?: string[];
	disabled?: boolean;
}) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState<{ value: TiletteDraft; initial: string } | null>(null);
	const [discard, setDiscard] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const open = (task = newTiletteDraft()) => {
		const copy = {
			...task,
			recipients: [...task.recipients],
			location: { ...task.location },
			moveShareDeadline: false,
		};
		setEditing({ value: copy, initial: JSON.stringify(copy) });
		setError('');
	};
	const close = () => {
		if (editing && JSON.stringify(editing.value) !== editing.initial) setDiscard(true);
		else setEditing(null);
	};
	const save = () => {
		if (!editing || disabled) return;
		const task = { ...editing.value, name: editing.value.name.trim() };
		if (!task.name) {
			setError(t('tilesharedemo.detail.add.validation.nameRequired'));
			return;
		}
		const invalid =
			mode === TileshareMode.Project &&
			task.recipients.find((recipient) => !isValidRecipient(recipient));
		if (invalid) {
			setError(
				t('tilesharedemo.detail.add.validation.invalidRecipient', { recipient: invalid })
			);
			return;
		}
		const exists = value.some((item) => item.id === task.id);
		onChange(
			exists ? value.map((item) => (item.id === task.id ? task : item)) : [...value, task]
		);
		if (task.moveShareDeadline && task.deadline > shareDeadline)
			onMoveShareDeadline(task.deadline);
		setNotice(
			t(exists ? 'tileShareComposer.updated' : 'tileShareComposer.added', { name: task.name })
		);
		setEditing(null);
	};
	const move = (index: number, offset: number) => {
		const next = [...value];
		[next[index], next[index + offset]] = [next[index + offset], next[index]];
		onChange(next);
	};
	return (
		<Workspace>
			<Toolbar>
				<h2>{t('tileShareComposer.count', { count: value.length })}</h2>
				{value.length > 0 && (
					<Button variant="ghost" disabled={disabled} onClick={() => open()}>
						<Plus size={18} />
						{t('tileShareComposer.newTilette')}
					</Button>
				)}
			</Toolbar>
			{value.length === 0 && (
				<Empty>
					<h3>{t('tileShareComposer.emptyTitle')}</h3>
					<p>{t('tileShareComposer.emptyDescription')}</p>
				</Empty>
			)}
			<Grid>
				{value.map((task, index) => {
					const recipients =
						mode === TileshareMode.Class ? participants : task.recipients;
					return (
						<Card key={task.id}>
							<CardTitle>
								<h3>{task.name}</h3>
								<Button
									variant="ghost"
									disabled={disabled}
									aria-label={t('tileShareComposer.editTilette', {
										name: task.name,
									})}
									onClick={() => open(task)}
								>
									<ArrowRight size={18} />
								</Button>
							</CardTitle>
							<Metadata>
								<span>
									<CalendarDays size={16} />
									{task.deadline || shareDeadline}
								</span>
								<span>
									<MapPin size={16} />
									{task.location.address || t('tileShareComposer.locationNotSet')}
									{task.location.address && task.location.isVerified && (
										<Check
											size={14}
											aria-label={t('location.verified.label')}
										/>
									)}
								</span>
							</Metadata>
							<People>
								<UserRound size={16} />
								<span>
									{recipients.length
										? recipients.slice(0, 2).join(', ')
										: t('tileShareComposer.unassigned')}
									{recipients.length > 2 && ` +${recipients.length - 2}`}
								</span>
							</People>
							<CardActions>
								<Button
									variant="ghost"
									disabled={disabled || index === 0}
									aria-label={t('tileShareModes.moveUp')}
									onClick={() => move(index, -1)}
								>
									<ArrowUp size={16} />
								</Button>
								<Button
									variant="ghost"
									disabled={disabled || index === value.length - 1}
									aria-label={t('tileShareModes.moveDown')}
									onClick={() => move(index, 1)}
								>
									<ArrowDown size={16} />
								</Button>
								<Button
									variant="ghost"
									disabled={disabled}
									aria-label={t('tileShareComposer.removeTilette', {
										name: task.name,
									})}
									onClick={() => {
										onChange(value.filter((item) => item.id !== task.id));
										setNotice(
											t('tileShareComposer.removed', { name: task.name })
										);
									}}
								>
									<Trash2 size={16} />
								</Button>
							</CardActions>
						</Card>
					);
				})}
				{value.length === 0 && (
					<AddCard>
						<Button variant="primary" disabled={disabled} onClick={() => open()}>
							<Plus size={18} />
							{t('tileShareModes.addTilette')}
						</Button>
					</AddCard>
				)}
			</Grid>
			<Notice role="status">{notice}</Notice>
			<TileShareDialog
				open={!!editing}
				title={t(
					value.some((item) => item.id === editing?.value.id)
						? 'tileShareComposer.editTitle'
						: 'tileShareComposer.addTitle'
				)}
				onClose={close}
				footer={
					<>
						<Button variant="ghost" disabled={disabled} onClick={close}>
							{t('tilesharedemo.detail.add.cancel')}
						</Button>
						<Button variant="brand" disabled={disabled} onClick={save}>
							{t('tileShareComposer.saveTilette')}
						</Button>
					</>
				}
			>
				<p>
					{t(
						mode === TileshareMode.Class
							? 'tileShareComposer.classHint'
							: 'tileShareComposer.projectHint'
					)}
				</p>
				{error && <ErrorMessage role="alert">{error}</ErrorMessage>}
				{editing && (
					<TiletteDraftFields
						value={editing.value}
						onChange={(task) => setEditing({ ...editing, value: task })}
						mode={mode}
						shareDeadline={shareDeadline}
						disabled={disabled}
					/>
				)}
			</TileShareDialog>
			<TileShareDiscardDialog
				open={discard}
				task
				onKeep={() => setDiscard(false)}
				onDiscard={() => {
					setDiscard(false);
					setEditing(null);
				}}
			/>
		</Workspace>
	);
}
const Workspace = styled.section`
	${tileShareReveal}
	padding: 24px;
	flex: 1;
`;
const Toolbar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 24px;
	h2 {
		font-size: 18px;
		margin: 0;
	}
`;
const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
	gap: 20px;
`;
const Card = styled.article`
	${tileShareReveal}
	${tileShareInteraction}
	&:hover {
		border-color: ${({ theme }) => theme.colors.border.strong};
	}
	min-width: 0;
	overflow: hidden;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.025);
	border-radius: 16px;
	background: ${({ theme }) => theme.colors.background.card};
`;
const CardTitle = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	h3 {
		margin: 0;
		font-size: 16px;
		overflow-wrap: anywhere;
	}
`;
const Metadata = styled.div`
	padding: 12px 16px;
	display: grid;
	gap: 10px;
	color: ${({ theme }) => theme.colors.text.secondary};
	span {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-wrap: anywhere;
	}
	svg {
		flex-shrink: 0;
	}
`;
const People = styled.div`
	padding: 0 16px 12px;
	display: flex;
	gap: 8px;
	align-items: center;
	overflow-wrap: anywhere;
	svg {
		flex-shrink: 0;
	}
`;
const CardActions = styled.div`
	display: flex;
	justify-content: flex-end;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	padding: 4px 8px;
`;
const AddCard = styled.div`
	background: ${({ theme }) => theme.colors.background.card};
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 170px;
	border: 1px dashed ${({ theme }) => theme.colors.border.default};
	border-radius: 16px;
`;
const Empty = styled.div`
	margin: 32px 0;
	color: ${({ theme }) => theme.colors.text.secondary};
	h3 {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;
const Notice = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	min-height: 20px;
	margin-top: 24px;
`;
const ErrorMessage = styled.p`
	color: ${({ theme }) => theme.colors.brand[500]};
`;
