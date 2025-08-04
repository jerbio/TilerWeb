import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '../../icons/add';
import ArrowRight2 from '../../icons/arrow_right2';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import useIsMobile from '../../../hooks/useIsMobile';
import PersonaCardExpanded from './persona_card_expanded';
import { Persona } from '../../../types/persona';
import { getPersonaImage } from '../../../data/persona';
import { Check, ClockFading } from 'lucide-react';
import { PersonaSchedule } from '../../../hooks/usePersonaSchedules';
import TimeUtil from '../../../util/helpers/time';
import dayjs from 'dayjs';

const Card = styled(animated.div)<{
	gradient?: number;
	$active: boolean;
	$selected?: boolean;
	$mounted?: boolean;
}>`
	min-width: 315px;
	height: 100%;
	background-size: cover;
	background-position: center;
	border-radius: ${styles.borderRadius.xxLarge};
	color: white;
	position: relative;
	opacity: ${(props) => (props.$mounted ? (props.$active ? 1 : 0.5) : 0)};
	transition: opacity 0.3s ease-in-out;
	cursor: ${(props) => (props.$selected ? 'auto' : 'pointer')};

	/* Dark fade effect */
	&::before {
		content: '';
		position: absolute;
		inset: 2px;
		z-index: -1;
		border-radius: calc(${styles.borderRadius.xxLarge} - 2.5px);
		background: linear-gradient(transparent, 66%, rgba(0, 0, 0, 0.6), 88%, rgba(0, 0, 0, 0.9));
	}

	/* Gradient effect */
	&::after {
		${(props) =>
			props.gradient &&
			`@property --rotation {
        inherits: false;
        initial-value: 0deg;
        syntax: '<angle>';
      }
      @keyframes rotate {
        100% {
          --rotation: 360deg;
        }
      }
      animation: rotate 5s linear infinite;`}

		content: '';
		position: absolute;
		inset: 0;
		z-index: -3;
		border-radius: ${styles.borderRadius.xxLarge};
		background: ${(props) =>
			props.gradient
				? `conic-gradient(from var(--rotation) at 50% 50%, #B827FC, #2C90FC, #B8FD33, #FEC837, #FD1892,  #B827FC)`
				: styles.colors.gray[800]};
	}
`;

const CardImage = styled.div<{ $backgroundImage: string; $selected: boolean }>`
	opacity: ${(props) => (props.$selected ? 0 : 1)};
	background-image: url(${(props) => props.$backgroundImage});
	background-size: cover;
	background-position: center;
	position: absolute;
	inset: 2px;
	z-index: -2;
	border-radius: calc(${styles.borderRadius.xxLarge} - 2px);
	transition: opacity 0.3s ease-in-out;
`;

const OverlayContainer = styled.div<{ $selected: boolean }>`
	position: absolute;
	inset: 2px;
	overflow: hidden;

	border-radius: ${styles.borderRadius.xxLarge};
	border: 1px solid ${styles.colors.gray[700]};

	display: flex;
	align-items: flex-end;

	opacity: ${(props) => (props.$selected ? 0 : 1)};
	pointer-events: ${(props) => (props.$selected ? 'none' : 'auto')};
	transition: opacity 0.3s ease-in-out;
`;

const Overlay = styled.div`
	background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
	width: 100%;
	padding: 1.5rem 1.25rem;
`;

const OverlayHeader = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const OverlayTitle = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;

	div {
		display: flex;
		align-items: center;
		gap: 0.5ch;
		font-size: ${styles.typography.fontSize.xs};
		font-weight: ${styles.typography.fontWeight.medium};
		color: ${styles.colors.gray[400]};
		opacity: 0.75;
	}

	h3 {
		font-size: ${styles.typography.fontSize.displayXs};
		font-weight: bold;
		line-height: 1.2;
		font-family: ${styles.typography.fontFamily.urban};
		margin-bottom: 0.5rem;
	}
`;

const OverlayHeaderTag = styled(animated.span)`
	font-size: ${styles.typography.fontSize.sm};
	font-weight: ${styles.typography.fontWeight.semibold};
	background: ${styles.colors.white};
	color: ${styles.colors.gray[800]};
	padding: 6px 1rem;
	line-height: 1;
	border-radius: ${styles.borderRadius.xLarge};
`;

const OverlayList = styled(animated.ul)`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	z-index: 1;
`;

