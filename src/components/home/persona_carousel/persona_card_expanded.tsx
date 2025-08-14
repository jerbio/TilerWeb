import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import PersonaCalendar from './persona_calendar';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import pallette from '@/core/theme/pallete';
import Button from '@/core/common/components/button';
import { Persona } from '@/core/common/types/persona';
import Chat from '@/core/common/components/chat/chat';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import { PersonaSchedule, PersonaScheduleSetter } from '@/core/common/hooks/usePersonaSchedules';
import { personaService } from '@/services';

type PersonaExpandedCardProps = {
	isCustom?: boolean;
	persona: Persona;
	expanded: boolean;
	onCollapse: () => void;
	expandedWidth: number;
	personaSchedules: PersonaSchedule;
	setPersonaSchedule: PersonaScheduleSetter;
};

const PersonaCardExpanded: React.FC<PersonaExpandedCardProps> = ({
	isCustom,
	expanded,
	persona,
	onCollapse,
	expandedWidth,
	personaSchedules,
	setPersonaSchedule,
}) => {
	const [mobileChatVisible, setMobileChatVisible] = useState(false);
	const isDesktop = !useIsMobile(parseInt(pallette.screens.lg, 10));
	const showChat = isDesktop || mobileChatVisible;
	const scheduleId = personaSchedules[persona.id]?.scheduleId || null;

	function onMobileCollapse() {
		setMobileChatVisible(false);
	}

	async function getPersonaSchedule() {
		const personaSchedule = await personaService.getPersonaSchedule(persona);
		if (personaSchedule) {
			setPersonaSchedule(persona.id, personaSchedule.scheduleId, {
				store: !isCustom,
			});
		}
	}

	useEffect(() => {
		if (expanded && !scheduleId) {
			getPersonaSchedule();
		}
	}, [expanded]);

	const content = [
		{
			key: 'calendar',
			container: CalendarContainer,
			content: (
				<React.Fragment>
					<PersonaCalendar expandedWidth={expandedWidth} scheduleId={scheduleId} />
					<CalendarContainerActionButtons>
						<MobileShowChatButton
							onClick={() => setMobileChatVisible(!mobileChatVisible)}
						>
							<Plus size={20} />
						</MobileShowChatButton>
					</CalendarContainerActionButtons>
				</React.Fragment>
			),
		},
		{
			key: 'chat',
			container: ChatContainer,
			content: <Chat onClose={isDesktop ? onCollapse : onMobileCollapse} />,
		},
	];

	// Content revealing animations
	const cardSpringRef = useSpringRef();
	const cardSpring = useSpring({
		ref: cardSpringRef,
		from: { opacity: 0 },
		to: { opacity: expanded ? 1 : 0 },
	});

	const contentTransRef = useSpringRef();
	const contentTransition = useTransition(
		expanded ? (showChat ? content : content.slice(0, 1)) : [],
		{
			keys: (item) => item.key,
			ref: contentTransRef,
			from: { opacity: 0, scale: 1.05 },
			enter: { opacity: 1, scale: 1 },
			leave: { opacity: 0, scale: 1 },
			trail: expanded ? 200 : 0,
			config: { tension: expanded ? 200 : 300 },
		}
	);

	useChain(
		expanded ? [cardSpringRef, contentTransRef] : [contentTransRef, cardSpringRef],
		expanded ? [0, 0.75] : [0, 1],
		300
	);

	return (
		<CardContainer $display={expanded} style={cardSpring}>
			<Header>
				<h2>{persona.name}</h2>
				<MobileCloseButtonContainer>
					<Button variant="ghost" height={32} onClick={onCollapse}>
						<ChevronLeftIcon size={16} />
						<span>Back</span>
					</Button>
				</MobileCloseButtonContainer>
			</Header>
			<CardContent>
				{contentTransition((style, item) => (
					<item.container style={style} key={item.key}>
						{item.content}
					</item.container>
				))}
			</CardContent>
		</CardContainer>
	);
};

const CardContainer = styled(animated.section)<{ $display: boolean }>`
	overflow: hidden;
	background: linear-gradient(to right, ${pallette.colors.black}, ${pallette.colors.gray[900]});
	border-radius: ${pallette.borderRadius.xxLarge};
	border: 2px solid ${pallette.colors.gray[800]};
	pointer-events: ${(props) => (props.$display ? 'auto' : 'none')};
	width: 100%;
	height: 100%;
	position: relative;

	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding-top: 1.5rem;

	@media screen and (min-width: ${pallette.screens.lg}) {
		padding-block: 1.5rem;
		padding-right: 2rem;
		gap: 1.5rem;
		flex-direction: column-reverse;
	}
`;

const Header = styled.header`
	padding-left: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;

	h2 {
		line-height: 1.2;
		font-weight: ${pallette.typography.fontWeight.bold};
		font-size: ${pallette.typography.fontSize.xl};
		font-family: ${pallette.typography.fontFamily.urban};
	}

	@media screen and (min-width: ${pallette.screens.lg}) {
		h2 {
			font-size: ${pallette.typography.fontSize.displayXs};
		}
	}
`;

const CardContent = styled.div`
	flex: 1;

	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(12, 1fr);
`;

const CalendarContainer = styled(animated.div)`
	position: relative;
	grid-column: span 12;
	overflow: hidden;
	height: 100%;
	background: ${pallette.colors.gray[900]};
	border-top: 1px solid ${pallette.colors.gray[700]};

	@media screen and (min-width: ${pallette.screens.lg}) {
		grid-column: span 8;
		border: 1px solid ${pallette.colors.gray[700]};
		border-left: none;
		border-radius: 0 ${pallette.borderRadius.large} ${pallette.borderRadius.large} 0;
	}
	@media screen and (min-width: ${pallette.screens.xl}) {
		grid-column: span 9;
	}
`;

const ChatContainer = styled(animated.div)`
	position: absolute;
	inset: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1acc, #000000cc);
	backdrop-filter: blur(6px);
	border-radius: ${pallette.borderRadius.xxLarge};

	@media screen and (min-width: ${pallette.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span 4;
		border: none;
	}
	@media screen and (min-width: ${pallette.screens.xl}) {
		grid-column: span 3;
	}
`;

const CalendarContainerActionButtons = styled.div`
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	display: flex;
	gap: 12px;
`;

const CalendarActionButton = styled.button`
	display: grid;
	place-items: center;
	height: 36px;
	width: 36px;
	border-radius: ${pallette.borderRadius.xxLarge};
	background-color: ${pallette.colors.brand[500]};
	color: ${pallette.colors.white};
	transition: background-color 0.2s ease-in-out;

	&:hover {
		background-color: ${pallette.colors.brand[600]};
	}
`;

const MobileShowChatButton = styled(CalendarActionButton)`
	@media screen and (min-width: ${pallette.screens.lg}) {
		display: none;
	}
`;

const MobileCloseButtonContainer = styled.div`
	width: fit-content;
	@media screen and (min-width: ${pallette.screens.lg}) {
		display: none;
	}
`;

export default PersonaCardExpanded;
