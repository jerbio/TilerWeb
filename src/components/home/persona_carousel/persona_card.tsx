import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '../../icons/add';
import ArrowRight2 from '../../icons/arrow_right2';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';

interface PersonaCardProps {
  slideIndex: number;
  occupation: string;
  backgroundImage: string;
  gradient?: boolean;
  selected: boolean;
  setSelected: React.Dispatch<React.SetStateAction<number | null>>;
}

const Card = styled.div<{ gradient?: boolean, active: boolean }>`
	width: 315px;
	height: 680px;
	background-size: cover;
	background-position: center;
	border-radius: ${styles.borderRadius.xxLarge};
	color: white;
	position: relative;
	isolation: isolate;
  opacity: ${(props) => (props.active ? 1 : 0.5)};
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
      animation: rotate 5s linear infinite;`
  }

		content: '';
		position: absolute;
		inset: 0;
		z-index: -3;
		border-radius: ${styles.borderRadius.xxLarge};
		background: ${(props) =>
    props.gradient
      ? `conic-gradient(from var(--rotation) at 50% 50%, #B827FC, #2C90FC, #B8FD33, #FEC837, #FD1892,  #B827FC)`
      : styles.colors.gray[800]};
		opacity: ${(props) => (props.gradient ? 0.75 : 1)};
	}
`;

const CardImage = styled.div<{ backgroundImage: string }>`
	background-image: url(${(props) => props.backgroundImage});
	background-size: cover;
	background-position: center;
	position: absolute;
	inset: 2px;
	z-index: -2;
	border-radius: calc(${styles.borderRadius.xxLarge} - 2px);
`;

const OverlayContainer = styled.div`
  position: absolute;
  inset: 2px;
  overflow: hidden;
  
  border-radius: ${styles.borderRadius.xxLarge};
  border: 1px solid ${styles.colors.gray[700]};
  
  display: flex;
  align-items: flex-end;
`;

const Overlay = styled.div`
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9),
    transparent
  );
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
  font-weight: ${styles.typography.fontWeight.medium};
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
  gap: .75rem;
  justify-content: space-between;
  align-items: center;
  font-size: ${styles.typography.fontSize.sm};
  font-weight: ${styles.typography.fontWeight.light};
  color: ${styles.colors.white};

  background: ${styles.colors.gray[800]};
  border-radius: ${styles.borderRadius.xLarge};
  border: 1px solid ${styles.colors.gray[700]};
  padding: 6px 12px;
  line-height: 1.3;
  color: ${styles.colors.gray[100]};

  button {
    color: ${styles.colors.gray[500]};
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
  setSelected,
}) => {
  const swiper = useSwiper();
  const swiperSlide = useSwiperSlide();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) {
      swiper.autoplay.pause();
    } else {
      swiper.autoplay?.resume();
    }
  }, [hovered]);

  function onSelect() {
    setSelected(slideIndex); // Update the selected state
    swiper.slideToLoop(slideIndex, 500);
    swiper.autoplay.pause();
  }
  function onDeselect() {
    setSelected(null); // Clear the selected state
    swiper.slideToLoop(slideIndex, 500);
    swiper.autoplay.resume();
  }

  // Animation hooks
  const tileListTransApi = useSpringRef();
  const tileListTransition = useTransition(hovered ? dummyTiles : [], {
    ref: tileListTransApi,
    keys: (tile) => tile.id,
    trail: 200 / dummyTiles.length,
    from: { opacity: 0, scale: 0.8, y: 20 },
    enter: { opacity: 1, scale: 1, y: 0 },
    leave: { opacity: 0, scale: 0.8, y: -20 },
  });

  const tileListApi = useSpringRef();
  const tileListSpring = useSpring({
    ref: tileListApi,
    from: { height: 0 },
    to: { height: hovered ? (40 * dummyTiles.length) + 16 : 0 },
    config: { tension: 200, friction: 30 },
  });

  const buttonApi = useSpringRef();
  const buttonSpring = useSpring({
    ref: buttonApi,
    from: { x: -32, opacity: 0 },
    to: { x: hovered ? 0 : -32, opacity: hovered ? 1 : 0 },
  });

  const overlayTagApi = useSpringRef();
  const overlayTagSpring = useSpring({
    ref: overlayTagApi,
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.9 },
    config: { tension: 250, friction: 30 },
  });

  useChain(
    hovered ? [tileListApi, buttonApi, tileListTransApi, overlayTagApi] : [overlayTagApi, tileListTransApi, buttonApi, tileListApi],
    hovered ? [0, 0.2, 0.4, 0.6] : [0, 0, 0.1, 0.4],
    500
  );

  return (
    <Card gradient={gradient} active={swiperSlide.isActive} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <CardImage backgroundImage={backgroundImage} />
      <OverlayContainer>
        <Overlay>
          <OverlayHeader>
            <OverlayTitle>{occupation}</OverlayTitle>
            <OverlayHeaderTag style={overlayTagSpring}>Tiles</OverlayHeaderTag>
          </OverlayHeader>
          <OverlayList style={tileListSpring}>
            {tileListTransition((style, tile) => (
              <OverlayListItem key={tile.id} style={style}>
                <span>{tile.name}</span>
                <button><Add size={12} /></button>
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

    </Card>
  );
};

export default PersonaCard;

