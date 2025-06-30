import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '../../icons/add';
import ArrowRight2 from '../../icons/arrow_right2';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import useIsMobile from '../../../hooks/useIsMobile';
import PersonaExpandedCard from './persona_expanded_card';

const Card = styled(animated.div)<{
	gradient?: number;
	$active: boolean;
	$selected?: boolean;
}>`
	min-width: 315px;
	height: 100%;
	background-size: cover;
	background-position: center;
	border-radius: ${styles.borderRadius.xxLarge};
	color: white;
	position: relative;
	opacity: ${(props) => (props.$active ? 1 : 0.5)};
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
	padding: 1.5rem;
`;

const OverlayHeader = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const OverlayTitle = styled.h3`
	font-size: ${styles.typography.fontSize.displayXs};
	font-weight: bold;
	font-family: ${styles.typography.fontFamily.urban};
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
	justify-content: center;
	gap: 0.5rem;
`;

const OverlayListItem = styled(animated.li)`
	width: fit-content;
	display: flex;
	gap: 0.25rem;
	justify-content: space-between;
	align-items: center;
	font-size: ${styles.typography.fontSize.sm};
	color: ${styles.colors.white};

	background: ${styles.colors.gray[800]};
	border-radius: ${styles.borderRadius.xLarge};
	border: 1px solid ${styles.colors.gray[700]};
	padding-left: 12px;
	line-height: 1.3;
	color: ${styles.colors.gray[100]};

	button {
		height: 32px;
		width: 32px;
		display: grid;
		place-items: center;
		border-radius: ${styles.borderRadius.xLarge};
		color: ${styles.colors.gray[500]};
		transition: color 0.25s ease-in-out;

		&:hover {
			color: ${styles.colors.gray[300]};
		}
	}
`;

const ButtonContainer = styled.div`
	margin-top: -3rem;
	display: flex;
	align-items: center;
	justify-content: end;
	border-radius: 0 0 ${styles.borderRadius.xxLarge} ${styles.borderRadius.xxLarge};
`;

const ButtonStyled = styled(animated.button)`
	width: 36px;
	height: 36px;
	display: grid;
	place-items: center;
	border-radius: ${styles.borderRadius.xxLarge};
	background-color: ${styles.colors.brand[600]};

	&:hover {
		background-color: ${styles.colors.brand[700]};
	}
	transition: background-color 0.3s ease-in-out;
`;

const tileSuggestions = [
	{ id: 1, name: 'Tile Suggestion 1' },
	{ id: 2, name: 'Tile Suggestion 2' },
];

interface PersonaCardProps {
	persona: number;
	occupation: string;
	backgroundImage: string;
	gradient?: boolean;
	selectedPersona: number | null;
	setSelectedPersona: React.Dispatch<React.SetStateAction<number | null>>;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
	persona,
	occupation,
	backgroundImage,
	gradient,
	selectedPersona,
	setSelectedPersona,
}) => {
	const isSelected = selectedPersona === persona; // Check if this card is selected
	const isNotCurrentSelected = selectedPersona !== null && selectedPersona !== persona; // Check if another card is selected

	const swiper = useSwiper();
	const swiperSlide = useSwiperSlide();
	const [mouseHovered, setHovered] = useState(false);
	const isMobile = useIsMobile();
	const displayUI = mouseHovered || (swiperSlide.isActive && isMobile);

	function onSelect() {
		setSelectedPersona(persona); // Update the selected state
	}
	function onDeselect() {
		setSelectedPersona(null); // Clear the selected state
		swiper.enable(); // Re-enable the swiper
	}

	useEffect(() => {
		if (isNotCurrentSelected && swiperSlide.isActive) {
			let diff = selectedPersona - persona;
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
		to: { height: displayUI ? 40 * tileSuggestions.length + 16 : 0 },
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
		to: { opacity: displayUI ? 1 : 0, scale: displayUI ? 1 : 0.9 },
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
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={cardSpring}
		>
			<CardImage $backgroundImage={backgroundImage} $selected={isSelected} />
			<OverlayContainer $selected={isSelected}>
				<Overlay>
					<OverlayHeader>
						<OverlayTitle>{occupation}</OverlayTitle>
						<OverlayHeaderTag style={overlayTagSpring}>Tiles</OverlayHeaderTag>
					</OverlayHeader>
					<OverlayList style={tileListSpring}>
						{tileListTransition((style, tile) => (
							<OverlayListItem key={tile.id} style={style}>
								<span>{tile.name}</span>
								<button>
									<Add size={12} />
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
			<PersonaExpandedCard
				occupation={occupation}
				display={isSelected}
				onCollapse={onDeselect}
				expandedWidth={expandedWidth}
			/>
		</Card>
	);
};

export default PersonaCard;
