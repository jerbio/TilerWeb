import React from 'react';
import { HelpCircle, Play, Check, Trash2, Pencil } from 'lucide-react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
	CalendarEvent,
	CalendarSearchItem,
	CalendarSearchSource,
	CalendarSearchSourceStatus,
} from '@/core/common/types/schedule';
import { CalendarSearchUnavailableError } from '@/core/common/types/errors';
import { useTheme } from '@/core/theme/ThemeProvider';
import colorUtil from '@/core/util/colors';
import TimeUtil from '@/core/util/time';

export type SearchResultsActionConfirming = {
	eventId: string;
	action: 'complete' | 'delete';
};

export type SearchResultsProps = {
	/** Current query string (used in the "not found" message). */
	query: string;
	// Legacy (single-source) visibility + data.
	showResults: boolean;
	showNotFound: boolean;
	results: CalendarEvent[];
	hasMore: boolean;
	isLoadingMore: boolean;
	// Shared action state.
	actionLoading: Record<string, string>;
	confirmingAction: SearchResultsActionConfirming | null;
	isInteractionBlocked: boolean;
	// Shared action callbacks.
	onEdit: (event: CalendarEvent) => void;
	onSetAsNow: (eventId: string) => void;
	onMarkComplete: (eventId: string) => void;
	onDelete: (eventId: string, item?: CalendarSearchItem) => void;
	onConfirmAction: () => void;
	onCancelConfirm: () => void;
	onLoadMore: () => void;
	// Multi-source (Phase 4) visibility + data.
	isMultiSource: boolean;
	showMsResults: boolean;
	showMsUnavailable: boolean;
	showMsNotFound: boolean;
	msItems: CalendarSearchItem[];
	msSources: CalendarSearchSourceStatus[];
	searchUnavailable: CalendarSearchUnavailableError | null;
	// Multi-source callbacks.
	onMultiSourceEdit: (item: CalendarSearchItem) => void;
	onRetrySearch: () => void;
	onDismissNotFound: () => void;
	onCreate: () => void;
};

/** i18n key for a source vocabulary value (`tiler`/`google`/`microsoft`). */
const sourceLabelKey = (source: string): string => {
	switch (source) {
		case CalendarSearchSource.Google:
			return 'timeline.multiSource.sourceGoogle';
		case CalendarSearchSource.Microsoft:
			return 'timeline.multiSource.sourceMicrosoft';
		default:
			return 'timeline.multiSource.sourceTiler';
	}
};

