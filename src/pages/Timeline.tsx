import React, { useEffect, useState, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { animated, useTransition } from '@react-spring/web';
import Spinner from '@/core/common/components/loader';
import TimelineHeader from '@/components/timeline/timeline_header';
import useAppStore from '@/global_state';
import { CalendarWrapper } from '@/core/common/components/calendar/calendar_wrapper';
import Chat from '@/core/common/components/chat/chat';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import { useTranslation } from 'react-i18next';

const Timeline: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
	const theme = useTheme();
  const authenticatedUser = useAppStore((state) => state.authenticatedUser);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const isDesktop = !useIsMobile(parseInt(theme.screens.lg, 10));
  const showChat = isDesktop || mobileChatVisible;
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedWidth, setExpandedWidth] = useState(0);
  const [chatExpanded, setChatExpanded] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const resizeTimelineWidth = () => {
      if (contentRef.current) {
        setExpandedWidth(contentRef.current.offsetWidth);
      }
    };

    resizeTimelineWidth();
    window.addEventListener('resize', resizeTimelineWidth);
    return () => window.removeEventListener('resize', resizeTimelineWidth);
  }, []);

  if (isAuthLoading) {
    return (
      <Container>
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Container>
    );
  }

  if (!authenticatedUser || !isAuthenticated) {
    return null; // Will redirect to signin
  }

  const content = [
    {
      key: 'calendar',
      container: CalendarContainer,
      content: (
        <React.Fragment>
          <CalendarWrapper
            chatExpanded={chatExpanded}
            userId={authenticatedUser.id}
            width={expandedWidth}
          />
          <CalendarContainerActionButtons>
            <MobileChatInputWrapper>
              <MessageCircleIcon>
                <MessageCircle size={18} />
              </MessageCircleIcon>
              <MobileChatInput
                onClick={() => setMobileChatVisible(!mobileChatVisible)}
                placeholder={t('calendar.mobileChatInput.placeholder')}
                readOnly
              />
            </MobileChatInputWrapper>
          </CalendarContainerActionButtons>
          {isDesktop && (
            <ChatExpandToggle
              title={chatExpanded ? 'Collapse chat' : 'Expand chat'}
              onClick={() => setChatExpanded(!chatExpanded)}
            >
              {chatExpanded ? <ChevronLeft /> : <ChevronRight />}
            </ChatExpandToggle>
          )}
        </React.Fragment>
      ),
    },
    {
      key: 'chat',
      container: ChatContainer,
      content: <Chat onClose={() => setMobileChatVisible(false)} />,
    },
  ];

  const contentTransition = useTransition(showChat ? content : content.slice(0, 1), {
    keys: (item) => item.key,
    from: { opacity: 0, scale: 1.05 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 1 },
    trail: 200,
    config: { tension: 200 },
  });

  return (
    <Container>
      <TimelineHeader />

      <TimelineContentContainer>
        <TimelineContent ref={contentRef}>
          <CardContent>
            {contentTransition((style, item) => (
              <item.container
                style={style}
                key={item.key}
                $chatexpanded={chatExpanded}
              >
                {item.content}
              </item.container>
            ))}
          </CardContent>
        </TimelineContent>
      </TimelineContentContainer>
    </Container>
  );
};

const TimelineContent = styled.main`
	position: absolute;
	inset: 1.5rem;
	border-radius: ${props => props.theme.borderRadius.xLarge};
	background: ${props => `linear-gradient(to right, ${props.theme.colors.plain}, ${props.theme.colors.background.card})`}
;
	border: 2px solid ${props => props.theme.colors.border.default};
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding-top: 1.5rem;
	overflow: hidden;

	@media screen and (min-width: ${props => props.theme.screens.lg}) {
		padding-block: 1.5rem;
		padding-right: 2rem;
		gap: 1.5rem;
	}
`;

const TimelineContentContainer = styled.div`
	z-index: 1;
	position: fixed;
	width: 100vw;
	height: calc(100vh - 64px);
	top: 64px;
`;

const CardContent = styled.div`
	flex: 1;
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(12, 1fr);
	height: calc(100% - 3rem);
`;

