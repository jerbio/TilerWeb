import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { animated, useTransition } from '@react-spring/web';
import palette from '@/core/theme/palette';
import Spinner from '@/core/common/components/loader';
import TimelineHeader from '@/components/timeline/timeline_header';
import useAppStore from '@/global_state';
import { CalendarWrapper } from '@/core/common/components/calendar/calendar_wrapper';
import Chat from '@/core/common/components/chat/chat';
import useIsMobile from '@/core/common/hooks/useIsMobile';

const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const authenticatedUser = useAppStore((state) => state.authenticatedUser);
  const isAuthLoading = useAppStore((state) => state.isAuthLoading);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const isDesktop = !useIsMobile(parseInt(palette.screens.lg, 10));
  const showChat = isDesktop || mobileChatVisible;
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedWidth, setExpandedWidth] = useState(0);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        setExpandedWidth(contentRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
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
          <CalendarWrapper userId={authenticatedUser.id} width={expandedWidth} />
          <CalendarContainerActionButtons>
            <MobileChatInputWrapper>
              <MessageCircleIcon>
                <MessageCircle size={18} />
              </MessageCircleIcon>
              <MobileChatInput
                onClick={() => setMobileChatVisible(!mobileChatVisible)}
                placeholder="Ask Tiler anything..."
                readOnly
              />
            </MobileChatInputWrapper>
          </CalendarContainerActionButtons>
        </React.Fragment>
      ),
    },
    {
      key: 'chat',
      container: ChatContainer,
      content: <Chat onClose={() => setMobileChatVisible(false)} />,
    },
  ];

  const contentTransition = useTransition(
    showChat ? content : content.slice(0, 1),
    {
      keys: (item) => item.key,
      from: { opacity: 0, scale: 1.05 },
      enter: { opacity: 1, scale: 1 },
      leave: { opacity: 0, scale: 1 },
      trail: 200,
      config: { tension: 200 },
    }
  );

  return (
    <Container>
      <TimelineHeader />

      <TimelineContentContainer>
        <TimelineContent ref={contentRef}>
          <CardContent>
            {contentTransition((style, item) => (
              <item.container style={style} key={item.key}>
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
	border-radius: ${palette.borderRadius.xLarge};
	background: linear-gradient(to right, ${palette.colors.black}, ${palette.colors.gray[900]});
	border: 2px solid ${palette.colors.gray[800]};
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding-top: 1.5rem;
	overflow: hidden;

	@media screen and (min-width: ${palette.screens.lg}) {
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
	z-index: 3;
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
	z-index: 2;
	bottom: 1rem;
	left: 1rem;
	right: 1rem;
	display: flex;
	gap: 12px;
	padding-left: 69px;

	@media screen and (min-width: ${palette.screens.lg}) {
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
	color: ${palette.colors.brand[500]};
	pointer-events: none;
	z-index: 1;
`;

const MobileChatInput = styled.input`
	border: 1px sold red;
	padding: 0.75rem 1rem 0.75rem 3rem;
	border-radius: ${palette.borderRadius.xxLarge};
	background-color: rgba(31, 31, 31, 0.6);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(55, 55, 55, 0.5);
	color: ${palette.colors.gray[300]};
	font-size: ${palette.typography.fontSize.sm};
	font-family: ${palette.typography.fontFamily.inter};
	cursor: pointer;
	width: 100%;
	transition: all 0.2s ease-in-out;

	&::placeholder {
		color: ${palette.colors.gray[500]};
	}

	&:hover {
		background-color: rgba(55, 55, 55, 0.7);
		border-color: ${palette.colors.brand[500]};
		backdrop-filter: blur(10px);
	}

	&:focus {
		outline: none;
		border-color: ${palette.colors.brand[500]};
		background-color: rgba(55, 55, 55, 0.7);
		backdrop-filter: blur(10px);
	}
`;


const Container = styled.div`
  min-height: 100vh;
  position: relative;
  background: linear-gradient(
    to bottom,
    ${palette.colors.black} 0%,
    ${palette.colors.black} 60%,
    ${palette.colors.brand[400]}80 100%
  );
  overflow: hidden;

  &::after {
    content: '';
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: radial-gradient(
      ellipse at center bottom,
      ${palette.colors.brand[400]}80 0%,
      ${palette.colors.brand[500]}80 50%,
      transparent 100%
    );
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
