import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import pallette from '../../../core/theme/pallete';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '../../../core/common/components/icons/add';
import ArrowRight2 from '../../../core/common/components/icons/arrow_right2';
import {
  animated,
  Partial,
  useChain,
  useSpring,
  useSpringRef,
  useTransition,
} from '@react-spring/web';
import useIsMobile from '../../../core/common/hooks/useIsMobile';
import PersonaCardExpanded from './persona_card_expanded';
import { Persona } from '../../../core/common/types/persona';
import { Check, ClockFading } from 'lucide-react';
import {
  PersonaSchedule,
  PersonaScheduleSetter,
} from '../../../core/common/hooks/usePersonaSchedules';
import TimeUtil from '../../../core/util/time';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import PersonaUtil from '@/core/util/persona';

const Card = styled(animated.div) <{
  gradient?: number;
  $active: boolean;
  $selected?: boolean;
  $mounted?: boolean;
}>`
	min-width: 315px;
	height: 100%;
	background-size: cover;
	background-position: center;
	border-radius: ${pallette.borderRadius.xxLarge};
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
		border-radius: calc(${pallette.borderRadius.xxLarge} - 2.5px);
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
		border-radius: ${pallette.borderRadius.xxLarge};
		background: ${(props) =>
    props.gradient
      ? `conic-gradient(from var(--rotation) at 50% 50%, #B827FC, #2C90FC, #B8FD33, #FEC837, #FD1892,  #B827FC)`
      : pallette.colors.gray[800]};
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
	border-radius: calc(${pallette.borderRadius.xxLarge} - 2px);
	transition: opacity 0.3s ease-in-out;
