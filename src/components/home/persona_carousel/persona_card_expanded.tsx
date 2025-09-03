import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import PersonaCalendar from './persona_calendar';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { Persona } from '@/core/common/types/persona';
import Chat from '@/core/common/components/chat/chat';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import { PersonaSchedule, PersonaScheduleSetter } from '@/core/common/hooks/usePersonaSchedules';
import { personaService } from '@/services';
import useAppStore from '@/global_state';
import PersonaLimitWarning from './persona_card_limit_modal';

type PersonaExpandedCardProps = {
  persona: Persona;
  expanded: boolean;
  onCollapse: () => void;
  expandedWidth: number;
  personaSchedules: PersonaSchedule;
  setPersonaSchedule: PersonaScheduleSetter;
};

const PersonaCardExpanded: React.FC<PersonaExpandedCardProps> = ({
  expanded,
  persona,
  onCollapse,
  expandedWidth,
  personaSchedules,
  setPersonaSchedule,
}) => {
  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const isDesktop = !useIsMobile(parseInt(palette.screens.lg, 10));
  const showChat = isDesktop || mobileChatVisible;
  const scheduleId = personaSchedules[persona.id]?.scheduleId || null;
  const userInfo = personaSchedules[persona.id]?.userInfo || null;

	const setAnonymousUser = useAppStore((state) => state.setAnonymousUser);
	const setGlobalScheduleId = useAppStore((state) => state.setGlobalScheduleId);
	const globalAonymousUser = useAppStore((state) => state.anonymousUser);
	const globalScheduleId = useAppStore((state) => state.scheduleId);
	const calendarRefreshTrigger = useAppStore((state) => state.calendarRefreshTrigger);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  function onMobileCollapse() {
    setMobileChatVisible(false);
  }

  async function getPersonaSchedule() {
    try {
      const personaSchedule = await personaService.getPersonaSchedule(persona);
      setPersonaSchedule(persona.id, personaSchedule.scheduleId, personaSchedule.anonymousUser
	// 	, {
    //     store: !isCustom,
    //   }
	);
	  setAnonymousUser({
		...personaSchedule.anonymousUser,
		id: personaSchedule.anonymousUser.id ?? '',
		username: personaSchedule.anonymousUser.username ?? '',
		timeZoneDifference: personaSchedule.anonymousUser.timeZoneDifference ?? 0,
		timeZone: personaSchedule.anonymousUser.timeZone ?? '',
		email: personaSchedule.anonymousUser.email ?? '',
		endfOfDay: personaSchedule.anonymousUser.endfOfDay ?? '',
		phoneNumber: personaSchedule.anonymousUser.phoneNumber ?? '',
		fullName: personaSchedule.anonymousUser.fullName ?? '',
		firstName: personaSchedule.anonymousUser.firstName ?? '',
		lastName: personaSchedule.anonymousUser.lastName ?? '',
		countryCode: personaSchedule.anonymousUser.countryCode ?? '',
	  });
    //   setPersonaSchedule(persona.id, personaSchedule.scheduleId);
    } catch (error) {
      console.error("Couldn't create profile for persona: ", error);
    }
  }

  useEffect(() => {
    if (expanded && !scheduleId) {
      getPersonaSchedule();
    }
  }, [expanded]);

  useEffect(() => {
		if (calendarRefreshTrigger > 0 && scheduleId && globalScheduleId !== scheduleId) {
			// Update local schedule ID when global state changes (from chat actions)
			if (!userInfo || userInfo.id && globalScheduleId?.includes(userInfo.id) ) {
				setGlobalScheduleId(globalScheduleId);
				setPersonaSchedule(persona.id, globalScheduleId, userInfo, 
					// { store: !isCustom }

				);
			}
			// const personaCpy = JSON.parse(JSON.stringify(persona));
			// personaCpy.scheduleId= globalScheduleId;
			
		}
		if(userInfo && userInfo!=globalAonymousUser) {
			// Update anonymous user info when it changes
			setAnonymousUser(userInfo);
		}
	}, [calendarRefreshTrigger, globalScheduleId, scheduleId, userInfo]);

  const content = [
    {
      key: 'calendar',
      container: CalendarContainer,
      content: (
        <React.Fragment>
          <PersonaCalendar expandedWidth={expandedWidth} scheduleId={scheduleId} userInfo={userInfo} />
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
      <CardLimitWarningContainer
        $visible={showLimitWarning}
        onClick={() => {
          setShowLimitWarning(false);
          onCollapse();
        }}
      >
        <PersonaLimitWarning open={showLimitWarning} />
      </CardLimitWarningContainer>
    </CardContainer>
  );
};

const CardLimitWarningContainer = styled.div<{ $visible: boolean }>`
	position: absolute;
	inset: 0;
	opacity: ${(props) => (props.$visible ? 1 : 0)};
	pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
	z-index: 10;
	background: rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(4px);
	display: flex;
	justify-content: center;
	align-items: center;

	transition: opacity 0.3s ease-in-out;
`;

const CardContainer = styled(animated.section) <{ $display: boolean }>`
	overflow: hidden;
	background: linear-gradient(to right, ${palette.colors.black}, ${palette.colors.gray[900]});
	border-radius: ${palette.borderRadius.xxLarge};
	border: 2px solid ${palette.colors.gray[800]};
	pointer-events: ${(props) => (props.$display ? 'auto' : 'none')};
	width: 100%;
	height: 100%;
	position: relative;

	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding-top: 1.5rem;

	@media screen and (min-width: ${palette.screens.lg}) {
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
		font-weight: ${palette.typography.fontWeight.bold};
		font-size: ${palette.typography.fontSize.xl};
		font-family: ${palette.typography.fontFamily.urban};
	}

	@media screen and (min-width: ${palette.screens.lg}) {
		h2 {
			font-size: ${palette.typography.fontSize.displayXs};
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
	background: ${palette.colors.gray[900]};
	border-top: 1px solid ${palette.colors.gray[700]};

	@media screen and (min-width: ${palette.screens.lg}) {
		grid-column: span 8;
		border: 1px solid ${palette.colors.gray[700]};
		border-left: none;
		border-radius: 0 ${palette.borderRadius.large} ${palette.borderRadius.large} 0;
	}
	@media screen and (min-width: ${palette.screens.xl}) {
		grid-column: span 9;
	}
`;

const ChatContainer = styled(animated.div)`
	position: absolute;
	inset: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1acc, #000000cc);
	backdrop-filter: blur(6px);
	border-radius: ${palette.borderRadius.xxLarge};

	@media screen and (min-width: ${palette.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span 4;
		border: none;
	}
	@media screen and (min-width: ${palette.screens.xl}) {
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
	border-radius: ${palette.borderRadius.xxLarge};
	background-color: ${palette.colors.brand[500]};
	color: ${palette.colors.white};
	transition: background-color 0.2s ease-in-out;

	&:hover {
		background-color: ${palette.colors.brand[600]};
	}
`;

const MobileShowChatButton = styled(CalendarActionButton)`
	@media screen and (min-width: ${palette.screens.lg}) {
		display: none;
	}
`;

const MobileCloseButtonContainer = styled.div`
	width: fit-content;
	@media screen and (min-width: ${palette.screens.lg}) {
		display: none;
	}
`;

export default PersonaCardExpanded;