/**
 * Presentation-only rendering of the search results dropdown(s) for the
 * timeline search bar: legacy single-source rows, multi-source rows,
 * partial-failure / unavailable prompts and the "not found" prompt.
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
	query,
	showResults,
	showNotFound,
	results,
	hasMore,
	isLoadingMore,
	actionLoading,
	confirmingAction,
	isInteractionBlocked,
	onEdit,
	onSetAsNow,
	onMarkComplete,
	onDelete,
	onConfirmAction,
	onCancelConfirm,
	onLoadMore,
	isMultiSource,
	showMsResults,
	showMsUnavailable,
	showMsNotFound,
	msItems,
	msSources,
	searchUnavailable,
	onMultiSourceEdit,
	onRetrySearch,
	onDismissNotFound,
	onCreate,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();

	// Multi-source (Phase 4) derived state.
	const msHasPartialFailure = msSources.some(
		(s) => s.status === 'partial' || s.status === 'failed'
	);
	const msFailedSourceLabels = msSources
		.filter((s) => s.status === 'partial' || s.status === 'failed')
		.map((s) => t(sourceLabelKey(s.source)))
		.join(', ');

	return (
		<>
			{showResults && (
				<ResultsDropdown data-testid="search-results-dropdown">
					{results.map((event) => {
						const rgb = {
							r: event.colorRed ?? 0,
							g: event.colorGreen ?? 0,
							b: event.colorBlue ?? 0,
						};
						const adjusted = isDarkMode ? colorUtil.setLightness(rgb, 0.6) : rgb;
						const eventId = event.id ?? '';
						const itemAction = actionLoading[eventId];
						const isConfirming = confirmingAction?.eventId === eventId;
						return (
							<ResultItem key={event.id} data-testid="search-result-item">
								<ColorDot
									data-testid="result-color-dot"
									$r={adjusted.r}
									$g={adjusted.g}
									$b={adjusted.b}
									$isBlock={!!event.isRigid}
								/>
								<ResultName>{event.name}</ResultName>
								<ResultTime>{TimeUtil.relativeTime(event.start ?? 0)}</ResultTime>
								{isConfirming ? (
									<ConfirmInline data-testid="confirm-inline">
										<ConfirmText>
											{confirmingAction.action === 'complete'
												? t('timeline.confirmCompleteTitle')
												: t('timeline.confirmDeleteTitle')}
										</ConfirmText>
										<ConfirmButton
											data-testid="confirm-yes"
											onClick={(e) => {
												e.stopPropagation();
												onConfirmAction();
											}}
											$danger={confirmingAction.action === 'delete'}
											$success={confirmingAction.action === 'complete'}
										>
											{t('timeline.confirmAction')}
										</ConfirmButton>
										<ConfirmButton
											data-testid="confirm-cancel"
											onClick={(e) => {
												e.stopPropagation();
												onCancelConfirm();
											}}
										>
											{t('timeline.cancelAction')}
										</ConfirmButton>
									</ConfirmInline>
								) : (
									<ResultActions data-testid="result-actions">
										<ActionButton
											data-testid="action-edit"
											title={t('timeline.editEvent')}
											onClick={(e) => {
												e.stopPropagation();
												onEdit(event);
											}}
											disabled={isInteractionBlocked}
										>
											<Pencil size={12} />
										</ActionButton>
										<ActionButton
											data-testid="action-set-as-now"
											title={t('timeline.setAsNow')}
											onClick={(e) => {
												e.stopPropagation();
												onSetAsNow(eventId);
											}}
											disabled={isInteractionBlocked}
										>
											{itemAction === 'now' ? (
												<ActionSpinner />
											) : (
												<Play size={12} />
											)}
										</ActionButton>
										<ActionButton
											data-testid="action-mark-complete"
											title={t('timeline.markComplete')}
											onClick={(e) => {
												e.stopPropagation();
												onMarkComplete(eventId);
											}}
											disabled={isInteractionBlocked}
										>
											{itemAction === 'complete' ? (
												<ActionSpinner />
											) : (
												<Check size={12} />
											)}
										</ActionButton>
										<ActionButton
											data-testid="action-delete"
											title={t('timeline.markDeleted')}
											onClick={(e) => {
												e.stopPropagation();
												onDelete(eventId);
											}}
											disabled={isInteractionBlocked}
											$danger
										>
											{itemAction === 'delete' ? (
												<ActionSpinner />
											) : (
												<Trash2 size={12} />
											)}
										</ActionButton>
									</ResultActions>
								)}
							</ResultItem>
						);
					})}
					{hasMore && (
						<LoadMoreButton
							data-testid="load-more-button"
							onClick={onLoadMore}
							disabled={isLoadingMore || isInteractionBlocked}
						>
							{isLoadingMore ? t('timeline.loading') : t('timeline.loadMore')}
						</LoadMoreButton>
					)}
				</ResultsDropdown>
			)}

			{showNotFound && (
				<NotFoundPrompt data-testid="search-not-found">
					<NotFoundIcon>
						<HelpCircle size={24} />
					</NotFoundIcon>
					<NotFoundText>{t('timeline.notFoundMessage', { query })}</NotFoundText>
					<NotFoundActions>
						<DismissButton onClick={onDismissNotFound}>
							{t('timeline.notFoundDismiss')}
						</DismissButton>
						<CreateButton onClick={onCreate}>
							{t('timeline.notFoundCreate')}
						</CreateButton>
					</NotFoundActions>
				</NotFoundPrompt>
			)}
			{isMultiSource && showMsResults && (
				<ResultsDropdown data-testid="search-results-dropdown">
					{msHasPartialFailure && (
						<PartialWarning data-testid="partial-warning">
							<PartialWarningText>
								{t('timeline.multiSource.partialFailure', {
									sources: msFailedSourceLabels,
								})}
							</PartialWarningText>
							<RetryButton data-testid="retry-search" onClick={onRetrySearch}>
								{t('timeline.multiSource.retrySearch')}
							</RetryButton>
						</PartialWarning>
					)}
					{msItems.map((item) => (
						<MultiSourceRow key={item.id} data-testid="search-result-item">
							<MultiSourceRowLine>
								<ResultName>{item.name}</ResultName>
								<SourceBadge data-testid="source-badge">
									{t(sourceLabelKey(item.source))}
								</SourceBadge>
							</MultiSourceRowLine>
							<MultiSourceRowLine>
								<ResultTime>{TimeUtil.relativeTime(item.start)}</ResultTime>
								{item.thirdPartyUserId && (
									<ConnectedAccount data-testid="connected-account">
										{t('timeline.multiSource.connectedAccount', {
											account: item.thirdPartyUserId,
										})}
									</ConnectedAccount>
								)}
								{item.isReadOnly ? (
									<MsTrailing>
										<ReadOnlyBadge data-testid="read-only-badge">
											{t('timeline.multiSource.readOnly')}
										</ReadOnlyBadge>
									</MsTrailing>
								) : (
									<MsTrailing>
										{confirmingAction?.eventId === item.id ? (
											<ConfirmInline data-testid="confirm-inline">
												<ConfirmText>
													{confirmingAction.action === 'complete'
														? t('timeline.confirmCompleteTitle')
														: t('timeline.confirmDeleteTitle')}
												</ConfirmText>
												<ConfirmButton
													data-testid="confirm-yes"
													onClick={(e) => {
														e.stopPropagation();
														onConfirmAction();
													}}
													$danger={confirmingAction.action === 'delete'}
													$success={
														confirmingAction.action === 'complete'
													}
												>
													{t('timeline.confirmAction')}
												</ConfirmButton>
												<ConfirmButton
													data-testid="confirm-cancel"
													onClick={(e) => {
														e.stopPropagation();
														onCancelConfirm();
													}}
												>
													{t('timeline.cancelAction')}
												</ConfirmButton>
											</ConfirmInline>
										) : (
											<ResultActions data-testid="result-actions">
												{item.capabilities?.canEdit && (
													<ActionButton
														data-testid="action-edit"
														title={t('timeline.editEvent')}
														disabled={isInteractionBlocked}
														onClick={(e) => {
															e.stopPropagation();
															onMultiSourceEdit(item);
														}}
													>
														<Pencil size={12} />
													</ActionButton>
												)}
												{item.capabilities?.canSetAsNow && (
													<ActionButton
														data-testid="action-set-as-now"
														title={t('timeline.setAsNow')}
														disabled={isInteractionBlocked}
														onClick={(e) => {
															e.stopPropagation();
															onSetAsNow(item.id);
														}}
													>
														<Play size={12} />
													</ActionButton>
												)}
												{item.capabilities?.canComplete && (
													<ActionButton
														data-testid="action-mark-complete"
														title={t('timeline.markComplete')}
														disabled={isInteractionBlocked}
														onClick={(e) => {
															e.stopPropagation();
															onMarkComplete(item.id);
														}}
													>
														<Check size={12} />
													</ActionButton>
												)}
												{item.capabilities?.canDelete && (
													<ActionButton
														data-testid="action-delete"
														title={t('timeline.markDeleted')}
														disabled={isInteractionBlocked}
														$danger
														onClick={(e) => {
															e.stopPropagation();
															onDelete(item.id, item);
														}}
													>
														<Trash2 size={12} />
													</ActionButton>
												)}
											</ResultActions>
										)}
									</MsTrailing>
								)}
							</MultiSourceRowLine>
						</MultiSourceRow>
					))}
				</ResultsDropdown>
			)}

			{isMultiSource && showMsUnavailable && (
				<UnavailablePrompt data-testid="search-unavailable">
					<NotFoundText>
						{searchUnavailable?.message || t('timeline.multiSource.unavailable')}
					</NotFoundText>
				</UnavailablePrompt>
			)}

			{isMultiSource && showMsNotFound && (
				<NotFoundPrompt data-testid="search-not-found">
					<NotFoundIcon>
						<HelpCircle size={24} />
					</NotFoundIcon>
					<NotFoundText>{t('timeline.notFoundMessage', { query })}</NotFoundText>
					<NotFoundActions>
						<DismissButton onClick={onDismissNotFound}>
							{t('timeline.notFoundDismiss')}
						</DismissButton>
						<CreateButton onClick={onCreate}>
							{t('timeline.notFoundCreate')}
						</CreateButton>
					</NotFoundActions>
				</NotFoundPrompt>
			)}
		</>
	);
};

const ResultsDropdown = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 4px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	max-height: 300px;
	overflow-y: auto;
`;

const ResultItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.primary};
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	}
`;

const MultiSourceRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 10px 12px;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.primary};
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	}
`;

const MultiSourceRowLine = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
`;

const MsTrailing = styled.div`
	display: flex;
	align-items: center;
	margin-left: auto;
	flex-shrink: 0;
`;

const ColorDot = styled.span<{ $r: number; $g: number; $b: number; $isBlock: boolean }>`
	width: 10px;
	height: 10px;
	border-radius: ${({ $isBlock }) => ($isBlock ? '3px' : '50%')};
	flex-shrink: 0;
	background-color: ${({ $r, $g, $b }) => `rgb(${$r}, ${$g}, ${$b})`};
	box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
`;

const ResultName = styled.span`
	flex: 1;
	min-width: 0;
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ResultTime = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text.muted};
	white-space: nowrap;
`;

const ResultActions = styled.div`
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 4px;
	background: transparent;
	color: ${({ theme, $danger }) => ($danger ? theme.colors.text.muted : theme.colors.text.muted)};
	cursor: pointer;
	padding: 0;
	transition:
		background 0.1s ease,
		color 0.1s ease;

	&:hover:not(:disabled) {
		background: ${({ theme, $danger }) =>
			$danger ? 'rgba(220, 38, 38, 0.1)' : theme.colors.background.card2};
		color: ${({ $danger, theme }) => ($danger ? '#dc2626' : theme.colors.text.primary)};
	}

	&:disabled {
		cursor: default;
		opacity: 0.5;
	}
`;

const ActionSpinner = styled.div`
	width: 10px;
	height: 10px;
	border: 1.5px solid ${({ theme }) => theme.colors.border.default};
	border-top-color: ${({ theme }) => theme.colors.text.secondary};
	border-radius: 50%;
	animation: action-spin 0.6s linear infinite;

	@keyframes action-spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

const ConfirmInline = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
`;

const ConfirmText = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.text.muted};
	white-space: nowrap;
`;

const ConfirmButton = styled.button<{ $danger?: boolean; $success?: boolean }>`
	padding: 2px 8px;
	border: 1px solid
		${({ theme, $danger, $success }) =>
			$danger
				? 'rgba(220, 38, 38, 0.4)'
				: $success
					? 'rgba(18, 183, 106, 0.4)'
					: theme.colors.border.default};
	border-radius: 4px;
	background: ${({ $danger, $success }) =>
		$danger ? 'rgba(220, 38, 38, 0.1)' : $success ? 'rgba(18, 183, 106, 0.1)' : 'transparent'};
	color: ${({ theme, $danger, $success }) =>
		$danger ? '#dc2626' : $success ? '#12b76a' : theme.colors.text.secondary};
	font-size: 11px;
	cursor: pointer;
	white-space: nowrap;
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme, $danger, $success }) =>
			$danger
				? 'rgba(220, 38, 38, 0.2)'
				: $success
					? 'rgba(18, 183, 106, 0.2)'
					: theme.colors.background.card2};
	}
`;

const SourceBadge = styled.span`
	padding: 1px 6px;
	border-radius: 8px;
	font-size: 10px;
	font-weight: 600;
	white-space: nowrap;
	flex-shrink: 0;
	background: ${({ theme }) => theme.colors.background.card2};
	color: ${({ theme }) => theme.colors.text.muted};
`;

const ConnectedAccount = styled.span`
	flex: 1;
	min-width: 0;
	font-size: 11px;
	color: ${({ theme }) => theme.colors.text.muted};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ReadOnlyBadge = styled.span`
	padding: 1px 6px;
	border-radius: 8px;
	font-size: 10px;
	font-weight: 600;
	white-space: nowrap;
	background: rgba(245, 158, 11, 0.15);
	color: #b45309;
`;

const PartialWarning = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-bottom: 1px solid rgba(245, 158, 11, 0.3);
	background: rgba(245, 158, 11, 0.08);
`;

const PartialWarningText = styled.span`
	flex: 1;
	font-size: 12px;
	color: #b45309;
`;

const RetryButton = styled.button`
	flex-shrink: 0;
	padding: 2px 10px;
	border: 1px solid rgba(245, 158, 11, 0.4);
	border-radius: 4px;
	background: transparent;
	color: #b45309;
	font-size: 11px;
	cursor: pointer;

	&:hover {
		background: rgba(245, 158, 11, 0.15);
	}
`;

const UnavailablePrompt = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 4px;
	padding: 16px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid rgba(220, 38, 38, 0.4);
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	text-align: center;
`;

const LoadMoreButton = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	cursor: pointer;
	text-align: center;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;

const NotFoundPrompt = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 4px;
	padding: 16px;
	background: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 50;
	text-align: center;
`;

const NotFoundIcon = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 8px;
	color: ${({ theme }) => theme.colors.text.muted};
`;

const NotFoundText = styled.p`
	font-size: 14px;
	color: ${({ theme }) => theme.colors.text.primary};
	margin: 0 0 12px;
	line-height: 1.4;
`;

const NotFoundActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 8px;
`;

const DismissButton = styled.button`
	padding: 6px 16px;
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: transparent;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
	cursor: pointer;

	&:hover {
		background: ${({ theme }) => theme.colors.background.card2};
	}
`;

const CreateButton = styled.button`
	padding: 6px 16px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	background: ${({ theme }) => theme.colors.text.primary};
	color: ${({ theme }) => theme.colors.background.card};
	font-size: 13px;
	cursor: pointer;

	&:hover {
		opacity: 0.9;
	}
`;
