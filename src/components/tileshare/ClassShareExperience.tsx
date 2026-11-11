import { ShareControls, ShareNavigation } from './TileShareControls';
import { useContext } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Tabs from '@/core/common/components/Tabs';
import Button from '@/core/common/components/button';
import { ContactModel, TileShareTemplate } from '@/core/common/types/tileshare';
import { sharePreferenceKey, useSharePreference } from '@/hooks/useSharePreference';
import { classParticipantRows } from '@/core/util/classShareParticipants';
import { TileShareViewerContext } from './TiletteRsvpStatus';
import TiletteBody from './detail/body/TiletteBody';
import ClassParticipantsOverview from './detail/body/ClassParticipantsOverview';
import ClassShareActions from './ClassShareActions';
import TileShareFilterToolbar, { ShareFilterContext, useShareFilters } from './TileShareFilters';

export default function ClassShareExperience({
	clusterId,
	tilettes,
	participants,
	refresh,
	onAdd,
}: {
	clusterId: string;
	tilettes: TileShareTemplate[];
	participants?: ContactModel[];
	refresh: () => Promise<void>;
	onAdd?: () => void;
}) {
	const { t } = useTranslation();
	const { isOwner, viewerId } = useContext(TileShareViewerContext);
	const filters = useShareFilters(
		`${sharePreferenceKey(viewerId, clusterId, 'class', isOwner)}:filters.v1`,
		tilettes,
		participants
	);
	const [view, setView] = useSharePreference(
		`${sharePreferenceKey(viewerId, clusterId, 'class', isOwner)}:view`,
		['participants', 'tilettes'] as const,
		'participants'
	);
	const mine = classParticipantRows(tilettes).find((row) =>
		row.assignments.some(({ assignment }) => assignment.userId === viewerId)
	);
	return (
		<ShareFilterContext.Provider value={filters}>
			<Experience
				aria-label={t(
					isOwner ? 'shareExperience.classOwner' : 'shareExperience.classParticipant',
					isOwner ? 'Class management' : 'My Class work'
				)}
			>
				<ShareControls>
					<ShareNavigation>
						{isOwner ? (
							<Tabs
								aria-label={t('shareExperience.classSections', 'Class sections')}
								value={view}
								onChange={(value) => {
									if (value === 'participants' || value === 'tilettes')
										setView(value);
								}}
								tabs={[
									{
										id: 'participants',
										label: t('shareExperience.participants', 'Participants'),
									},
									{
										id: 'tilettes',
										label: t('shareExperience.tilettes', 'Tilettes'),
									},
								]}
							/>
						) : (
							<h2>{t('shareExperience.myTilettes', 'My tilettes')}</h2>
						)}
					</ShareNavigation>
					<TileShareFilterToolbar
						personalStatus={!isOwner || view === 'participants'}
						showPeople={isOwner}
					/>
				</ShareControls>
				{isOwner ? (
					<>
						<div hidden={view !== 'participants'}>
							<ClassShareActions
								tilettes={tilettes}
								participants={participants}
								isOwner
								onChanged={refresh}
							>
								{(remove) => (
									<ClassParticipantsOverview
										clusterId={clusterId}
										tilettes={tilettes}
										participants={participants}
										remove={remove}
									/>
								)}
							</ClassShareActions>
						</div>
						{view === 'tilettes' && (
							<TiletteBody clusterId={clusterId} tilettes={tilettes} />
						)}
						{!tilettes.length && onAdd && (
							<Button variant="brand" onClick={onAdd}>
								{t('shareExperience.addTilette', 'Add tilette')}
							</Button>
						)}
					</>
				) : (
					<>
						{mine && (
							<Summary>
								<span>
									{t(
										'shareExperience.completedCount',
										'{{completed}}/{{total}} completed',
										{
											completed: mine.completed,
											total: mine.assignments.length,
										}
									)}
								</span>
								{[...mine.responses].map(([status, count]) => (
									<span key={status}>
										{t(
											'shareExperience.responseCount',
											'{{response}}: {{count}}',
											{
												response: t(`tileshareRsvp.${status}`),
												count,
											}
										)}
									</span>
								))}
							</Summary>
						)}
						<ClassShareActions
							tilettes={tilettes}
							isOwner={false}
							onChanged={refresh}
						/>
						<TiletteBody clusterId={clusterId} tilettes={tilettes} scope="mine" />
					</>
				)}
			</Experience>
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
	h2 {
		margin: 0;
		font-size: 18px;
	}
`;
const Summary = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px 16px;
	color: ${({ theme }) => theme.colors.text.secondary};
`;
