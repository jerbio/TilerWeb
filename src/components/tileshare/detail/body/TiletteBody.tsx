import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate } from '@/core/common/types/tileshare';
import { buildAssignees } from '@/core/util/tileshareAssignees';
import useResponsiveColumns from '@/hooks/useResponsiveColumns';
import usePagination from '@/hooks/usePagination';
import Tabs from '@/core/common/components/Tabs';
import ViewHeader from './ViewHeader';
import TiletteListView from './TiletteListView';
import AssigneeView from './AssigneeView';

type TiletteBodyProps = {
	clusterId: string;
	tilettes: TileShareTemplate[];
};

type View = 'list' | 'assignee';

const MIN_COLUMN_WIDTH = 230;
const TILETTES_PER_PAGE = 10;

const TiletteBody: React.FC<TiletteBodyProps> = ({ clusterId, tilettes }) => {
	const { t } = useTranslation();
	const [view, setView] = useState<View>('list');

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
		view === 'list'
			? t('tilesharedemo.detail.showingTilettes', {
					shown: visibleTilettes.length,
					total: tilettes.length,
				})
			: t('tilesharedemo.detail.showingAssignees', {
					shown: visibleAssignees.length,
					total: totalAssignees,
				});

	return (
		<Wrap ref={ref}>
			<ViewHeader
				label={label}
				toggle={
					<Tabs
						aria-label={t('tilesharedemo.detail.viewAria')}
						value={view}
						onChange={(id) => setView(id as View)}
						tabs={[
							{ id: 'list', label: t('tilesharedemo.detail.view.list') },
							{ id: 'assignee', label: t('tilesharedemo.detail.view.assignee') },
						]}
					/>
				}
			/>
			{view === 'list' ? (
				<TiletteListView
					tilettes={visibleTilettes}
					clusterId={clusterId}
					showFooter={listPageCount > 1}
					hasPrev={listPage > 1}
					hasNext={listPage < listPageCount}
					onPrev={() => setListPage((p) => Math.max(1, p - 1))}
					onNext={() => setListPage((p) => Math.min(listPageCount, p + 1))}
				/>
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
		</Wrap>
	);
};

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

export default TiletteBody;
