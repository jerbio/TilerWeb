import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { animated, useChain, useSpring, useSpringRef, useTransition } from '@react-spring/web';
import PersonaCalendar from './persona_calendar';
import { ChevronLeftIcon, Plus, Check } from 'lucide-react';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { Persona } from '@/core/common/types/persona';
import Chat from '@/core/common/components/chat/chat';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import { PersonaUsers, PersonaUserSetter } from '@/core/common/hooks/usePersonaUsers';
import { personaService } from '@/services';
import useAppStore from '@/global_state';
import analytics from '@/core/util/analytics';
import { useTranslation } from 'react-i18next';
import Spinner from '@/core/common/components/loader';

type PersonaExpandedCardProps = {
  persona: Persona;
  expanded: boolean;
  onCollapse: () => void;
  expandedWidth: number;
  personaUsers: PersonaUsers;
  setPersonaUser: PersonaUserSetter;
	onClick?: React.MouseEventHandler<HTMLDivElement>;
};

const PersonaCardExpanded: React.FC<PersonaExpandedCardProps> = ({
  expanded,
  persona,
  onCollapse,
  expandedWidth,
  personaUsers,
  setPersonaUser,
	onClick,
}) => {
  const { t } = useTranslation();
  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const isDesktop = !useIsMobile(parseInt(palette.screens.lg, 10));
  const showChat = isDesktop || mobileChatVisible;
  const personaUserId = personaUsers[persona.id]?.userId || null;
  const activePersonaSession = useAppStore((state) => state.activePersonaSession);
  const setActivePersonaSession = useAppStore((state) => state.setActivePersonaSession);
  const [isCreatingPersona, setIsCreatingPersona] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Backend processing steps
  const PROCESSING_STEPS = [
    {
      title: t('common.customPersonaModal.processing.creatingUser'),
      description: t('common.customPersonaModal.processing.creatingUserDesc'),
    },
    {
      title: t('common.customPersonaModal.processing.generatingProfile'),
      description: t('common.customPersonaModal.processing.generatingProfileDesc'),
    },
    {
      title: t('common.customPersonaModal.processing.generatingTiles'),
      description: t('common.customPersonaModal.processing.generatingTilesDesc'),
    },
    {
      title: t('common.customPersonaModal.processing.optimizing'),
      description: t('common.customPersonaModal.processing.optimizingDesc'),
    },
  ];

  function handleClose(fullCollapse: boolean = false) {
    if (fullCollapse) {
      // Track full collapse
      analytics.trackPersonaEvent('Persona Card Collapsed', {
        personaId: persona.id,
        personaName: persona.name,
      });

      // Full collapse: clear the active persona session and close the card
      setActivePersonaSession(null);
      setMobileChatVisible(false);
      onCollapse();
    } else {
      // Mobile chat close: only hide the chat overlay, keep persona session active
      analytics.trackPersonaEvent('Mobile Chat Closed', {
        personaId: persona.id,
      });
      setMobileChatVisible(false);
    }
  }

  async function getPersonaUser() {
    setIsCreatingPersona(true);
    setProcessingStep(0);
    
    // Simulate progressive steps with intervals
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000); // Progress every 2 seconds
    
    try {
      const personaUser = await personaService.createAnonymousUser(persona);
      const newUserId = personaUser.anonymousUser.id;
      
      if (!newUserId) {
        console.error("Failed to create user for persona: userId is null");
        clearInterval(stepInterval);
        setIsCreatingPersona(false);
        setProcessingStep(0);
        return;
      }
      
      setPersonaUser(persona.id, {
				userId: newUserId,
				personaInfo: { name: persona.name },
			});
      
      // Create a new persona session with all related data grouped together
      setActivePersonaSession({
        personaId: persona.id,
        personaName: persona.name,
        userId: newUserId,
        scheduleId: null,
        chatSessionId: '',
        chatContext: [],
        userInfo: {
          id: newUserId,
          username: personaUser.anonymousUser.username || '',
          timeZoneDifference: personaUser.anonymousUser.timeZoneDifference || 0,
          timeZone: personaUser.anonymousUser.timeZone || 'UTC',
          email: personaUser.anonymousUser.email,
          endfOfDay: personaUser.anonymousUser.endfOfDay || '',
          phoneNumber: personaUser.anonymousUser.phoneNumber,
          fullName: personaUser.anonymousUser.fullName || '',
          firstName: personaUser.anonymousUser.firstName || '',
          lastName: personaUser.anonymousUser.lastName || '',
          countryCode: personaUser.anonymousUser.countryCode || '1',
        },
        scheduleLastUpdatedBy: null,
      });
      
      clearInterval(stepInterval);
      
      // Show all steps as complete (all checkmarks)
      setProcessingStep(PROCESSING_STEPS.length);
      
      // Wait 1 second to show all checkmarks before hiding
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsCreatingPersona(false);
      setProcessingStep(0);
    } catch (error) {
      clearInterval(stepInterval);
      console.error("Couldn't create profile for persona: ", error);
      setIsCreatingPersona(false);
      setProcessingStep(0);
    }
  }

  async function loadExistingPersonaSession(userId: string) {
    // Load or create persona session for existing user
    setActivePersonaSession({
      personaId: persona.id,
      personaName: persona.name,
      userId: userId,
      scheduleId: activePersonaSession?.scheduleId || null,
      chatSessionId: activePersonaSession?.chatSessionId || '',
      chatContext: activePersonaSession?.chatContext || [],
      userInfo: activePersonaSession?.userInfo || null,
      scheduleLastUpdatedBy: activePersonaSession?.scheduleLastUpdatedBy || null,
    });
  }

  useEffect(() => {
    if (expanded) {
      // Track persona card expansion
      analytics.trackPersonaEvent('Persona Card Expanded', {
        personaId: persona.id,
        personaName: persona.name,
        hasExistingUser: !!personaUserId,
      });

      if (!personaUserId) {
        // Only create a new user if one doesn't exist
        // For custom persona, the user is already created via createPersonaWithAudio
        getPersonaUser();
      } else {
        // Check if we need to switch persona sessions
        if (!activePersonaSession || activePersonaSession.personaId !== persona.id) {
          loadExistingPersonaSession(personaUserId);
        }
      }
    }
  }, [expanded, persona.id]);

  const content = [
    {
      key: 'calendar',
      container: CalendarContainer,
      content: (
        <React.Fragment>
          <PersonaCalendar expandedWidth={expandedWidth} userId={personaUserId} />
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
      content: <Chat onClose={() => handleClose(isDesktop)} />,
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
    <CardContainer $display={expanded} style={cardSpring} onClick={onClick}>
      <Header>
        <h2>{persona.name}</h2>
        <MobileCloseButtonContainer>
          <Button variant="ghost" height={32} onClick={() => handleClose(true)}>
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
      
      {/* Loading overlay for persona creation */}
      <LoadingOverlay $visible={isCreatingPersona}>
        <LoadingContent>
          <Spinner />
          <LoadingMessage>
            <LoadingTitle>{t('common.customPersonaModal.processing.title')}</LoadingTitle>
            <LoadingDescription>
              {t('common.customPersonaModal.processing.description')}
            </LoadingDescription>
          </LoadingMessage>
          <ProgressSteps>
            {PROCESSING_STEPS.map((step, index) => {
              const isActive = processingStep === index;
              const isComplete = processingStep > index;
              return (
                <ProgressStep key={index} $isActive={isActive} $isComplete={isComplete}>
                  <StepIndicator $isActive={isActive} $isComplete={isComplete}>
                    {isComplete ? <Check size={14} /> : index + 1}
                  </StepIndicator>
                  <StepText $isActive={isActive} $isComplete={isComplete}>
                    {step.title}
                  </StepText>
                </ProgressStep>
              );
            })}
          </ProgressSteps>
        </LoadingContent>
      </LoadingOverlay>
    </CardContainer>
  );
};

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
	height: calc(100% - 12rem);
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

const LoadingOverlay = styled.div<{ $visible: boolean }>`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 1.5rem;
	background-color: rgba(0, 0, 0, 0.85);
	backdrop-filter: blur(8px);
	border-radius: ${palette.borderRadius.xxLarge};
	z-index: 1000;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
	transition: opacity 0.3s ease-in-out;
`;

const LoadingContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	max-width: 400px;
	padding: 0 2rem;
`;

const LoadingMessage = styled.div`
	text-align: center;
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.inter};
`;

const LoadingTitle = styled.h3`
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.semibold};
	margin: 0 0 0.5rem 0;
	color: ${palette.colors.white};
