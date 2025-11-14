import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import palette from '@/core/theme/palette';
import { useTranslation } from 'react-i18next';

const fadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

const pulse = keyframes`
	0%, 100% {
		opacity: 0.4;
	}
	50% {
		opacity: 1;
	}
`;

const slideInDiagonal = keyframes`
	from {
		transform: translate(-50%, -50%) translateY(200px) rotateX(0deg);
		opacity: 0;
	}
	to {
		transform: translate(-50%, -50%) translateY(0) rotateX(25deg);
		opacity: 1;
	}
`;

const floatDiagonal = keyframes`
	0% {
		transform: translate(-50%, -50%) translateY(0) rotateX(25deg);
	}
	50% {
		transform: translate(-50%, -50%) translateY(-80px) rotateX(25deg);
	}
	100% {
		transform: translate(-50%, -50%) translateY(0) rotateX(25deg);
	}
`;

const BackgroundContainer = styled.div<{ $position: 'left' | 'right' }>`
	position: absolute;
	top: 0;
	${({ $position }) => $position}: 0;
	width: 45%;
	height: 100%;
	overflow: hidden;
	pointer-events: none;
	opacity: 0.35;
	z-index: 0;
	perspective: 1000px;
	perspective-origin: center center;

	${({ $position }) => $position === 'left' && `
		background: linear-gradient(135deg, transparent, rgba(0, 0, 0, 0.4) 80%);
	`}

	${({ $position }) => $position === 'right' && `
		background: linear-gradient(225deg, transparent, rgba(0, 0, 0, 0.4) 80%);
	`}

	@media (max-width: ${palette.screens.lg}) {
		width: 35%;
		opacity: 0.25;
	}

	@media (max-width: ${palette.screens.md}) {
		display: none;
	}
`;

const DemoWindow = styled.div<{ $position: 'left' | 'right' }>`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) rotateX(25deg);
	width: 550px;
	height: 450px;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	opacity: 1;
	transform-style: preserve-3d;
	animation: ${slideInDiagonal} 2s ease-out, ${floatDiagonal} 15s ease-in-out infinite 2s;

	@media (max-width: ${palette.screens.xl}) {
		width: 480px;
		height: 400px;
	}

	@media (max-width: ${palette.screens.lg}) {
		width: 400px;
		height: 350px;
	}
`;

const ChatPanel = styled.div`
	background: ${palette.colors.gray[900]}dd;
	border: 1.5px solid ${palette.colors.gray[600]}90;
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	backdrop-filter: blur(12px);
	flex: 1;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

	@media (max-width: ${palette.screens.lg}) {
		padding: 1rem;
	}
`;

const CalendarPanel = styled.div`
	background: ${palette.colors.gray[900]}dd;
	border: 1.5px solid ${palette.colors.gray[600]}90;
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.5rem;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	flex: 1;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

	@media (max-width: ${palette.screens.lg}) {
		padding: 1rem;
	}
`;

const ChatMessage = styled.div<{ $isUser: boolean; $visible: boolean }>`
	padding: 0.75rem 1rem;
	border-radius: ${palette.borderRadius.large};
	background: ${({ $isUser }) =>
		$isUser ? palette.colors.brand[600] + '70' : palette.colors.gray[800] + 'cc'};
	color: ${palette.colors.gray[50]};
	font-size: ${palette.typography.fontSize.sm};
	font-family: ${palette.typography.fontFamily.inter};
	line-height: 1.4;
	align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
	max-width: 85%;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	animation: ${({ $visible }) => ($visible ? fadeIn : 'none')} 0.4s ease-out;
	border: 1px solid ${({ $isUser }) =>
		$isUser ? palette.colors.brand[500] + '60' : palette.colors.gray[600] + '60'};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TypingIndicator = styled.div<{ $visible: boolean }>`
	display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
	gap: 0.25rem;
	padding: 0.75rem 1rem;
	background: ${palette.colors.gray[800]}cc;
	border-radius: ${palette.borderRadius.large};
	width: fit-content;
	align-self: flex-start;
	border: 1px solid ${palette.colors.gray[600]}60;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TypingDot = styled.div<{ $delay: number }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${palette.colors.gray[400]};
	animation: ${pulse} 1.4s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay}s;
`;

const CalendarHeader = styled.div`
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.gray[200]};
	font-family: ${palette.typography.fontFamily.inter};
	padding-bottom: 0.5rem;
	border-bottom: 1px solid ${palette.colors.gray[600]}70;
`;

const TimeSlot = styled.div`
	display: flex;
	gap: 0.75rem;
	align-items: center;
`;

const TimeLabel = styled.div`
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
	min-width: 50px;
	text-align: right;

	@media (max-width: ${palette.screens.md}) {
		min-width: 40px;
		font-size: 10px;
	}
`;

const TileBlock = styled.div<{ $color: string; $visible: boolean }>`
	flex: 1;
	padding: 0.625rem 0.875rem;
	background: ${({ $color }) => $color}50;
	border-left: 3px solid ${({ $color }) => $color};
	border-radius: ${palette.borderRadius.medium};
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.inter};
	line-height: 1.3;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	animation: ${({ $visible }) => ($visible ? fadeIn : 'none')} 0.5s ease-out;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

	@media (max-width: ${palette.screens.md}) {
		padding: 0.5rem 0.625rem;
		font-size: 10px;
	}
`;

const TravelIndicator = styled.div`
	font-size: 10px;
	color: ${palette.colors.gray[500]};
	margin-top: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '🚗';
		font-size: 10px;
	}
