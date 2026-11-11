import { useContext } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Tabs from '@/core/common/components/Tabs';
import { TileShareTemplate, TiletteView } from '@/core/common/types/tileshare';
import { sharePreferenceKey, useSharePreference } from '@/hooks/useSharePreference';
import { TileShareViewerContext } from './TiletteRsvpStatus';
import TiletteBody from './detail/body/TiletteBody';
import TileShareFilterToolbar, { ShareFilterContext, useShareFilters } from './TileShareFilters';
import { ProjectBoardActionsProvider } from './ProjectBoardActions';
import { ShareControls, ShareNavigation } from './TileShareControls';

export default function ProjectShareExperience({
	clusterId,
	tilettes,
}: {
	clusterId: string;
	tilettes: TileShareTemplate[];
}) {
	const { t } = useTranslation();
	const { isOwner, viewerId } = useContext(TileShareViewerContext);
	const key = sharePreferenceKey(viewerId, clusterId, 'project', isOwner);
	const filters = useShareFilters(`${key}:filters.v1`, tilettes);
	const views = isOwner
		? [TiletteView.Board, TiletteView.List, TiletteView.Assignee]
		: [TiletteView.List, TiletteView.Board];
	const [view, setView] = useSharePreference(
		`${key}:view`,
		views,
		isOwner ? TiletteView.Board : TiletteView.List
	);
	const [scope, setScope] = useSharePreference(
		`${key}:scope`,
		['all', 'mine'] as const,
		isOwner ? 'all' : 'mine'
	);
	return (
		<ShareFilterContext.Provider value={filters}>
			<ProjectBoardActionsProvider tilettes={tilettes} scope={scope}>
				<Experience
					aria-label={t(
						isOwner
							? 'shareExperience.projectOwner'
							: 'shareExperience.projectParticipant',
						isOwner ? 'Project management' : 'Project work'
					)}
				>
					<ShareControls>
						<ShareNavigation>
							<Tabs
								aria-label={t('shareExperience.scope', 'Work scope')}
								value={scope}
								onChange={(value) => {
									if (value === 'all' || value === 'mine') setScope(value);
								}}
								tabs={[
									{
										id: 'mine',
										label: t('shareExperience.myTilettes', 'My tilettes'),
									},
									{
										id: 'all',
										label: t('shareExperience.allTilettes', 'All tilettes'),
									},
								]}
							/>
							<Tabs
								aria-label={t('shareExperience.layout', 'Layout')}
								value={view}
								onChange={(value) => {
									const next = views.find((option) => option === value);
									if (next) setView(next);
								}}
								tabs={views.map((id) => ({
									id,
									label:
										id === TiletteView.Board
											? t('shareExperience.board', 'Board')
											: id === TiletteView.Assignee
												? t('shareExperience.people', 'People')
												: t('shareExperience.tilettes', 'Tilettes'),
								}))}
							/>
						</ShareNavigation>
						<TileShareFilterToolbar
							personalStatus={view === TiletteView.Assignee || scope === 'mine'}
						/>
					</ShareControls>
					<TiletteBody
						clusterId={clusterId}
						tilettes={tilettes}
						view={view}
						scope={scope}
					/>
				</Experience>
			</ProjectBoardActionsProvider>
		</ShareFilterContext.Provider>
	);
}
const Experience = styled.section`
	container: share-experience / inline-size;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	min-width: 0;
	gap: 16px;
	> * {
		min-width: 0;
	}
`;
