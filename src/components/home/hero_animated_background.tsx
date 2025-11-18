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

// Random slide-in animations from different directions
const slideInFromTop = keyframes`
	from {
		transform: translate(-50%, -50%) translateY(-200px) rotateX(0deg);
		opacity: 0;
	}
	to {
		transform: translate(-50%, -50%) translateY(0) rotateX(25deg);
		opacity: 1;
	}
`;

const slideInFromBottom = keyframes`
	from {
		transform: translate(-50%, -50%) translateY(200px) rotateX(0deg);
		opacity: 0;
	}
	to {
		transform: translate(-50%, -50%) translateY(0) rotateX(25deg);
		opacity: 1;
	}
`;

const slideInFromLeft = keyframes`
	from {
		transform: translate(-50%, -50%) translateX(-200px) rotateX(0deg);
		opacity: 0;
	}
	to {
		transform: translate(-50%, -50%) translateX(0) rotateX(25deg);
		opacity: 1;
	}
`;

const slideInFromRight = keyframes`
	from {
		transform: translate(-50%, -50%) translateX(200px) rotateX(0deg);
		opacity: 0;
	}
	to {
		transform: translate(-50%, -50%) translateX(0) rotateX(25deg);
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

const BackgroundContainer = styled.div<{ $position: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' }>`
	position: absolute;
	overflow: hidden;
	pointer-events: none;
	opacity: 0.65;
	z-index: 0;
	perspective: 1000px;
	perspective-origin: center center;

	${({ $position }) => {
		switch ($position) {
			case 'left':
				return `
					top: 30%;
					left: 0;
					width: 22%;
					height: 40%;
					background: linear-gradient(135deg, transparent, rgba(0, 0, 0, 0.15) 80%);
				`;
			case 'right':
				return `
					top: 30%;
					right: 0;
					width: 22%;
					height: 40%;
					background: linear-gradient(225deg, transparent, rgba(0, 0, 0, 0.15) 80%);
				`;
			case 'top-left':
				return `
					top: 0;
					left: 0;
					width: 45%;
					height: 48%;
					background: linear-gradient(135deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'top-right':
				return `
					top: 0;
					right: 0;
					width: 45%;
					height: 48%;
					background: linear-gradient(225deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'bottom-left':
				return `
					bottom: 0;
					left: 0;
					width: 45%;
					height: 48%;
					background: linear-gradient(45deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'bottom-right':
				return `
					bottom: 0;
					right: 0;
					width: 45%;
					height: 48%;
					background: linear-gradient(315deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'top-center':
				return `
					top: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 25%;
					height: 32%;
					background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'bottom-center':
				return `
					bottom: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 25%;
					height: 32%;
					background: linear-gradient(0deg, transparent 40%, rgba(0, 0, 0, 0.1) 90%);
				`;
			case 'left-top':
				return `
					top: 2%;
					left: 0;
					width: 18%;
					height: 22%;
					background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.12) 95%);
				`;
			case 'left-bottom':
				return `
					bottom: 2%;
					left: 0;
					width: 18%;
					height: 22%;
					background: linear-gradient(45deg, transparent 50%, rgba(0, 0, 0, 0.12) 95%);
				`;
			case 'right-top':
				return `
					top: 2%;
					right: 0;
					width: 18%;
					height: 22%;
					background: linear-gradient(225deg, transparent 50%, rgba(0, 0, 0, 0.12) 95%);
				`;
			case 'right-bottom':
				return `
					bottom: 2%;
					right: 0;
					width: 18%;
					height: 22%;
					background: linear-gradient(315deg, transparent 50%, rgba(0, 0, 0, 0.12) 95%);
				`;
		}
	}}

	@media (max-width: ${palette.screens.lg}) {
		opacity: 0.55;
		${({ $position }) => ($position === 'top-left' || $position === 'top-right' || $position === 'bottom-left' || $position === 'bottom-right') && `
			width: 46%;
			height: 49%;
		`}
	}

	@media (max-width: ${palette.screens.md}) {
		/* Show only top-left on mobile */
		${({ $position }) => $position !== 'top-left' && `display: none;`}
		${({ $position }) => $position === 'top-left' && `
			width: 90%;
			height: 45%;
			opacity: 0.5;
		`}
	}
`;

const DemoWindow = styled.div<{ $position: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'; $slideAnimation: ReturnType<typeof keyframes> }>`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) rotateX(25deg) scale(0.5);
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	opacity: 1;
	transform-style: preserve-3d;
	animation: ${({ $slideAnimation }) => $slideAnimation} 2s ease-out, ${floatDiagonal} 15s ease-in-out infinite 2s;

	/* Uniform sizing for quadrant layout */
	width: 480px;
	height: 400px;

	@media (max-width: ${palette.screens.xl}) {
		width: 420px;
		height: 350px;
	}

	@media (max-width: ${palette.screens.lg}) {
		width: 360px;
		height: 300px;
	}

	@media (max-width: ${palette.screens.md}) {
		width: 280px;
		height: 240px;
	}
`;

const ChatPanel = styled.div`
	background: ${palette.colors.gray[800]}cc;
	border: 1.5px solid ${palette.colors.gray[500]}90;
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	backdrop-filter: blur(12px);
	flex: 1;
	min-height: 0;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	overflow: hidden;

	@media (max-width: ${palette.screens.lg}) {
		padding: 1rem;
		gap: 0.625rem;
	}

	@media (max-width: ${palette.screens.md}) {
		padding: 0.75rem;
		gap: 0.5rem;
	}
`;

const CalendarPanel = styled.div`
	background: ${palette.colors.gray[800]}cc;
	border: 1.5px solid ${palette.colors.gray[500]}90;
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.5rem;
	backdrop-filter: blur(12px);
	display: flex;
	flex-direction: column;
	gap: 0.625rem;
	flex: 1;
	min-height: 0;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	overflow: hidden;

	@media (max-width: ${palette.screens.lg}) {
		padding: 1rem;
		gap: 0.5rem;
	}

	@media (max-width: ${palette.screens.md}) {
		padding: 0.75rem;
		gap: 0.375rem;
	}
`;

const ChatMessage = styled.div<{ $isUser: boolean; $visible: boolean }>`
	padding: 0.625rem 0.875rem;
	border-radius: ${palette.borderRadius.large};
	background: ${({ $isUser }) =>
		$isUser ? palette.colors.brand[600] + '90' : palette.colors.gray[700] + 'dd'};
	color: ${palette.colors.gray[50]};
	font-size: ${palette.typography.fontSize.sm};
	font-family: ${palette.typography.fontFamily.inter};
	line-height: 1.4;
	align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
	max-width: 85%;

	@media (max-width: ${palette.screens.md}) {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		line-height: 1.35;
	}
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	animation: ${({ $visible }) => ($visible ? fadeIn : 'none')} 0.4s ease-out;
	border: 1px solid ${({ $isUser }) =>
		$isUser ? palette.colors.brand[500] + '80' : palette.colors.gray[500] + '80'};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const TypingIndicator = styled.div<{ $visible: boolean }>`
	display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
	gap: 0.25rem;
	padding: 0.75rem 1rem;
	background: ${palette.colors.gray[700]}dd;
	border-radius: ${palette.borderRadius.large};
	width: fit-content;
	align-self: flex-start;
	border: 1px solid ${palette.colors.gray[500]}80;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
	background: ${({ $color }) => $color}70;
	border-left: 3px solid ${({ $color }) => $color};
	border-radius: ${palette.borderRadius.medium};
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.inter};
	line-height: 1.3;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	animation: ${({ $visible }) => ($visible ? fadeIn : 'none')} 0.5s ease-out;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

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
	position: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
	scenarioIndex?: number; // Optional: specify which scenario to show
}

const HeroAnimatedBackground: React.FC<HeroAnimatedBackgroundProps> = ({ position, scenarioIndex }) => {
	const { t } = useTranslation();

	// Pick a random slide-in animation
	const [slideAnimation] = useState(() => {
		const animations = [slideInFromTop, slideInFromBottom, slideInFromLeft, slideInFromRight];
		return animations[Math.floor(Math.random() * animations.length)];
	});

	// Stagger animation start based on position to avoid simultaneous movements
	const getAnimationDelay = (pos: typeof position): number => {
		const delays = {
			'left': 0,
			'right': 2,
			'top-left': 4,
			'top-right': 6,
			'bottom-left': 8,
			'bottom-right': 10,
			'top-center': 1,
			'bottom-center': 3,
			'left-top': 5,
			'left-bottom': 7,
			'right-top': 9,
			'right-bottom': 11,
		};
		return delays[pos] || 0;
	};

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
		{
			calendarTitle: t('home.hero.scenarios.coffee.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.coffee.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.coffee.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.coffee.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.coffee.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '9:40 AM', title: t('home.hero.scenarios.coffee.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.coffee.tiles.travelTime') },
				{ time: '10:00 AM', title: t('home.hero.scenarios.coffee.tiles.coffee'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.airport.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.airport.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.airport.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.airport.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.airport.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '12:10 PM', title: t('home.hero.scenarios.airport.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.airport.tiles.travelTime') },
				{ time: '1:00 PM', title: t('home.hero.scenarios.airport.tiles.airport'), color: palette.colors.brand[500] },
				{ time: '3:00 PM', title: t('home.hero.scenarios.airport.tiles.flight'), color: palette.colors.brand[600] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.school.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.school.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.school.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.school.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.school.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '3:10 PM', title: t('home.hero.scenarios.school.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.school.tiles.travelTime') },
				{ time: '3:30 PM', title: t('home.hero.scenarios.school.tiles.pickup'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.doctor.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.doctor.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.doctor.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.doctor.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.doctor.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '2:00 PM', title: t('home.hero.scenarios.doctor.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.doctor.tiles.travelTime') },
				{ time: '2:30 PM', title: t('home.hero.scenarios.doctor.tiles.doctor'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.haircut.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.haircut.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.haircut.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.haircut.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.haircut.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '3:50 PM', title: t('home.hero.scenarios.haircut.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.haircut.tiles.travelTime') },
				{ time: '4:00 PM', title: t('home.hero.scenarios.haircut.tiles.haircut'), color: palette.colors.brand[500] },
			],
		},
		{
			calendarTitle: t('home.hero.scenarios.restaurant.calendarTitle'),
			messages: [
				{ text: t('home.hero.scenarios.restaurant.messages.userRequest'), isUser: true },
				{ text: t('home.hero.scenarios.restaurant.messages.aiResponse1'), isUser: false },
				{ text: t('home.hero.scenarios.restaurant.messages.userConfirm'), isUser: true },
				{ text: t('home.hero.scenarios.restaurant.messages.aiConfirm'), isUser: false },
			],
			tiles: [
				{ time: '6:25 PM', title: t('home.hero.scenarios.restaurant.tiles.travel'), color: palette.colors.brand[400], travel: t('home.hero.scenarios.restaurant.tiles.travelTime') },
				{ time: '7:00 PM', title: t('home.hero.scenarios.restaurant.tiles.dinner'), color: palette.colors.brand[500] },
			],
		},
	];
	const [currentScenario, setCurrentScenario] = useState(scenarioIndex ?? 0);
	const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
	const [showTyping, setShowTyping] = useState(false);
	const [visibleTiles, setVisibleTiles] = useState<number[]>([]);
	const [animationStarted, setAnimationStarted] = useState(false);

	useEffect(() => {
		// Delay the start of animation based on position
		const initialDelay = getAnimationDelay(position) * 500;
		const delayTimeout = setTimeout(() => {
			setAnimationStarted(true);
		}, initialDelay);

		return () => clearTimeout(delayTimeout);
	}, [position]);

	useEffect(() => {
		if (!animationStarted) return;
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
	}, [currentScenario, scenarioIndex, animationStarted]);

	const scenario = scenarios[currentScenario];

	return (
		<BackgroundContainer $position={position}>
			<DemoWindow $position={position} $slideAnimation={slideAnimation}>
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