const OverlayListItem = styled(animated.li)<{ $isSelected: boolean }>`
	height: fit-content;
	width: fit-content;
	display: flex;
	gap: 0.25rem;
	align-items: center;
	font-size: ${styles.typography.fontSize.sm};
	color: ${styles.colors.white};

	background: ${({ $isSelected }) =>
		$isSelected ? styles.colors.brand[600] : styles.colors.gray[800]};
	border-radius: ${styles.borderRadius.xLarge};
	border: 1px solid
		${({ $isSelected }) => ($isSelected ? 'transparent' : styles.colors.gray[700])};
	padding-left: 12px;
	line-height: 1.3;
	color: ${styles.colors.gray[100]};
	transition:
		background-color 0.25s ease-in-out,
		color 0.25s ease-in-out;

	button {
		height: 32px;
		width: 32px;
		display: grid;
		place-items: center;
		border-radius: ${styles.borderRadius.xLarge};
		color: ${({ $isSelected }) =>
			$isSelected ? styles.colors.white : styles.colors.gray[400]};
		transition: color 0.25s ease-in-out;

		&:hover {
			color: ${styles.colors.gray[300]};
		}
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	margin-top: -2.25rem;
	align-items: center;
	justify-content: end;
	border-radius: 0 0 ${styles.borderRadius.xxLarge} ${styles.borderRadius.xxLarge};
	z-index: 2;
`;

const ButtonStyled = styled(animated.button)`
	width: 36px;
	height: 36px;
	display: grid;
	place-items: center;
	border-radius: ${styles.borderRadius.xxLarge};
	background-color: ${styles.colors.brand[600]};
	box-shadow: 0 0 4px 8px rgba(0, 0, 0, 0.1);

	&:hover {
		background-color: ${styles.colors.brand[700]};
	}
	transition: background-color 0.3s ease-in-out;
`;

type PersonaCardProps = {
	persona: Persona & { key: number };
	gradient?: boolean;
	selectedPersona: number | null;
	setSelectedPersona: React.Dispatch<React.SetStateAction<number | null>>;
	personaSchedules: PersonaSchedule;
	setPersonaSchedule: (personaId: string, scheduleId: string) => void;
};