`;

const LoadingDescription = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	margin: 0;
	line-height: 1.5;
`;

const ProgressSteps = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	margin-top: 0.5rem;
`;

const ProgressStep = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 0.75rem;
	background: ${({ $isActive, $isComplete }) =>
		$isComplete
			? palette.colors.brand[900] + '40'
			: $isActive
				? palette.colors.gray[800]
				: 'transparent'};
	border-radius: ${palette.borderRadius.medium};
	transition: all 0.3s ease;
`;

const StepIndicator = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.bold};
	flex-shrink: 0;
	
	${({ $isComplete, $isActive }) =>
		$isComplete
			? `
		background: ${palette.colors.brand[500]};
		color: ${palette.colors.white};
	`
			: $isActive
				? `
		background: ${palette.colors.gray[700]};
		color: ${palette.colors.gray[300]};
		border: 2px solid ${palette.colors.brand[500]};
	`
				: `
		background: ${palette.colors.gray[800]};
		color: ${palette.colors.gray[600]};
		border: 2px solid ${palette.colors.gray[700]};
	`}
`;

const StepText = styled.span<{ $isActive: boolean; $isComplete: boolean }>`
	font-size: ${palette.typography.fontSize.sm};
	color: ${({ $isComplete, $isActive }) =>
		$isComplete || $isActive ? palette.colors.gray[200] : palette.colors.gray[500]};
	font-weight: ${({ $isActive }) =>
		$isActive ? palette.typography.fontWeight.medium : palette.typography.fontWeight.normal};
	transition: all 0.3s ease;
`;

export default PersonaCardExpanded;
