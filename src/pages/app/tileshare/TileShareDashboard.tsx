import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs from '@/core/common/components/Tabs';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { tileshareService } from '@/services';
import { DesignatedTile, TileShareCluster } from '@/core/common/types/tileshare';

const dummyInboxItem: DesignatedTile = {
	id: 'dummy-designated-tile-1',
	name: 'Team Sync',
	template: {
		id: 'dummy-template-1',
		name: 'Team Sync',
		creator: {
			id: 'creator-1',
			username: 'johndoe',
			fullName: 'John Doe',
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			timeZone: 'America/New_York',
			timeZoneDifference: -5,
			endfOfDay: '18:00',
			endOfDay: '18:00',
			phoneNumber: null,
			countryCode: 'US',
		},
		designatedUsers: [],
		clusterId: 'cluster-1',
		duration: 3600000,
		start: Date.now(),
		end: Date.now() + 3600000,
		miscData: { id: 'misc-1', userNote: null },
	},
	displayedIdentifier: 'john@example.com',
	isViable: true,
	invitationStatus: 'Pending',
	tileTemplateId: 'dummy-template-1',
	status: 'Pending',
	isDisabled: false,
	user: {
		id: 'user-1',
		username: 'johndoe',
		fullName: 'John Doe',
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@example.com',
		timeZone: 'America/New_York',
		timeZoneDifference: -5,
		endfOfDay: '18:00',
		endOfDay: '18:00',
		phoneNumber: null,
		countryCode: 'US',
	},
	completionPercent: 0,
	tilerEvent: null,
	clusterOwner: {
		id: 'creator-1',
		username: 'johndoe',
		fullName: 'John Doe',
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@example.com',
		timeZone: 'America/New_York',
		timeZoneDifference: -5,
		endfOfDay: '18:00',
		endOfDay: '18:00',
		phoneNumber: null,
		countryCode: 'US',
	},
};

const dummyOutboxItem: TileShareCluster = {
	id: 'dummy-cluster-1',
	name: 'Team Sync',
	start: Date.now(),
	end: Date.now() + 3600000,
	isCompleted: false,
	isDeleted: false,
	isDismissed: false,
	isMultiTilette: false,
	creator: {
		id: 'creator-1',
		username: 'me',
		fullName: 'Me User',
		firstName: 'Me',
		lastName: 'User',
		email: 'me@example.com',
		timeZone: 'America/New_York',
		timeZoneDifference: -5,
		endfOfDay: '18:00',
		endOfDay: '18:00',
		phoneNumber: null,
		countryCode: 'US',
	},
	tileShareTemplates: [],
	truncatedUser: null,
};

export type TileshareDashboardOutletContext = {
	tiles: DesignatedTile[];
	clusters: TileShareCluster[];
};

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [tiles, setTiles] = useState<DesignatedTile[]>([dummyInboxItem]);
	const [clusters, setClusters] = useState<TileShareCluster[]>([dummyOutboxItem]);

	const activeTab = pathname.endsWith('/outbox') ? 'outbox' : 'inbox';
	useEffect(() => {
		const fetchInbox = async () => {
			try {
				const data = await tileshareService.getInbox();
				if (data && data.length > 0) setTiles(data);
			} catch (error) {
				console.error('Error fetching tileshare inbox', error);
			}
		};

		const fetchOutbox = async () => {
			try {
				const data = await tileshareService.getOutbox();
				if (data && data.length > 0) setClusters(data);
			} catch (error) {
				console.error('Error fetching tileshare outbox', error);
			}
		};

		if (activeTab === 'inbox') {
			fetchInbox();
		} else {
			fetchOutbox();
		}
	}, [activeTab]);

	const tabs = useMemo(
		() => [
			{
				id: 'inbox',
				label: t('tilesharedemo.dashboard.nav.inbox', { count: tiles.length }),
				icon: <ArrowDownLeft size={16} />,
			},
			{
				id: 'outbox',
				label: t('tilesharedemo.dashboard.nav.outbox', { count: clusters.length }),
				icon: <ArrowUpRight size={16} />,
			},
		],
		[t, tiles.length, clusters.length]
	);

	const handleTabChange = (id: string) => {
		navigate(id);
	};

	return (
		<Container>
			<CalendarUIProvider>
				<Title>{t('tilesharedemo.dashboard.title')}</Title>
				<Header>
					<Tabs
						tabs={tabs}
						value={activeTab}
						onChange={handleTabChange}
						aria-label={t('tilesharedemo.dashboard.title')}
					/>
				</Header>
				<Main>
					<Outlet
						context={{ tiles, clusters } satisfies TileshareDashboardOutletContext}
					/>
				</Main>
			</CalendarUIProvider>
		</Container>
	);
};

const Container = styled.div`
	position: relative;
	height: 100%;
	background-color: ${(props) => props.theme.colors.background.page};
	overflow: hidden;
	isolation: isolate;
`;

const Title = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.lg};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	padding: 1rem 1.5rem;
`;

const Main = styled.main`
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
