import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CalendarCheck2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs, { TabItem } from '@/core/common/components/Tabs';
import TileshareToolbar from '@/components/tileshare/TileshareToolbar';
import TileshareCreate, { TileshareMode } from '@/components/tileshare/TileshareCreate';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Routes } from '@/core/constants/routes';
import TileShareActivityTimeline from '@/components/tileshare/TileShareActivityTimeline';
import { useAuth } from '@/core/auth/useAuth';

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { user } = useAuth();
	const [params, setParams] = useSearchParams();
	const expanded = params.get('activities') === '1';
	const activeTab = pathname === Routes.Tileshare.invitations ? 'invitations' : 'projects';
	const toggleActivities = () =>
		setParams((previous) => {
			const next = new URLSearchParams(previous);
			if (expanded) next.delete('activities');
			else next.set('activities', '1');
			return next;
		});
	const [createMode, setCreateMode] = useState<TileshareMode | null>(null);

	const tabs = useMemo<TabItem[]>(
		() => [
			{
				id: 'projects',
				label: t('tileshareList.title', 'TileShares'),
				icon: <CalendarCheck2 size={16} />,
			},
			{ id: 'invitations', label: t('tileshareInvitations.title', 'Invitations') },
		],
		[t]
	);
	const tabRoutes: Record<string, string> = {
		projects: Routes.Tileshare.list,
		invitations: Routes.Tileshare.invitations,
	};

	const handleTabChange = (id: string) => {
		if (tabRoutes[id]) navigate(tabRoutes[id] + (expanded ? '?activities=1' : ''));
	};

	const handleSelectSingle = () => setCreateMode(TileshareMode.Single);
	const handleSelectMulti = () => setCreateMode(TileshareMode.Multi);

	return (
		<Container>
			<CalendarUIProvider>
				{createMode ? (
					<TileshareCreate
						mode={createMode}
						onBack={() => {
							setCreateMode(null);
							navigate(Routes.Tileshare.list);
						}}
					/>
				) : (
					<>
						<StyledToolbar
							user={{ name: user?.fullName ?? null, email: user?.email ?? null }}
							onSelectSingle={handleSelectSingle}
							onSelectMulti={handleSelectMulti}
						/>
						<Header>
							<Tabs
								tabs={tabs}
								value={activeTab}
								onChange={handleTabChange}
								aria-label={t('tilesharedemo.dashboard.title')}
							/>
							<ActivityToggle
								type="button"
								aria-expanded={expanded}
								aria-controls="dashboard-activities"
								onClick={toggleActivities}
							>
								{expanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
								{t('tileshareActivity.title', 'Activities')}
							</ActivityToggle>
						</Header>
						<Main $expanded={expanded}>
							<Content>
								<Outlet />
							</Content>
							{expanded && (
								<ActivityPanel
									id="dashboard-activities"
									aria-label={t('tileshareActivity.title', 'Activities')}
								>
									<TileShareActivityTimeline />
								</ActivityPanel>
							)}
						</Main>
					</>
				)}
			</CalendarUIProvider>
		</Container>
	);
};

const Container = styled.div`
	position: relative;
	height: 100%;
	background-color: ${(props) => props.theme.colors.background.page};
	overflow-y: scroll;
	isolation: isolate;
`;

const StyledToolbar = styled(TileshareToolbar)`
	padding: 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Header = styled.header`
	gap: 1rem;
	flex-wrap: wrap;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.5rem 1.5rem 1rem;
`;

const Content = styled.div`
	min-width: 0;
`;
const ActivityToggle = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
	cursor: pointer;
	padding: 10px;
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.button.primary.bg};
	color: ${({ theme }) => theme.colors.button.primary.text};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
`;
const ActivityPanel = styled.aside`
	min-width: 0;
	padding-left: 1.5rem;
	border-left: 1px solid ${({ theme }) => theme.colors.border.default};
	@media (max-width: 960px) {
		padding: 1.5rem 0 0;
		border-left: 0;
		border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	}
`;
const Main = styled.main<{ $expanded: boolean }>`
	display: grid;
	grid-template-columns: ${({ $expanded }) =>
		$expanded ? 'minmax(0,1fr) minmax(20rem,28%)' : 'minmax(0,1fr)'};
	gap: 1.5rem;
	@media (max-width: 960px) {
		grid-template-columns: minmax(0, 1fr);
	}
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
