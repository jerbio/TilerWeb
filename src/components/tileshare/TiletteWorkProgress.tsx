import { useNavigate } from 'react-router';
import { TileshareApi } from '@/api/tileshareApi';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { TileShareViewerContext } from './TiletteRsvpStatus';

export default function TiletteWorkProgress({
	tilette,
	assigneeId,
}: {
	tilette: TileShareTemplate;
	assigneeId?: string;
}) {
	const { isOwner, viewerId } = useContext(TileShareViewerContext);
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [opening, setOpening] = useState(false);
	const [openError, setOpenError] = useState(false);
	const own = tilette.designatedUsers?.find(
		(a) =>
			a.userId === viewerId &&
			(!assigneeId || assigneeId === viewerId) &&
			a.rsvpStatus === InvitationStatus.Accepted
	);
	const openTile = async () => {
		if (opening || !own?.designatedTileTemplateId) return;
		setOpening(true);
		setOpenError(false);
		try {
			const result = await new TileshareApi().getAssignmentResponse(
				own.designatedTileTemplateId
			);
			if (result.calendarId && result.invitationStatus === InvitationStatus.Accepted)
				navigate(`/timeline?calendarEventId=${encodeURIComponent(result.calendarId)}`);
			else setOpenError(true);
		} catch {
			setOpenError(true);
		} finally {
			setOpening(false);
		}
	};
	const assignments = (tilette.designatedUsers ?? []).filter(
		(a) =>
			a.rsvpStatus === InvitationStatus.Accepted &&
			(assigneeId
				? a.userId === assigneeId && (isOwner || assigneeId === viewerId)
				: isOwner || a.userId === viewerId)
	);
	if (!assignments.length) return null;
	const known = assignments.every(
		(a) =>
			a.completionPct != null &&
			Number.isFinite(a.completionPct) &&
			a.completionPct >= 0 &&
			a.completionPct <= 100
	);

	const progress = Math.round(
		assignments.reduce((sum, a) => sum + a.completionPct!, 0) / assignments.length
	);
	return (
		<ProgressWrap>
			{known ? (
				<>
					<progress
						value={progress}
						max={100}
						aria-label={t('tilesharePreview.progress', 'Completion')}
					/>
					<span>
						{new Intl.NumberFormat(i18n?.language, {
							style: 'percent',
							maximumFractionDigits: 0,
						}).format(progress / 100)}
					</span>
				</>
			) : (
				<span>{t('tilesharePreview.progressUnavailable', 'Progress unavailable')}</span>
			)}
			{isOwner && !assigneeId && (
				<small>
					{t('tilesharePreview.acceptedAssignments', '{{count}} accepted assignments', {
						count: assignments.length,
					})}
				</small>
			)}
			{own && (
				<button type="button" disabled={opening} onClick={() => void openTile()}>
					{t('tilesharePreview.openTile', 'Open tile')}
				</button>
			)}
			{openError && (
				<span role="alert">
					{t(
						'tilesharePreview.openTileError',
						'Your calendar tile could not be opened. Try again.'
					)}
				</span>
			)}
		</ProgressWrap>
	);
}
const ProgressWrap = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	flex: 1;
	min-width: 120px;
	color: ${({ theme }) => theme.colors.text.primary};
	progress {
		appearance: none;
		height: 8px;
		width: min(240px, 70%);
		border: 0;
		border-radius: 8px;
		overflow: hidden;
		background: ${({ theme }) => theme.colors.background.card2};
	}
	progress::-webkit-progress-bar {
		background: ${({ theme }) => theme.colors.background.card2};
	}
	progress::-webkit-progress-value {
		background: ${({ theme }) => theme.colors.text.success};
	}
	progress::-moz-progress-bar {
		background: ${({ theme }) => theme.colors.text.success};
	}
	button {
		min-height: 44px;
		padding: 8px 12px;
		border-radius: 8px;
		cursor: pointer;
		background: ${({ theme }) => theme.colors.background.card};
		color: ${({ theme }) => theme.colors.text.primary};
		border: 1px solid ${({ theme }) => theme.colors.border.default};
	}
	small {
		color: ${({ theme }) => theme.colors.text.secondary};
	}
`;
