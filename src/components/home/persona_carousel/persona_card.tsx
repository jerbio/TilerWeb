import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '../../icons/add';
import ArrowRight2 from '../../icons/arrow_right2';
import {
  animated,
  useChain,
  useSpring,
  useSpringRef,
  useTransition,
} from '@react-spring/web';
import useIsMobile from '../../../hooks/useIsMobile';
import PersonaExpandedCard from './persona_expanded_card';

interface PersonaCardProps {
  slideIndex: number;
  occupation: string;
  backgroundImage: string;
  gradient?: boolean;
  notCurrentSelected: boolean;
  selected: boolean;
  setSelected: React.Dispatch<React.SetStateAction<number | null>>;
}

const Card = styled(animated.div) <{ gradient?: number; $active: boolean }>`
	min-width: 315px;
	height: 100%;
	background-size: cover;
	background-position: center;
	border-radius: ${styles.borderRadius.xxLarge};
	color: white;
	position: relative;
	opacity: ${(props) => (props.$active ? 1 : 0.5)};
	transition: opacity 0.3s ease-in-out;

	/* Dark fade effect */
	&::before {
		content: '';
		position: absolute;
		inset: 2px;
		z-index: -1;
		border-radius: calc(${styles.borderRadius.xxLarge} - 2.5px);
		background: linear-gradient(
			transparent,
			66%,
			rgba(0, 0, 0, 0.6),
			88%,
			rgba(0, 0, 0, 0.9)
		);
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
	background: ${styles.colors.brand[600]};

	&:hover {
		background: ${styles.colors.brand[700]};
	}
	transition: background 0.3s ease-in-out;
`;

const dummyTiles = [
  { id: 1, name: 'Dummy Tile 1' },
  { id: 2, name: 'Dummy Tile 2' },
];

const PersonaCard: React.FC<PersonaCardProps> = ({
  slideIndex,
  occupation,
  backgroundImage,
  gradient,
  selected,
  notCurrentSelected,
  setSelected,
}) => {
  const swiper = useSwiper();
  const swiperSlide = useSwiperSlide();
  const [mouseHovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const displayUI = swiperSlide.isActive && (mouseHovered || isMobile);

  function onSelect() {
    setSelected(slideIndex); // Update the selected state
  }
  function onDeselect() {
    setSelected(null); // Clear the selected state
    swiper.enable(); // Re-enable the swiper
  }

  useEffect(() => {
    if (selected && !notCurrentSelected) {
      // Enable the swiper when a card is selected
      swiper.disable();
    }
  }, [selected]);

  // isActive animation hooks
  const tileListTransApi = useSpringRef();
  const tileListTransition = useTransition(displayUI ? dummyTiles : [], {
    ref: tileListTransApi,
    keys: (tile) => tile.id,
    trail: 150 / dummyTiles.length,
    from: { opacity: 0, scale: 0.8, y: 20 },
    enter: { opacity: 1, scale: 1, y: 0 },
    leave: { opacity: 0, scale: 0.8, y: -20 },
  });

  const tileListApi = useSpringRef();
  const tileListSpring = useSpring({
    ref: tileListApi,
    from: { height: 0 },
    to: { height: displayUI ? 40 * dummyTiles.length + 16 : 0 },
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
  const MAX_CARD_WIDTH = 1000;
  const PADDING = 64;
  const cardSpring = useSpring({
    from: { width: CARD_WIDTH },
    to: {
      width: selected
        ? Math.min(window.innerWidth - PADDING, MAX_CARD_WIDTH)
        : CARD_WIDTH,
    },
    delay: selected ? 0 : 300,
    config: { tension: 300, friction: 27.5 },
  });

  return (
    <Card
      gradient={gradient && !selected ? 1 : 0}
      $active={swiperSlide.isActive}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardSpring}
    >
      <CardImage $backgroundImage={backgroundImage} $selected={selected} />
      <OverlayContainer $selected={selected}>
        <Overlay>
          <OverlayHeader>
            <OverlayTitle>{occupation}</OverlayTitle>
            <OverlayHeaderTag style={overlayTagSpring}>
              Tiles
            </OverlayHeaderTag>
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
      <PersonaExpandedCard occupation={occupation} display={selected} onCollapse={onDeselect} />
    </Card>
  );
};

export default PersonaCard;

