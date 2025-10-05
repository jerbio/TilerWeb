import React, { useEffect, useMemo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import palette from '@/core/theme/palette';
import { useSwiper, useSwiperSlide } from 'swiper/react';
import Add from '@/core/common/components/icons/add';
import ArrowRight2 from '@/core/common/components/icons/arrow_right2';
import {
	animated,
	Partial,
	useChain,
	useSpring,
	useSpringRef,
	useTransition,
} from '@react-spring/web';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import PersonaCardExpanded from './persona_card_expanded';
import { Persona } from '@/core/common/types/persona';
import { Check, ClockFading } from 'lucide-react';
import { PersonaUsers, PersonaUserSetter } from '@/core/common/hooks/usePersonaUsers';
import TimeUtil from '@/core/util/time';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import PersonaUtil from '@/core/util/persona';
import { Env } from '@/config/config_getter';

type PersonaCardProps = {
	persona: Persona & { key: number };
	isCustom?: boolean;
	selectedPersona: number | null;
	setSelectedPersona: (personaKey: number | null, persona?: Partial<Persona>) => void;
	personaUsers: PersonaUsers;
	setPersonaUser: PersonaUserSetter;
};

const PersonaCard: React.FC<PersonaCardProps> = ({
	persona,
	isCustom,
	selectedPersona,
	setSelectedPersona,
	personaUsers,
	setPersonaUser,
}) => {
	const { t } = useTranslation();
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	const personaUser = personaUsers[persona.id];
	const  baseUrl = Env.get('BASE_URL');
	const [personaUserTimeLeft, setPersonaUserTimeLeft] = useState<string>('');
	const [personaUserTimeLeftInterval, setPersonaUserTimeLeftInterval] = useState<
		NodeJS.Timeout | undefined
	>(undefined);

	// Update the time left for the persona user every minute
	useEffect(() => {
		if (personaUser) {
			clearInterval(personaUserTimeLeftInterval);

			setPersonaUserTimeLeft(TimeUtil.rangeDuration(dayjs(), dayjs(personaUser.expiration)));
			const intervalID = setInterval(
				() => {
					const timeLeft = TimeUtil.rangeDuration(dayjs(), dayjs(personaUser.expiration));
					setPersonaUserTimeLeft(timeLeft);
					if (timeLeft === '0m') {
						clearInterval(personaUserTimeLeftInterval);
						setPersonaUser(persona.id, { userId: null }); // Clear the user when it expires
						if (selectedPersona === persona.key) onDeselect(); // Deselect the card if it's selected
					}
				},
				TimeUtil.inMilliseconds(1, 'm')
			);
			setPersonaUserTimeLeftInterval(intervalID);
		}

		return () => {
			clearInterval(personaUserTimeLeftInterval);
		};
	}, [personaUser]);

	const isSelected = selectedPersona === persona.key;
	const isAnotherSelected = selectedPersona !== null && selectedPersona !== persona.key;
	const personaUserExists = !!personaUser;

	const [tileSuggestions, setTileSuggestions] = useState<
		{ id: number; name: string; selected: boolean }[]
	>([]);

	useEffect(() => {
		if (personaUserExists || isCustom) {
			setTileSuggestions([]);
		} else {
			setTileSuggestions(
				persona.tilePreferences?.map((pref, index) => ({
					id: index + 1,
					name: pref.TileName,
					selected: false,
				})) || []
			);
		}
	}, [persona.tilePreferences, personaUserExists]);

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

	// State to manage the input for custom persona
	const customInputFormRef = React.useRef<HTMLFormElement>(null);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customInputValue, setCustomInputValue] = useState('');

	const displayUI = mouseHovered || showCustomInput || (swiperSlide.isActive && isMobile);

	// Focus the input when it is shown
	function focusInput() {
		const input = customInputFormRef.current?.querySelector('input');
		if (input) {
			input.focus();
			swiper.disable();
			input.addEventListener('blur', (e) => {
				const input = e.target as HTMLInputElement;
				if (!input.value.trim()) {
					setShowCustomInput(false);
					swiper.enable();
					swiper.autoplay.resume();
				}
			});
		}
	}

	useEffect(() => {
		if (showCustomInput && customInputFormRef.current) {
			focusInput();
		}
	}, [showCustomInput]);

	function onCustomSelect() {
		if (!customInputValue.trim()) {
			focusInput();
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
		setSelectedPersona(null);
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
		to: { height: displayUI && tileSuggestions.length ? 40 * tileSuggestions.length + 40 : 0 },
		config: { tension: 200, friction: 30 },
	});
	const buttonApi = useSpringRef();
	const buttonSpring = useSpring({
		ref: buttonApi,
		from: { y: 32, opacity: 0 },
		to: { y: displayUI ? 0 : 32, opacity: displayUI ? 1 : 0 },
	});
	const overlayTagApi = useSpringRef();
	const overlayTagSpring = useSpring({
		ref: overlayTagApi,
		from: { opacity: 0, scale: 0.9 },
		to: {
			opacity: displayUI ? (personaUserExists || isCustom ? 0 : 1) : 0,
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
	const MAX_CARD_WIDTH = 1800;
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

	function handleCardClick() {
		if (isCustom && !personaUserExists) {
			if (showCustomInput) {
				onCustomSelect();
			} else {
				setShowCustomInput(true);
			}
		} else {
			onSelect();
		}
	}

	return (
		<Card
			onClick={handleCardClick}
			gradient={isCustom && !isSelected ? 1 : 0}
			$active={swiperSlide.isActive}
			$selected={isSelected}
			$mounted={mounted}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={cardSpring}
		>
			<CardImage
				$backgroundImage={
					 persona.id != 'custom-persona' && persona.imageUrl && persona.imageUrl !== '' ? `${baseUrl}${persona.imageUrl}` : PersonaUtil.getPersonaImage(persona.id)
				}
				$selected={isSelected}
			/>
			<OverlayContainer $selected={isSelected}>
				<Overlay>
					<OverlayHeader>
						<OverlayTitle onClick={(e) => e.stopPropagation()}>
							{personaUserExists && (
								<div>
									<span style={{ marginRight: '6px' }}>
										{isCustom
											? t('home.persona.customCreated')
											: t('home.persona.created')}
									</span>
									<ClockFading
										size={14}
										color={palette.colors.brand[400]}
										style={{
											// shadow
											filter: 'drop-shadow(0 0 4px black',
										}}
									/>
									<span style={{ color: palette.colors.gray[300] }}>
										{t('home.persona.expiresIn', {
											time: personaUserTimeLeft,
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
								onClick={(e) => e.stopPropagation()}
							>
								<span>{tile.name}</span>
								<button onClick={() => toggleTileSuggestion(tile.id)}>
									{tile.selected ? <Check size={14} /> : <Add size={12} />}
								</button>
							</OverlayListItem>
						))}
					</OverlayList>
					<ButtonContainer>
						{isCustom && !personaUserExists ? (
							<ButtonStyled style={buttonSpring}>
								{showCustomInput ? (
									<ArrowRight2 size={16} />
								) : (
									<span>{t('home.persona.cta.create')}</span>
								)}
							</ButtonStyled>
						) : (
							<ButtonStyled $block={!personaUserExists} style={buttonSpring}>
								<span>
									{personaUserExists
										? t('home.persona.cta.view')
										: t('home.persona.cta.create')}
								</span>
							</ButtonStyled>
						)}
					</ButtonContainer>
				</Overlay>
			</OverlayContainer>
			{/* Set expanded width to the final width of animation */}
			<PersonaCardExpanded
				onClick={(e) => e.stopPropagation()}
				persona={currentPersona}
				expanded={isSelected}
				onCollapse={isCustom ? onCustomDeselect : onDeselect}
				expandedWidth={expandedWidth}
				personaUsers={personaUsers}
				setPersonaUser={setPersonaUser}
			/>
		</Card>
	);
};

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
	border-radius: ${palette.borderRadius.xxLarge};
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
		border-radius: calc(${palette.borderRadius.xxLarge} - 2.5px);
		background: linear-gradient(transparent, 66%, rgba(0, 0, 0, 0.3), 88%, rgba(0, 0, 0, 0.8));
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
		border-radius: ${palette.borderRadius.xxLarge};
		background: ${(props) =>
			props.gradient
				? `conic-gradient(from var(--rotation) at 50% 50%, #B827FC, #2C90FC, #B8FD33, #FEC837, #FD1892,  #B827FC)`
				: palette.colors.gray[800]};
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
	border-radius: calc(${palette.borderRadius.xxLarge} - 2px);
	transition: opacity 0.3s ease-in-out;
`;

const OverlayContainer = styled.div<{ $selected: boolean }>`
	position: absolute;
	inset: 2px;
	overflow: hidden;

	border-radius: ${palette.borderRadius.xxLarge};
	border: 1px solid ${palette.colors.gray[700]};

	display: flex;
	align-items: flex-end;

	opacity: ${(props) => (props.$selected ? 0 : 1)};
	pointer-events: ${(props) => (props.$selected ? 'none' : 'auto')};
	transition: opacity 0.3s ease-in-out;
`;

const Overlay = styled.div`
	background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
	width: 100%;
	padding: 1rem 1rem;
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
		font-size: ${palette.typography.fontSize.xs};
		font-weight: ${palette.typography.fontWeight.medium};
		color: ${palette.colors.gray[400]};
		// text shadow
		text-shadow: 0 0 8px black;
	}

	.persona-title {
		font-size: ${palette.typography.fontSize.displayXs};
		font-weight: bold;
		font-family: ${palette.typography.fontFamily.urban};
	}

	h3 {
		line-height: 28px;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	form {
		width: 230px;
	}

	input {
		padding: 0.25rem 0.5rem;
		background: #23232333;
		border-radius: ${palette.borderRadius.small};
		height: calc(28px + 0.5rem);
		width: 100%;
		border: none;
		outline: none;
		box-shadow: 0 0 0 2px ${palette.colors.gray[900]} inset;
		transition: outline 0.25s ease-in-out;

		&::placeholder {
			color: rgba(255, 255, 255, 0.3);
		}

		&:focus {
			box-shadow: 0 0 0 2px ${palette.colors.gray[700]} inset;
		}
	}
`;

const OverlayHeaderTag = styled(animated.span)`
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	background: ${palette.colors.white};
	color: ${palette.colors.gray[800]};
	padding: 6px 1rem;
	line-height: 1;
	border-radius: ${palette.borderRadius.xLarge};
`;

const OverlayList = styled(animated.ul)`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	z-index: 1;
`;

const gradientMove = keyframes`
  0%  { background-position: 100% 50%; }
	100%   { background-position: 0% 50%; }
`;

const buttonPulse = keyframes`
  50%  { color: ${palette.colors.gray[400]}; }
  60%  { color: white; }
  70%  { color: ${palette.colors.gray[400]}; }
`;

const OverlayListItem = styled(animated.li)<{ $isSelected: boolean }>`
	height: fit-content;
	width: fit-content;
	display: flex;
	gap: 0.2rem;
	align-items: center;
	font-size: 13px;
	color: ${palette.colors.white};

	background: ${({ $isSelected }) =>
		$isSelected
			? palette.colors.brand[600]
			: `
				linear-gradient(90deg,
					#232323a7,
					40%, #232323a7,
					 ${palette.colors.gray[700]}, 
					#232323a7, 58%,
					#232323a7
				) 
			`};
	background-size: 1200% 1200%;
	backdrop-filter: blur(16px);
	${({ $isSelected }) =>
		!$isSelected &&
		css`
			animation: ${gradientMove} 3s linear infinite;
		`}
	border-radius: ${palette.borderRadius.xLarge};
	border: 1px solid
		${({ $isSelected }) => ($isSelected ? 'transparent' : palette.colors.gray[700])};
	padding-left: 12px;
	line-height: 1.3;
	color: ${palette.colors.gray[100]};
	transition:
		background-color 0.25s ease-in-out,
		color 0.25s ease-in-out;

	button {
		height: 30px;
		width: 30px;
		display: grid;
		place-items: center;
		border-radius: ${palette.borderRadius.xLarge};
		color: ${({ $isSelected }) =>
			$isSelected ? palette.colors.white : palette.colors.gray[400]};
		${({ $isSelected }) =>
			!$isSelected &&
			css`
				animation: ${buttonPulse} 3s linear infinite;
			`}
		transition: color 0.5s ease-in-out;

		&:hover {
			color: ${palette.colors.gray[300]} !important;
		}
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	margin-top: -2.25rem;
	align-items: center;
	justify-content: end;
	border-radius: 0 0 ${palette.borderRadius.xxLarge} ${palette.borderRadius.xxLarge};
	z-index: 2;
`;

const ButtonStyled = styled(animated.button)<{ $block?: boolean }>`
	width: ${({ $block }) => ($block ? '100%' : 'auto')};
	z-index: 1;
	display: grid;
	place-items: center;
	min-width: 36px;
	height: 36px;
	border-radius: ${palette.borderRadius.xxLarge};
	background-color: #23232333;
	border: 1px solid ${palette.colors.gray[700]};
	backdrop-filter: blur(16px);
	box-shadow: 0 0 4px 8px rgba(0, 0, 0, 0.1);
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	&:hover {
		background-color: ${palette.colors.gray[700]};
	}

	span {
		padding-inline: 1rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	transition: background-color 0.3s ease-in-out;
`;

export default PersonaCard;