const PersonaCard: React.FC<PersonaCardProps> = ({
	persona,
	gradient,
	selectedPersona,
	setSelectedPersona,
	personaSchedules,
	setPersonaSchedule,
}) => {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	const personaSchedule = personaSchedules[persona.id];
	const [personaScheduleTimeLeft, setPersonaScheduleTimeLeft] = useState<string>('');
	const [personaScheduleTimeLeftInterval, setPersonaScheduleTimeLeftInterval] = useState<
		number | undefined
	>(undefined);

	// Update the time left for the persona schedule every minute
	useEffect(() => {
		if (personaSchedule) {
			clearInterval(personaScheduleTimeLeftInterval);

			setPersonaScheduleTimeLeft(
				TimeUtil.rangeDuration(dayjs(), dayjs(personaSchedule.scheduleExpiration))
			);
			const intervalID = setInterval(
				() => {
					setPersonaScheduleTimeLeft(
						TimeUtil.rangeDuration(dayjs(), dayjs(personaSchedule.scheduleExpiration))
					);
				},
				TimeUtil.inMilliseconds(1, 'm')
			);
			setPersonaScheduleTimeLeftInterval(intervalID);
		}

		return () => {
			clearInterval(personaScheduleTimeLeftInterval);
		};
	}, [personaSchedule]);

	const isSelected = selectedPersona === persona.key; // Check if this card is selected
	const isAnotherSelected = selectedPersona !== null && selectedPersona !== persona.key; // Check if another card is selected
	const isScheduleCreated = !!personaSchedule;

	const [tileSuggestions, setTileSuggestions] = useState<
		{ id: number; name: string; selected: boolean }[]
	>([]);

	useEffect(() => {
		if (isScheduleCreated) {
			// If a schedule is created, we don't show tile suggestions
			setTileSuggestions([]);
		} else {
			// Reset tile suggestions based on persona preferences
			setTileSuggestions(
				persona.tilePreferences.map((pref, index) => ({
					id: index + 1,
					name: pref.TileName,
					selected: false,
				}))
			);
		}
	}, [persona.tilePreferences, isScheduleCreated]);

	function toggleTileSuggestion(id: number) {
		setTileSuggestions((prev) =>
			prev.map((tile) => (tile.id === id ? { ...tile, selected: !tile.selected } : tile))
		);
	}

	const currentPersona = useMemo<Persona>(() => {
		const selectedPreferences = new Set(
			tileSuggestions.filter((tile) => tile.selected).map((tile) => tile.name)
		);
		return {
			...persona,
			tilePreferences: persona.tilePreferences.filter((pref) =>
				selectedPreferences.has(pref.TileName)
			),
		};
	}, [persona, tileSuggestions]);

	const swiper = useSwiper();
	const swiperSlide = useSwiperSlide();
	const [mouseHovered, setHovered] = useState(false);
	const isMobile = useIsMobile();
	const displayUI = mouseHovered || (swiperSlide.isActive && isMobile);

	function onSelect() {
		setSelectedPersona(persona.key); // Update the selected state
	}
	function onDeselect() {
		setSelectedPersona(null); // Clear the selected state
		swiper.enable(); // Re-enable the swiper
	}

	useEffect(() => {
		if (isAnotherSelected && swiperSlide.isActive) {
			let diff = selectedPersona - persona.key;
			// if difference is greater than 1
			if (Math.abs(diff) > 1) {
				if (diff > 1) {
					diff = -1;
				} else {
					diff = 1;
				}
			}
			if (diff === -1) {
				swiper.slidePrev();
			} else {
				swiper.slideNext();
			}
		}
		if (selectedPersona !== null) {
			// Enable the swiper when this card is selected
			setTimeout(() => swiper.disable(), 0);
		}
	}, [selectedPersona]);

	// isActive animation hooks
	const tileListTransApi = useSpringRef();
	const tileListTransition = useTransition(displayUI ? tileSuggestions : [], {
		ref: tileListTransApi,
		keys: (tile) => tile.id,
		trail: 150 / tileSuggestions.length,
		from: { opacity: 0, scale: 0.8, y: 20 },
		enter: { opacity: 1, scale: 1, y: 0 },
		leave: { opacity: 0, scale: 0.8, y: -20 },
	});
	const tileListApi = useSpringRef();
	const tileListSpring = useSpring({
		ref: tileListApi,
		from: { height: 0 },
		to: { height: displayUI ? 40 * tileSuggestions.length : 0 },
		config: { tension: 200, friction: 30 },
	});

	const buttonApi = useSpringRef();
	const buttonSpring = useSpring({
		ref: buttonApi,
		from: { x: -32, opacity: 0 },
		to: { x: displayUI ? 0 : -32, opacity: displayUI ? 1 : 0 },
	});

	const overlayTagApi = useSpringRef();
	const overlayTagSpring = useSpring({
		ref: overlayTagApi,
		from: { opacity: 0, scale: 0.9 },
		to: { opacity: displayUI && !isScheduleCreated ? 1 : 0, scale: displayUI ? 1 : 0.9 },
		config: { tension: 250, friction: 30 },
	});

	useChain(
		displayUI
			? [tileListApi, buttonApi, tileListTransApi, overlayTagApi]
			: [overlayTagApi, tileListTransApi, buttonApi, tileListApi],
		displayUI ? [0, 0.2, 0.4, 0.6] : [0, 0, 0.1, 0.4],
		500
	);

	// Expanding animation hooks
	const CARD_WIDTH = 315;
	const MAX_CARD_WIDTH = 1128;
	const PADDING = 80;
	const [expandedWidth, setExpandedWidth] = useState(CARD_WIDTH);
	const cardSpring = useSpring({
		from: { width: CARD_WIDTH },
		to: {
			width: isSelected ? Math.min(window.innerWidth - PADDING, MAX_CARD_WIDTH) : CARD_WIDTH,
		},
		onRest: () => {
			if (isSelected) {
				// Set expanded width to the final width of animation
				// Setting twice for react to re-render
				setExpandedWidth(Math.min(window.innerWidth - PADDING, MAX_CARD_WIDTH) + 1);
				setTimeout(() => {
					setExpandedWidth(Math.min(window.innerWidth - PADDING, MAX_CARD_WIDTH));
				}, 0);
			}
		},
		delay: isSelected ? 0 : 300,
		config: { tension: 300, friction: 27.5 },
	});

	return (
		<Card
			gradient={gradient && !isSelected ? 1 : 0}
			$active={swiperSlide.isActive}
			$selected={isSelected}
			$mounted={mounted}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={cardSpring}
		>
			<CardImage $backgroundImage={getPersonaImage(persona.id)} $selected={isSelected} />
			<OverlayContainer $selected={isSelected}>
				<Overlay>
					<OverlayHeader>
						<OverlayTitle>
							{isScheduleCreated && (
								<div>
									<span style={{ marginRight: '6px' }}>Profile Created</span>
									<ClockFading size={14} color={styles.colors.brand[400]} />
									<span style={{ color: styles.colors.gray[300] }}>
										{personaScheduleTimeLeft} left
									</span>
								</div>
							)}
							<h3>{persona.name}</h3>
						</OverlayTitle>
						<OverlayHeaderTag style={overlayTagSpring}>Tiles</OverlayHeaderTag>
					</OverlayHeader>
					<OverlayList style={tileListSpring}>
						{tileListTransition((style, tile) => (
							<OverlayListItem
								key={tile.id}
								style={style}
								$isSelected={tile.selected}
							>
								<span>{tile.name}</span>
								<button onClick={() => toggleTileSuggestion(tile.id)}>
									{tile.selected ? <Check size={14} /> : <Add size={12} />}
								</button>
							</OverlayListItem>
						))}
					</OverlayList>
					<ButtonContainer>
						<ButtonStyled style={buttonSpring} onClick={onSelect}>
							<ArrowRight2 />
						</ButtonStyled>
					</ButtonContainer>
				</Overlay>
			</OverlayContainer>
			{/* Set expanded width to the final width of animation */}
			<PersonaCardExpanded
				persona={currentPersona}
				expanded={isSelected}
				onCollapse={onDeselect}
				expandedWidth={expandedWidth}
				personaSchedules={personaSchedules}
				setPersonaSchedule={setPersonaSchedule}
			/>
		</Card>
	);
};

export default PersonaCard;
