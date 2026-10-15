import { useNavigate } from 'react-router';
import { TileshareApi } from '@/api/tileshareApi';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { InvitationStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { TileShareViewerContext } from './TiletteRsvpStatus';
import { validDesignatedUsers } from '@/core/util/tileshareAssignees';

export default function TiletteWorkProgress({
	tilette,
	assigneeId,
	compact = false,
}: {
	tilette: TileShareTemplate;
	assigneeId?: string;
	compact?: boolean;
}) {
	const { isOwner, viewerId } = useContext(TileShareViewerContext);
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [opening, setOpening] = useState(false);
	const [openError, setOpenError] = useState(false);
	const designated = validDesignatedUsers(tilette.designatedUsers);
	const own = designated.find(
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
	const assignments = designated.filter(
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
	const percentage = known
		? new Intl.NumberFormat(i18n?.language, {
				style: 'percent',
				maximumFractionDigits: 0,
			}).format(progress / 100)
		: '—';
	const label = known
		? `${t('tilesharePreview.progress', 'Completion')}: ${percentage}`
		: t('tilesharePreview.progressUnavailable', 'Progress unavailable');
	return (
		<ProgressWrap $compact={compact}>
			<Donut
				$state={!known ? 'unknown' : progress === 0 ? 'empty' : 'started'}
				role={known ? 'progressbar' : 'img'}
				aria-label={known ? t('tilesharePreview.progress', 'Completion') : label}
				aria-valuemin={known ? 0 : undefined}
				aria-valuemax={known ? 100 : undefined}
				aria-valuenow={known ? progress : undefined}
				aria-valuetext={known ? percentage : undefined}
				title={label}
			>
				<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
					<circle className="track" cx="22" cy="22" r="19" />
					{known && progress > 0 && (
						<circle
							className="completion"
							cx="22"
							cy="22"
							r="19"
							pathLength="100"
							strokeDasharray={`${progress} 100`}
							transform="rotate(-90 22 22)"
						/>
					)}
				</svg>
				<span aria-hidden="true">{percentage}</span>
				{!known && <ScreenReaderText>{label}</ScreenReaderText>}
			</Donut>
			{isOwner && !assigneeId && !compact && (
				<small>
					{t('tilesharePreview.acceptedAssignments', '{{count}} accepted assignments', {
						count: assignments.length,
					})}
				</small>
			)}
			{own && (
				<button
					type="button"
					disabled={opening}
					onClick={(event) => {
						// Some cards link to details; this action opens the assigned calendar tile.
						event.preventDefault();
						event.stopPropagation();
						void openTile();
					}}
				>
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
const ProgressWrap = styled.div<{ $compact: boolean }>`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	flex: 0 1 auto;
	min-width: 0;
	max-width: 100%;
	color: ${({ theme }) => theme.colors.text.primary};
	${({ $compact }) =>
		$compact &&
		`
		> div[role] { width: 36px; height: 36px; flex-basis: 36px; }
		&& button { min-height: 32px; padding: 6px 8px; font-size: 12px; white-space: nowrap; }
	`}
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

const Donut = styled.div<{ $state: 'empty' | 'started' | 'unknown' }>`
	position: relative;
	width: 44px;
	height: 44px;
	flex: 0 0 44px;
	display: grid;
	place-items: center;
	color: ${({ theme, $state }) =>
		$state === 'empty'
			? theme.colors.text.warning
			: $state === 'unknown'
				? theme.colors.text.secondary
				: theme.colors.text.success};
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: none;
		stroke-width: 3;
	}
	.track {
		stroke: ${({ theme, $state }) =>
			$state === 'started' ? theme.colors.background.card2 : 'currentColor'};
		opacity: ${({ $state }) => ($state === 'started' ? 1 : 0.5)};
		stroke-dasharray: ${({ $state }) => ($state === 'unknown' ? '3 3' : 'none')};
	}
	.completion {
		stroke: currentColor;
	}
	> span {
		font-size: 11px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
`;

const ScreenReaderText = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;
	border: 0;
`;
