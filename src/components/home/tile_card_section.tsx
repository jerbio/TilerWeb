import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import TileCard from './tile_card';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { TileCardProps } from '@/core/common/types/tile';
import ArrowRight from '@/core/common/components/icons/arrow_right';

const TileCardContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 3rem;
`;

const TileCardWrapperScroll = styled.div`
	position: relative;
	width: 100%;
	height: 105px;
	overflow: hidden;
`;

const slideInAnimation = (direction: 'left' | 'right') => keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(${direction === 'left' ? '-50%' : '50%'});
  }
`;

const TileCardWrapper = styled.div<{ direction: 'left' | 'right' }>`
	display: flex;
	position: absolute;
	${(props) => (props.direction === 'left' ? 'left: 0;' : 'right: 0;')}

	animation: ${(props) => slideInAnimation(props.direction)} 64s linear infinite;
	transform: translateX(-50%);
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: center;
`;

const TileFadeDivRight = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 4rem;
	height: 100%;
	background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
`;

const TileFadeDivLeft = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 4rem;
	height: 100%;
	background: linear-gradient(270deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
`;

const TileCardSection: React.FC = () => {
	const { t } = useTranslation();

	const tileGrid: Array<Array<TileCardProps>> = useMemo(() => [
		[
			{
				heading: t('home.tileCardSection.tiles.meetingWithCharles'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '09:00 AM',
				endTime: '10:00 AM',
				background_color: palette.colors.tileBackgroundPrimary,
			},
			{
				heading: t('home.tileCardSection.tiles.morningMeeting'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '10:00 AM',
				endTime: '11:00 AM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
			{
				heading: t('home.tileCardSection.tiles.clientCall'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '11:00 AM',
				endTime: '12:00 PM',
				background_color: palette.colors.tileBackgroundTertiary,
			},
			{
				heading: t('home.tileCardSection.tiles.lunchBreak'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '12:00 PM',
				endTime: '01:00 PM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
		],
		[
			{
				heading: t('home.tileCardSection.tiles.meetingWithCharles'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '09:00 AM',
				endTime: '10:00 AM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
			{
				heading: t('home.tileCardSection.tiles.teamSync'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '10:00 AM',
				endTime: '11:00 AM',
				background_color: palette.colors.tileBackgroundTertiary,
			},
			{
				heading: t('home.tileCardSection.tiles.projectReview'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '11:00 AM',
				endTime: '12:00 PM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
			{
				heading: t('home.tileCardSection.tiles.happyHour'),
				location: t('home.tileCardSection.locations.conferenceRoomA'),
				startTime: '12:00 PM',
				endTime: '01:00 PM',
				background_color: palette.colors.tileBackgroundPrimary,
			},
		],
		[
			{
				heading: t('home.tileCardSection.tiles.breakfastWithFriends'),
				location: t('home.tileCardSection.locations.restaurants'),
				startTime: '09:00 AM',
				endTime: '10:00 AM',
				background_color: palette.colors.tileBackgroundPrimary,
			},
			{
				heading: t('home.tileCardSection.tiles.groceryShopping'),
				location: t('home.tileCardSection.locations.groceryStore'),
				startTime: '10:00 AM',
				endTime: '11:00 AM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
			{
				heading: t('home.tileCardSection.tiles.gymWorkouts'),
				location: t('home.tileCardSection.locations.gym'),
				startTime: '11:00 AM',
				endTime: '12:00 PM',
				background_color: palette.colors.tileBackgroundTertiary,
			},
			{
				heading: t('home.tileCardSection.tiles.meetingWithCharles'),
				location: t('home.tileCardSection.locations.zoom'),
				startTime: '12:00 PM',
				endTime: '01:00 PM',
				background_color: palette.colors.tileBackgroundSecondary,
			},
		],
	], [t]);

	return (
		<Section>
			<SectionHeaders
				headerText={t('home.tileCardSection.header')}
				subHeaderText={t('home.tileCardSection.subHeader')}
				align="center"
			/>
			<TileCardContainer>
				{tileGrid.map((tiles, index) => (
					<TileCardWrapperScroll key={index}>
						<TileCardWrapper direction={index % 2 === 0 ? 'left' : 'right'}>
							{[...tiles, ...tiles].map((tile, tileIndex) => {
								return <TileCard key={tileIndex} {...tile} index={tileIndex} />;
							})}
						</TileCardWrapper>
						<TileFadeDivLeft />
						<TileFadeDivRight />
					</TileCardWrapperScroll>
				))}
			</TileCardContainer>

			<ButtonContainer>
				<Button variant="brand">
					<span>{t('home.tileCardSection.cta')}</span> <ArrowRight />
				</Button>
			</ButtonContainer>
		</Section>
	);
};
export default TileCardSection;
