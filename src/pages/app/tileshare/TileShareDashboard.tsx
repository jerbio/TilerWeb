import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CalendarUIProvider } from '@/core/common/components/calendar/calendar-ui.provider';
import Tabs from '@/core/common/components/Tabs';
import Select, { type SelectOption } from '@/core/common/components/select';
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
		designatedUsers: [
			{
				displayedIdentifier: 'gbembio2002@yahoo.com',
				userId: '6bc6992f-3222-4fd8-9e2b-b94eba2fb717',
				designatedTileTemplateId:
					'DesignatedTileTemplate+01KHEQ7RXB7KNGDRYA4CMRH9Y8+01KHEQ7RXBPRYWB19XXDR8MFGC',
				userProfile: {
					id: '6bc6992f-3222-4fd8-9e2b-b94eba2fb717',
					username: 'jerbio',
					timeZoneDifference: 360000,
					timeZone: 'America/Denver',
					email: 'gbembio2002@yahoo.com',
					endfOfDay: '2026-05-20T04:30:00+00:00',
					endOfDay: '2026-05-20T04:30:00+00:00',
					phoneNumber: '3478500836',
					fullName: 'Jerome',
					firstName: 'Jerome',
					lastName: '',
					countryCode: '1',
				},
				rsvpStatus: 'accepted',
				completionPct: 100,
			},
		],
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
	completionPercent: 10,
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
	truncatedUser:
		'demo@tiler.app,gbembio2002@yahoo.com,odiksglory@gmail.com,jeromebiotidara@gmail.com',
};

export enum TileshareFilter {
	All = 'all',
	InProgress = 'inProgress',
}

export type TileshareDashboardOutletContext = {
	tiles: DesignatedTile[];
	clusters: TileShareCluster[];
	filter: TileshareFilter;
};

const TileshareDashboardPage: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [tiles, setTiles] = useState<DesignatedTile[]>([dummyInboxItem]);
	const [clusters, setClusters] = useState<TileShareCluster[]>([dummyOutboxItem]);
	const [filter, setFilter] = useState<TileshareFilter>(TileshareFilter.All);

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

	const filterOptions = useMemo<SelectOption<TileshareFilter>[]>(
		() => [
			{ value: TileshareFilter.All, label: t('tilesharedemo.dashboard.filter.all') },
			{
				value: TileshareFilter.InProgress,
				label: t('tilesharedemo.dashboard.filter.inProgress'),
			},
		],
		[t]
	);

	return (
		<Container>
			<CalendarUIProvider>
				<Header>
					<Tabs
						tabs={tabs}
						value={activeTab}
						onChange={handleTabChange}
						aria-label={t('tilesharedemo.dashboard.title')}
					/>
					<Select
						value={filter}
						onChange={setFilter}
						options={filterOptions}
						align="right"
						aria-label={t('tilesharedemo.dashboard.filter.all')}
					/>
				</Header>
				<Main>
					<Outlet
						context={
							{ tiles, clusters, filter } satisfies TileshareDashboardOutletContext
						}
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
	overflow-y: scroll;
	isolation: isolate;
`;

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 1.5rem;
`;

const Main = styled.main`
	padding: 0 1.5rem 1.5rem;
`;

export default TileshareDashboardPage;