`;

interface Message {
	text: string;
	isUser: boolean;
}

interface CalendarTile {
	time: string;
	title: string;
	color: string;
	travel?: string;
}

interface Scenario {
	messages: Message[];
	tiles: CalendarTile[];
	calendarTitle: string;
}

interface HeroAnimatedBackgroundProps {
	position: 'left' | 'right';
	scenarioIndex?: number; // Optional: specify which scenario to show (0-3)
}

const HeroAnimatedBackground: React.FC<HeroAnimatedBackgroundProps> = ({ position, scenarioIndex }) => {
	const { t } = useTranslation();

	const scenarios: Scenario[] = [
		{
			calendarTitle: t('home.hero.scenarios.lunch.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.lunch.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.lunch.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.lunch.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.lunch.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '11:35 AM', title: t('home.hero.scenarios.lunch.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.lunch.tiles.travelTime') },
				{ time: '12:00 PM', title: t('home.hero.scenarios.lunch.tiles.lunch'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.errands.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.errands.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.errands.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.errands.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.errands.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '5:00 PM', title: t('home.hero.scenarios.errands.tiles.groceries'), color: palette.colors.brand[600] },
				{ time: '5:30 PM', title: t('home.hero.scenarios.errands.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.errands.tiles.travelTime') },
				{ time: '6:00 PM', title: t('home.hero.scenarios.errands.tiles.gym'), color: palette.colors.brand[700] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.client.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.client.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.client.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.client.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.client.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '1:25 PM', title: t('home.hero.scenarios.client.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.client.tiles.travelTime') },
				{ time: '2:00 PM', title: t('home.hero.scenarios.client.tiles.meeting'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.dentist.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.dentist.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.dentist.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.dentist.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.dentist.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '9:00 AM', title: t('home.hero.scenarios.dentist.tiles.dentist'), color: palette.colors.brand[600] },
				{ time: '10:00 AM', title: t('home.hero.scenarios.dentist.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.dentist.tiles.travelTime') },
				{ time: '10:15 AM', title: t('home.hero.scenarios.dentist.tiles.deepWork'), color: palette.colors.brand[700] },
			],
		},
	];
	const [currentScenario, setCurrentScenario] = useState(scenarioIndex ?? 0);
	const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
	const [showTyping, setShowTyping] = useState(false);
	const [visibleTiles, setVisibleTiles] = useState<number[]>([]);

	useEffect(() => {
		const scenario = scenarios[currentScenario];
		let messageIndex = 0;
		let tileIndex = 0;

		// Reset state
		setVisibleMessages([]);
		setVisibleTiles([]);
		setShowTyping(false);

		const intervals: NodeJS.Timeout[] = [];

		// Animate messages
		const showNextMessage = () => {
			if (messageIndex < scenario.messages.length) {
				const message = scenario.messages[messageIndex];

				if (!message.isUser) {
					// Show typing indicator before AI responses
					setShowTyping(true);
					intervals.push(
						setTimeout(() => {
							setShowTyping(false);
							setVisibleMessages((prev) => [...prev, messageIndex]);
							messageIndex++;
							intervals.push(setTimeout(showNextMessage, 1200));
						}, 1500)
					);
				} else {
					// User messages appear immediately
					setVisibleMessages((prev) => [...prev, messageIndex]);
					messageIndex++;
					intervals.push(setTimeout(showNextMessage, 800));
				}
			} else {
				// Start showing tiles after messages complete
				intervals.push(setTimeout(showNextTile, 500));
			}
		};

		const showNextTile = () => {
			if (tileIndex < scenario.tiles.length) {
				setVisibleTiles((prev) => [...prev, tileIndex]);
				tileIndex++;
				intervals.push(setTimeout(showNextTile, 600));
			} else {
				// Wait before cycling to next scenario (only if not locked to specific scenario)
				if (scenarioIndex === undefined) {
					intervals.push(
						setTimeout(() => {
							setCurrentScenario((prev) => (prev + 1) % scenarios.length);
						}, 4000)
					);
				}
			}
		};

		// Start the animation
		showNextMessage();

		return () => {
			intervals.forEach((interval) => clearTimeout(interval));
		};
	}, [currentScenario, scenarioIndex]);

	const scenario = scenarios[currentScenario];

	return (
		<BackgroundContainer $position={position}>
			<DemoWindow $position={position}>
				<ChatPanel>
					{scenario.messages.map((message, index) => (
						<ChatMessage
							key={index}
							$isUser={message.isUser}
							$visible={visibleMessages.includes(index)}
						>
							{message.text}
						</ChatMessage>
					))}
					<TypingIndicator $visible={showTyping}>
						<TypingDot $delay={0} />
						<TypingDot $delay={0.2} />
						<TypingDot $delay={0.4} />
					</TypingIndicator>
				</ChatPanel>

				<CalendarPanel>
					<CalendarHeader>{scenario.calendarTitle}</CalendarHeader>
					{scenario.tiles.map((tile, index) => (
						<TimeSlot key={index}>
							<TimeLabel>{tile.time}</TimeLabel>
							<TileBlock $color={tile.color} $visible={visibleTiles.includes(index)}>
								{tile.title}
								{tile.travel && <TravelIndicator>{tile.travel}</TravelIndicator>}
							</TileBlock>
						</TimeSlot>
					))}
				</CalendarPanel>
			</DemoWindow>
		</BackgroundContainer>
	);
};

export default HeroAnimatedBackground;
