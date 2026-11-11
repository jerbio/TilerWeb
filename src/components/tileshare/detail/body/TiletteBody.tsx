import { useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { TileShareTemplate, TiletteView } from '@/core/common/types/tileshare';
import { buildAssignees, validDesignatedUsers } from '@/core/util/tileshareAssignees';
import { isMineAssignment } from '@/core/util/tileshareProgress';
import useResponsiveColumns from '@/hooks/useResponsiveColumns';
import usePagination from '@/hooks/usePagination';
import { TileShareViewerContext, TileShareWorkScopeContext } from '../../TiletteRsvpStatus';
import TiletteListView from './TiletteListView';
import AssigneeView from './AssigneeView';
import StatusBoardView from './StatusBoardView';
import TileShareTransition from '../../TileShareTransition';
import { useShareFilterContext } from '../../TileShareFilters';
import { matchesAssignment, matchesTilette } from '@/core/util/tileshareFilters';

/** Shared rendering only. Project/Class compositions own navigation and preferences. */
export default function TiletteBody({
	clusterId,
	tilettes,
	view = TiletteView.List,
	scope = 'all',
}: {
	clusterId: string;
	tilettes: TileShareTemplate[];
	view?: TiletteView;
	scope?: 'all' | 'mine';
}) {
	const { t } = useTranslation();
	const { viewerId } = useContext(TileShareViewerContext);
	const filters = useShareFilterContext();
	const filterKey = JSON.stringify(filters?.filters ?? null);
	const source = useMemo(
		() =>
			scope === 'mine'
				? tilettes.filter((task) => !!viewerId && isMineAssignment(task, viewerId))
				: tilettes,
		[scope, tilettes, viewerId]
	);
	const items = useMemo(
		() =>
			filters
				? source.filter((task) =>
						matchesTilette(
							task,
							filters.filters,
							filters.env,
							scope === 'mine' ? (viewerId ?? undefined) : undefined
						)
					)
				: source,
		[source, filters, scope, viewerId]
	);
	const { ref, columns } = useResponsiveColumns<HTMLDivElement>(316);
	const assignees = useMemo(() => {
		const people = buildAssignees(
			source,
			t('shareExperience.unknownParticipant', 'Unknown participant')
		);
		for (const person of people) {
			if (filters)
				person.tilettes = person.tilettes.filter((task) => {
					const assignment = validDesignatedUsers(task.designatedUsers).find(
						(a) => (a.userId ?? a.displayedIdentifier) === person.id
					);
					return (
						!!assignment &&
						matchesAssignment(task, assignment, filters.filters, filters.env)
					);
				});
		}
		const unassigned = items.filter(
			(task) => !validDesignatedUsers(task.designatedUsers).length
		);
		if (unassigned.length)
			people.push({
				id: '__unassigned__',
				name: t('tileShareComposer.unassigned', 'Unassigned'),
				avatar: { name: t('tileShareComposer.unassigned', 'Unassigned') },
				tilettes: unassigned,
			});
		return people.filter((person) => person.tilettes.length);
	}, [items, source, filters, t]);
	const [page, setPage] = useState(0);
	const pages = Math.max(1, Math.ceil(assignees.length / columns));
	const safePage = Math.min(page, pages - 1);
	const people = assignees.slice(safePage * columns, (safePage + 1) * columns);
	const list = usePagination(items, 10, [clusterId, scope, filterKey]);
	useEffect(() => {
		setPage(0);
	}, [clusterId, scope, filterKey]);
	const { page: currentListPage, totalPages: listPages, setPage: setListPage } = list;
	useEffect(() => {
		if (currentListPage > Math.max(1, listPages)) setListPage(Math.max(1, listPages));
	}, [currentListPage, listPages, setListPage]);
	return (
		<Wrap ref={ref}>
			{filters?.active && (
				<Count role="status">
					{t('tileShareFilters.matching', 'Matching tilettes: {{count}} of {{total}}', {
						count:
							view === TiletteView.Assignee
								? new Set(assignees.flatMap((person) => person.tilettes)).size
								: items.length,
						total: source.length,
					})}
				</Count>
			)}
			<Count>
				{view === TiletteView.Assignee
					? t('tilesharedemo.detail.showingAssignees', {
							shown: people.length,
							total: assignees.length,
						})
					: t('tilesharedemo.detail.showingTilettes', {
							shown:
								view === TiletteView.List ? list.pagedItems.length : items.length,
							total: items.length,
						})}
			</Count>
			{!(view === TiletteView.Assignee ? assignees.length : items.length) && (
				<Empty role="status">
					{filters?.active
						? t(
								'tileShareFilters.noResults',
								'No matching results. Change or clear your filters.'
							)
						: t(
								scope === 'mine'
									? 'shareExperience.noMyTilettes'
									: 'shareExperience.noTilettes',
								scope === 'mine'
									? 'You have no assigned tilettes yet.'
									: 'No tilettes yet.'
							)}
				</Empty>
			)}
			<TileShareWorkScopeContext.Provider value={scope}>
				<TileShareTransition viewKey={`${view}:${scope}`}>
					{view === TiletteView.Board ? (
						<StatusBoardView tilettes={items} clusterId={clusterId} scope={scope} />
					) : view === TiletteView.Assignee ? (
						<AssigneeView
							assignees={people}
							clusterId={clusterId}
							columns={columns}
							showFooter={pages > 1}
							hasPrev={safePage > 0}
							hasNext={safePage < pages - 1}
							onPrev={() => setPage(Math.max(0, safePage - 1))}
							onNext={() => setPage(Math.min(pages - 1, safePage + 1))}
						/>
					) : (
						<TiletteListView
							tilettes={list.pagedItems}
							clusterId={clusterId}
							showFooter={list.totalPages > 1}
							hasPrev={list.page > 1}
							hasNext={list.page < list.totalPages}
							onPrev={() => list.setPage(Math.max(1, list.page - 1))}
							onNext={() => list.setPage(Math.min(list.totalPages, list.page + 1))}
						/>
					)}
				</TileShareTransition>
			</TileShareWorkScopeContext.Provider>
		</Wrap>
	);
}
const Wrap = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 16px;
`;
const Count = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 13px;
`;
const Empty = styled.p`
	padding: 20px;
	margin: 0;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