const CalendarContainer = styled(animated.div) <{ $chatexpanded: boolean }>`
	position: relative;
	grid-column: span 12;
	height: 100%;
	background: ${props => props.theme.colors.gray[900]};
	border-top: 1px solid ${props => props.theme.colors.gray[700]};

	@media screen and (min-width: ${props => props.theme.screens.lg}) {
		grid-column: span ${(props) => (props.$chatexpanded ? 12 : 8)};
		border: 1px solid ${props => props.theme.colors.gray[700]};
		border-left: none;
		border-radius: 0 ${props => props.theme.borderRadius.large} ${props => props.theme.borderRadius.large} 0;
	}
	@media screen and (min-width: ${props => props.theme.screens.xl}) {
		grid-column: span ${(props) => (props.$chatexpanded ? 12 : 9)};
	}
`;

const ChatContainer = styled(animated.div) <{ $chatexpanded: boolean }>`
	position: absolute;
	z-index: 3;
	inset: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1acc, #000000cc);
	backdrop-filter: blur(6px);
	border-radius: ${props => props.theme.borderRadius.xxLarge};
	display: ${(props) => (props.$chatexpanded ? 'none' : 'block')};

	@media screen and (min-width: ${props => props.theme.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span ${(props) => (props.$chatexpanded ? 0 : 4)};
		border: none;
	}
	@media screen and (min-width: ${props => props.theme.screens.xl}) {
		grid-column: span ${(props) => (props.$chatexpanded ? 0 : 3)};
	}
`;

const ChatExpandToggle = styled.button`
	position: absolute;
	top: 75%;
	right: 0;
	transform: translateY(-50%) translateX(50%);
	width: 40px;
	height: 40px;
	background: ${props => props.theme.colors.gray[900]};
	border: 1px solid ${props => props.theme.colors.gray[800]};
	border-radius: ${props => props.theme.borderRadius.large};
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: ${props => props.theme.colors.gray[300]};
	transition: all 0.2s ease;
	z-index: 1000;
	outline: none;

	&:hover {
		background: ${props => props.theme.colors.gray[800]};
		color: white;
	}
`;

const CalendarContainerActionButtons = styled.div`
	position: absolute;
	z-index: 2;
	bottom: 1rem;
	left: 1rem;
	right: 1rem;
	display: flex;
	gap: 12px;
	padding-left: 69px;

	@media screen and (min-width: ${props => props.theme.screens.lg}) {
		display: none;
	}
`;

const MobileChatInputWrapper = styled.div`
	position: relative;
	width: 100%;
	display: flex;
	align-items: center;
`;

const MessageCircleIcon = styled.div`
	position: absolute;
	left: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.brand[500]};
	pointer-events: none;
	z-index: 1;
`;

const MobileChatInput = styled.input`
	border: 1px sold red;
	padding: 0.75rem 1rem 0.75rem 3rem;
	border-radius: ${props => props.theme.borderRadius.xxLarge};
	background-color: rgba(31, 31, 31, 0.6);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(55, 55, 55, 0.5);
	color: ${props => props.theme.colors.gray[300]};
	font-size: ${props => props.theme.typography.fontSize.sm};
	font-family: ${props => props.theme.typography.fontFamily.inter};
	cursor: pointer;
	width: 100%;
	transition: all 0.2s ease-in-out;

	&::placeholder {
		color: ${props => props.theme.colors.gray[500]};
	}

	&:hover {
		background-color: rgba(55, 55, 55, 0.7);
		border-color: ${props => props.theme.colors.brand[500]};
		backdrop-filter: blur(10px);
	}

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.brand[500]};
		background-color: rgba(55, 55, 55, 0.7);
		backdrop-filter: blur(10px);
	}
`;

const Container = styled.div`
	min-height: 100vh;
	position: relative;
	background: ${props => `linear-gradient(
		to bottom,
		${props.theme.colors.background.page} 0%,
		${props.theme.colors.background.page} 60%,
		${props.theme.colors.brand[400]}80 100%
	)`};
	overflow: hidden;

	&::after {
		content: '';
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: ${props => `radial-gradient(
			ellipse at center bottom,
			${props.theme.colors.brand[400]}80 0%,
			${props.theme.colors.brand[500]}80 50%,
			transparent 100%
		)`};
		filter: blur(80px);
		opacity: 0.6;
		pointer-events: none;
		z-index: 0;
	}
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
`;

export default Timeline;
