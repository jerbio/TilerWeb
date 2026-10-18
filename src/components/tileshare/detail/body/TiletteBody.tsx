import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate, TileshareMode, TiletteView } from '@/core/common/types/tileshare';
import { buildAssignees } from '@/core/util/tileshareAssignees';
import useResponsiveColumns from '@/hooks/useResponsiveColumns';
import usePagination from '@/hooks/usePagination';
import Tabs from '@/core/common/components/Tabs';
import ViewHeader from './ViewHeader';
import TiletteListView from './TiletteListView';
import AssigneeView from './AssigneeView';
import StatusBoardView from './StatusBoardView';
import TileShareTransition from '../../TileShareTransition';
import TileShareModeIcon from '../../TileShareModeIcon';

type TiletteBodyProps = {
	mode?: TileshareMode | null;
	clusterId: string;
	tilettes: TileShareTemplate[];
};

type Perspective = TileshareMode.Class | TileshareMode.Project;

// Allow for the lane gap as well as a comfortable card width.
const MIN_COLUMN_WIDTH = 316;
const TILETTES_PER_PAGE = 10;
const VIEW_STORAGE_KEY = 'tilesharedemo.detail.view';
const VALID_VIEWS = Object.values(TiletteView);

function readStoredView(): TiletteView | null {
	try {
		const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
		return VALID_VIEWS.find((view) => view === stored) ?? null;
	} catch {
		return null;
	}
}

function writeStoredView(view: TiletteView): void {
	try {
		window.localStorage.setItem(VIEW_STORAGE_KEY, view);
	} catch {
		// Ignore persistence failures (e.g. storage disabled or unavailable).
	}
}

const TiletteBody: React.FC<TiletteBodyProps> = ({ clusterId, tilettes, mode }) => {
	const { t } = useTranslation();
	const [view, setView] = useState<TiletteView>(() =>
		mode === TileshareMode.Class ? TiletteView.Assignee : (readStoredView() ?? TiletteView.List)
	);
	const [perspective, setPerspective] = useState<Perspective>(() =>
		mode === TileshareMode.Class ? TileshareMode.Class : TileshareMode.Project
	);
	const changePerspective = (next: Perspective) => {
		setPerspective(next);
		setView(next === TileshareMode.Class ? TiletteView.Assignee : TiletteView.List);
	};

	useEffect(() => {
		writeStoredView(view);
	}, [view]);

	// Measured on the always-mounted wrapper so the column count is available in
	// both views (the assignee board itself only exists while that view is open).
	const { ref, columns } = useResponsiveColumns<HTMLDivElement>(MIN_COLUMN_WIDTH);

	const assignees = useMemo(() => buildAssignees(tilettes), [tilettes]);
	const totalAssignees = assignees.length;
	const pageCount = Math.max(1, Math.ceil(totalAssignees / columns));
	const [page, setPage] = useState(0);

	useEffect(() => {
		if (page > pageCount - 1) setPage(pageCount - 1);
	}, [page, pageCount]);

	const safePage = Math.min(page, pageCount - 1);
	const visibleAssignees = assignees.slice(safePage * columns, safePage * columns + columns);

	// The list pages over the tilettes themselves, at a fixed page size — unlike
	// the assignee board, whose page size follows the column count.
	const {
		page: listPage,
		totalPages: listPageCount,
		pagedItems: visibleTilettes,
		setPage: setListPage,
	} = usePagination(tilettes, TILETTES_PER_PAGE, [clusterId]);

	const label =
		view === TiletteView.Assignee
			? t('tilesharedemo.detail.showingAssignees', {
					shown: visibleAssignees.length,
					total: totalAssignees,
				})
			: view === TiletteView.Board
				? t('tilesharedemo.detail.showingTilettes', {
						shown: tilettes.length,
						total: tilettes.length,
					})
				: t('tilesharedemo.detail.showingTilettes', {
						shown: visibleTilettes.length,
						total: tilettes.length,
					});

	return (
		<Wrap ref={ref}>
			{(mode === TileshareMode.Class || mode === TileshareMode.Project) && (
				<Tabs
					aria-label={t('tileShareModes.perspective', 'Share perspective')}
					value={perspective}
					onChange={(value) => {
						if (value === TileshareMode.Class || value === TileshareMode.Project)
							changePerspective(value);
					}}
					tabs={[
						{
							id: TileshareMode.Project,
							label: t('tileShareModes.projectView', 'Project view'),
							icon: <TileShareModeIcon mode={TileshareMode.Project} size={16} />,
						},
						{
							id: TileshareMode.Class,
							label: t('tileShareModes.classView', 'Class view'),
							icon: <TileShareModeIcon mode={TileshareMode.Class} size={16} />,
						},
					]}
				/>
			)}
			<ViewHeader
				label={label}
				toggle={
					<Tabs
						aria-label={t('tilesharedemo.detail.viewAria')}
						value={view}
						onChange={(id) => {
							const nextView = VALID_VIEWS.find((view) => view === id);
							if (!nextView) return;
							setView(nextView);
							setPerspective(
								id === TiletteView.Assignee
									? TileshareMode.Class
									: TileshareMode.Project
							);
						}}
						tabs={[
							{ id: TiletteView.List, label: t('tilesharedemo.detail.view.list') },
							{
								id: TiletteView.Assignee,
								label: t('tilesharedemo.detail.view.assignee'),
							},
							{
								id: TiletteView.Board,
								label: t('tilesharedemo.detail.view.board', 'Board view'),
							},
						]}
					/>
				}
			/>
			<TileShareTransition viewKey={view}>
				{view === TiletteView.List ? (
					<TiletteListView
						tilettes={visibleTilettes}
						clusterId={clusterId}
						showFooter={listPageCount > 1}
						hasPrev={listPage > 1}
						hasNext={listPage < listPageCount}
						onPrev={() => setListPage((p) => Math.max(1, p - 1))}
						onNext={() => setListPage((p) => Math.min(listPageCount, p + 1))}
					/>
				) : view === TiletteView.Board ? (
					<StatusBoardView tilettes={tilettes} clusterId={clusterId} />
				) : (
					<AssigneeView
						assignees={visibleAssignees}
						clusterId={clusterId}
						columns={columns}
						showFooter={pageCount > 1}
						hasPrev={safePage > 0}
						hasNext={safePage < pageCount - 1}
						onPrev={() => setPage((p) => Math.max(0, p - 1))}
						onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
					/>
				)}
			</TileShareTransition>
		</Wrap>
	);
};

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

export default TiletteBody;