`;

const OverlayContainer = styled.div<{ $selected: boolean }>`
	position: absolute;
	inset: 2px;
	overflow: hidden;

	border-radius: ${pallette.borderRadius.xxLarge};
	border: 1px solid ${pallette.colors.gray[700]};

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
		font-size: ${pallette.typography.fontSize.xs};
		font-weight: ${pallette.typography.fontWeight.medium};
		color: ${pallette.colors.gray[400]};
		opacity: 0.75;
	}

	.persona-title {
		font-size: ${pallette.typography.fontSize.displayXs};
		font-weight: bold;
		font-family: ${pallette.typography.fontFamily.urban};
	}

	h3 {
		line-height: 28px;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	input {
		padding: 0.25rem 0.5rem;
		background: transparent;
		height: calc(28px + 0.5rem);
		width: 100%;
		outline: 2px solid transparent;
		border: none;
		transition: outline 0.25s ease-in-out;

		&::placeholder {
			color: rgba(255, 255, 255, 0.3);
		}

		&:focus {
			outline: 2px solid ${pallette.colors.gray[700]};
			border-radius: ${pallette.borderRadius.small};
		}
	}
`;

const OverlayHeaderTag = styled(animated.span)`
	font-size: ${pallette.typography.fontSize.sm};
	font-weight: ${pallette.typography.fontWeight.semibold};
	background: ${pallette.colors.white};
	color: ${pallette.colors.gray[800]};
	padding: 6px 1rem;
	line-height: 1;
	border-radius: ${pallette.borderRadius.xLarge};
`;

const OverlayList = styled(animated.ul)`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	z-index: 1;
`;

const OverlayListItem = styled(animated.li) <{ $isSelected: boolean }>`
	height: fit-content;
	width: fit-content;
	display: flex;
	gap: 0.25rem;
	align-items: center;
	font-size: ${pallette.typography.fontSize.sm};
	color: ${pallette.colors.white};

	background: ${({ $isSelected }) =>
    $isSelected ? pallette.colors.brand[600] : pallette.colors.gray[800]};
	border-radius: ${pallette.borderRadius.xLarge};
	border: 1px solid
		${({ $isSelected }) => ($isSelected ? 'transparent' : pallette.colors.gray[700])};
	padding-left: 12px;
	line-height: 1.3;
	color: ${pallette.colors.gray[100]};
	transition:
		background-color 0.25s ease-in-out,
		color 0.25s ease-in-out;

	button {
		height: 32px;
		width: 32px;
		display: grid;
		place-items: center;
		border-radius: ${pallette.borderRadius.xLarge};
		color: ${({ $isSelected }) =>
    $isSelected ? pallette.colors.white : pallette.colors.gray[400]};
		transition: color 0.25s ease-in-out;

		&:hover {
			color: ${pallette.colors.gray[300]};
		}
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	margin-top: -2.25rem;
	align-items: center;
	justify-content: end;
	border-radius: 0 0 ${pallette.borderRadius.xxLarge} ${pallette.borderRadius.xxLarge};
	z-index: 2;
`;

const ButtonStyled = styled(animated.button)`
	width: 36px;
	height: 36px;
	display: grid;
	place-items: center;
	border-radius: ${pallette.borderRadius.xxLarge};
	background-color: ${pallette.colors.brand[600]};
	box-shadow: 0 0 4px 8px rgba(0, 0, 0, 0.1);
	&:hover {
		background-color: ${pallette.colors.brand[700]};
	}
	transition: background-color 0.3s ease-in-out;
`;

type PersonaCardProps = {
  persona: Persona & { key: number };
  isCustom?: boolean;
  selectedPersona: number | null;
  setSelectedPersona: (personaKey: number | null, persona?: Partial<Persona>) => void;
  personaSchedules: PersonaSchedule;
  setPersonaSchedule: PersonaScheduleSetter;
};

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  isCustom,
  selectedPersona,
  setSelectedPersona,
  personaSchedules,
  setPersonaSchedule,
}) => {
  const { t } = useTranslation();
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
          const timeLeft = TimeUtil.rangeDuration(
            dayjs(),
            dayjs(personaSchedule.scheduleExpiration)
          );
          setPersonaScheduleTimeLeft(timeLeft);
          if (timeLeft === '0m') {
            clearInterval(personaScheduleTimeLeftInterval);
            setPersonaSchedule(persona.id, null); // Clear the schedule when it expires
            if (selectedPersona === persona.key) onDeselect(); // Deselect the card if it's selected
          }
        },
        TimeUtil.inMilliseconds(1, 'm')
      );
      setPersonaScheduleTimeLeftInterval(intervalID);
    }

    return () => {
      clearInterval(personaScheduleTimeLeftInterval);
    };
  }, [personaSchedule]);

  const isSelected = selectedPersona === persona.key;
  const isAnotherSelected = selectedPersona !== null && selectedPersona !== persona.key;
  const isScheduleCreated = !!personaSchedule;

  const [tileSuggestions, setTileSuggestions] = useState<
    { id: number; name: string; selected: boolean }[]
  >([]);

  useEffect(() => {
    if (isScheduleCreated || isCustom) {
      setTileSuggestions([]);
    } else {
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

  // State to manage the input for custom persona
  const customInputFormRef = React.useRef<HTMLFormElement>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  useEffect(() => {
    if (showCustomInput && customInputFormRef.current) {
      customInputFormRef.current.querySelector('input')?.focus();
    }
  }, [showCustomInput]);

  function onCustomSelect() {
    if (!customInputValue.trim()) {
      customInputFormRef.current?.querySelector('input')?.focus();
      return;
    }
    setShowCustomInput(false);
    setCustomInputValue('');
    setSelectedPersona(persona.key, {
      id: persona.id,
      name: customInputValue.trim(),
    });
  }
  function onCustomDeselect() {
    setSelectedPersona(null, {
      id: persona.id,
      name: 'Custom',
    });
    setPersonaSchedule(persona.id, null, { store: false });
    swiper.enable();
  }

  function onSelect() {
    setSelectedPersona(persona.key);
  }
  function onDeselect() {
    setSelectedPersona(null);
    swiper.enable();
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
    to: {
      opacity: displayUI ? (isScheduleCreated || isCustom ? 0 : 1) : 0,
      scale: displayUI ? 1 : 0.9,
    },
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
  const MAX_CARD_WIDTH = 1300;
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
      gradient={isCustom && !isSelected ? 1 : 0}
      $active={swiperSlide.isActive}
      $selected={isSelected}
      $mounted={mounted}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardSpring}
    >
      <CardImage
        $backgroundImage={PersonaUtil.getPersonaImage(persona.id)}
        $selected={isSelected}
      />
      <OverlayContainer $selected={isSelected}>
        <Overlay>
          <OverlayHeader>
            <OverlayTitle>
              {isScheduleCreated && (
                <div>
                  <span style={{ marginRight: '6px' }}>
                    {t('home.persona.created')}
                  </span>
                  <ClockFading size={14} color={pallette.colors.brand[400]} />
                  <span style={{ color: pallette.colors.gray[300] }}>
                    {t('home.persona.expiresIn', {
                      time: personaScheduleTimeLeft,
                    })}
                  </span>
                </div>
              )}
              {showCustomInput ? (
                <form
                  ref={customInputFormRef}
                  onSubmit={(e) => {
                    e.preventDefault();
                    onCustomSelect();
                  }}
                >
                  <input
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    className="persona-title"
                    placeholder={t('home.persona.custom.namePlaceholder')}
                  />
                </form>
              ) : (
                <h3 className="persona-title">{persona.name}</h3>
              )}
            </OverlayTitle>
            <OverlayHeaderTag style={overlayTagSpring}>
              {t('home.persona.tileSuggestions')}
            </OverlayHeaderTag>
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
            {isCustom ? (
              <ButtonStyled
                style={buttonSpring}
                onClick={() => {
                  if (showCustomInput) {
                    onCustomSelect();
                  } else {
                    setShowCustomInput(true);
                  }
                }}
              >
                {showCustomInput ? <ArrowRight2 /> : <Add size={16} />}
              </ButtonStyled>
            ) : (
              <ButtonStyled style={buttonSpring} onClick={onSelect}>
                <ArrowRight2 />
              </ButtonStyled>
            )}
          </ButtonContainer>
        </Overlay>
      </OverlayContainer>
      {/* Set expanded width to the final width of animation */}
      <PersonaCardExpanded
        isCustom={isCustom}
        persona={currentPersona}
        expanded={isSelected}
        onCollapse={isCustom ? onCustomDeselect : onDeselect}
        expandedWidth={expandedWidth}
        personaSchedules={personaSchedules}
        setPersonaSchedule={setPersonaSchedule}
      />
    </Card>
  );
};

export default PersonaCard;
