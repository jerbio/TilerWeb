import React, { useEffect, useState, useRef, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { animated, useTransition } from '@react-spring/web';
import TimelineHeader from '@/components/timeline/timeline_header';
import useAppStore from '@/global_state';
import { CalendarWrapper } from '@/core/common/components/calendar/calendar_wrapper';
import { CalendarRequestProvider } from '@/core/common/components/calendar/CalendarRequestProvider';
import Chat from '@/core/common/components/chat/chat';
import { SidePanel, useSidePanelStack } from '@/core/common/components/side-panel';
import { useEditTilePanelSync } from '@/core/common/components/side-panel/useEditTilePanelSync';
import { useEditNotesPanelSync } from '@/core/common/components/side-panel/useEditNotesPanelSync';
import EditCalendarEventLoader from '@/core/common/components/side-panel/edit-calendar-event/EditCalendarEventLoader';
import EditNotes from '@/core/common/components/side-panel/edit-notes/EditNotes';
import useIsMobile from '@/core/common/hooks/useIsMobile';
import { useTranslation } from 'react-i18next';
import {
	CalendarUIProvider,
	useCalendarUI,
} from '@/core/common/components/calendar/calendar-ui.provider';
import appLayoutConfig from '@/core/constants/app_layout_config';

const Timeline: React.FC = () => {
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);

	if (!authenticatedUser) {
		return null; // Will redirect to signin
	}

	return (
		<Container>
			<CalendarUIProvider>
				<TimelineInner userId={authenticatedUser.id} />
			</CalendarUIProvider>
		</Container>
	);
};

const TimelineInner: React.FC<{ userId: string }> = ({ userId }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [mobileChatVisible, setMobileChatVisible] = useState(false);
	const isDesktop = !useIsMobile(parseInt(theme.screens.lg, 10));
	const showChat = isDesktop || mobileChatVisible;
	const contentRef = useRef<HTMLDivElement>(null);
	const [expandedWidth, setExpandedWidth] = useState(0);
	const [sidePanelExpanded, setSidePanelExpanded] = useState(false);
	const {
		stack: panelStack,
		push: pushPanel,
		pop: popPanel,
	} = useSidePanelStack([{ content: <Chat onClose={() => setMobileChatVisible(false)} /> }]);

	// React to editTile store changes and push/pop edit panel
	const editTileIsOpen = useCalendarUI((s) => s.editTile.state.isOpen);
	const editTileEvent = useCalendarUI((s) => s.editTile.state.event);
	const closeEditTile = useCalendarUI((s) => s.editTile.actions.close);

	// React to editNotes store changes and push/pop notes panel
	const editNotesIsOpen = useCalendarUI((s) => s.editNotes.state.isOpen);
	const editNotesEvent = useCalendarUI((s) => s.editNotes.state.event);
	const closeEditNotes = useCalendarUI((s) => s.editNotes.actions.close);

	const { closePanelAndStore } = useEditTilePanelSync({
		editTileIsOpen,
		editTileEvent,
		pushPanel: () =>
			pushPanel({
				content: (
					<EditCalendarEventLoader
						event={editTileEvent!}
						onClose={() => closePanelAndStore()}
					/>
				),
			}),
		popPanel,
		closeEditTile,
		setSidePanelExpanded,
		setMobileChatVisible,
	});

	const { closePanelAndStore: closeNotesPanelAndStore } = useEditNotesPanelSync({
		editNotesIsOpen,
		editNotesEvent,
		pushPanel: () =>
			pushPanel({
				content: (
					<EditNotes event={editNotesEvent!} onClose={() => closeNotesPanelAndStore()} />
				),
			}),
		popPanel,
		closeEditNotes,
		setSidePanelExpanded,
		setMobileChatVisible,
	});

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

	const content = [
		{
			key: 'calendar',
			container: CalendarContainer,
			content: (
				<React.Fragment>
					<CalendarWrapper
						chatExpanded={sidePanelExpanded}
						userId={userId}
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
						<SidePanelExpandToggle
							title={
								sidePanelExpanded
									? t('timeline.expandPanel')
									: t('timeline.collapsePanel')
							}
							onClick={() => setSidePanelExpanded(!sidePanelExpanded)}
						>
							{sidePanelExpanded ? <ChevronLeft /> : <ChevronRight />}
						</SidePanelExpandToggle>
					)}
				</React.Fragment>
			),
		},
		{
			key: 'side-panel',
			container: SidePanelContainer,
			content: <SidePanel stack={panelStack} />,
		},
	];
	const visibleContent = useMemo(() => (showChat ? content : [content[0]]), [showChat, content]);

	const contentTransition = useTransition(visibleContent, {
		keys: (item) => item.key,
		from: { opacity: 0, scale: 1.05 },
		enter: { opacity: 1, scale: 1 },
		leave: { opacity: 0, scale: 1 },
		trail: 200,
		config: { tension: 200 },
	});

	return (
		<>
			<CalendarRequestProvider>
				<TimelineHeader />

				<TimelineContentContainer>
					<TimelineContent ref={contentRef}>
						<CardContent>
							{contentTransition((style, item) => (
								<item.container
									style={style}
									key={item.key}
									$sidepanelexpanded={sidePanelExpanded}
								>
									{item.content}
								</item.container>
							))}
						</CardContent>
					</TimelineContent>
				</TimelineContentContainer>
			</CalendarRequestProvider>
		</>
	);
};

const TimelineContent = styled.main`
	width: 100%;
	height: 100%;
	border-radius: ${(props) => props.theme.borderRadius.xLarge};
	background: ${(props) =>
		`linear-gradient(to right, ${props.theme.colors.plain}, ${props.theme.colors.background.card})`};
	border: 2px solid ${(props) => props.theme.colors.border.default};
	display: flex;
	flex-direction: column;
	gap: 1rem;
	overflow: hidden;
	z-index: 1;

	@media screen and (min-width: ${(props) => props.theme.screens.lg}) {
		padding-block: 1.5rem;
		padding-right: 2rem;
		gap: 1.5rem;
	}
`;

const TimelineContentContainer = styled.div`
	z-index: 1;
	display: flex;
	height: calc(100% - ${appLayoutConfig.SUBNAV_HEIGHT}px);
	width: 100vw;
	padding: 1rem;
`;

const CardContent = styled.div`
	flex: 1;
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(12, 1fr);
	height: calc(100% - 3rem);
`;

const CalendarContainer = styled(animated.div)<{ $sidepanelexpanded: boolean }>`
	position: relative;
	grid-column: span 12;
	height: 100%;
	background: ${(props) => props.theme.colors.calendar.bg};

	@media screen and (min-width: ${(props) => props.theme.screens.lg}) {
		grid-column: span ${(props) => (props.$sidepanelexpanded ? 12 : 8)};
		border: 1px solid ${(props) => props.theme.colors.calendar.border};
		border-left: none;
		border-radius: 0 ${(props) => props.theme.borderRadius.large}
			${(props) => props.theme.borderRadius.large} 0;
	}
	@media screen and (min-width: ${(props) => props.theme.screens.xl}) {
		grid-column: span ${(props) => (props.$sidepanelexpanded ? 12 : 9)};
	}
`;

const SidePanelContainer = styled(animated.div)<{ $sidepanelexpanded: boolean }>`
	position: absolute;
	z-index: 3;
	inset: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1acc, #000000cc);
	backdrop-filter: blur(6px);
	display: ${(props) => (props.$sidepanelexpanded ? 'none' : 'block')};
	overflow: hidden;

	@media screen and (min-width: ${(props) => props.theme.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span ${(props) => (props.$sidepanelexpanded ? 0 : 4)};
		border: none;
		min-height: 0;
	}
	@media screen and (min-width: ${(props) => props.theme.screens.xl}) {
		grid-column: span ${(props) => (props.$sidepanelexpanded ? 0 : 3)};
	}
`;

const SidePanelExpandToggle = styled.button`
	position: absolute;
	top: 75%;
	right: 0;
	transform: translateY(-50%) translateX(50%);
	width: 40px;
	height: 40px;
	background: ${(props) => props.theme.colors.background.card};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	border-radius: ${(props) => props.theme.borderRadius.large};
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: ${(props) => props.theme.colors.text.secondary};
	transition: all 0.2s ease;
	z-index: 1000;
	outline: none;

	&:hover {
		background: ${(props) => props.theme.colors.background.card2};
		color: ${(props) => props.theme.colors.text.primary};
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

	@media screen and (min-width: ${(props) => props.theme.screens.lg}) {
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
	color: ${(props) => props.theme.colors.brand[500]};
	pointer-events: none;
	z-index: 1;
`;

const MobileChatInput = styled.input`
	border: 1px sold red;
	padding: 0.75rem 1rem 0.75rem 3rem;
	border-radius: ${(props) => props.theme.borderRadius.xxLarge};
	background-color: rgba(31, 31, 31, 0.6);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(55, 55, 55, 0.5);
	color: ${(props) => props.theme.colors.gray[300]};
	font-size: ${(props) => props.theme.typography.fontSize.sm};
	font-family: ${(props) => props.theme.typography.fontFamily.inter};
	cursor: pointer;
	width: 100%;
	transition: all 0.2s ease-in-out;

	&::placeholder {
		color: ${(props) => props.theme.colors.gray[500]};
	}

	&:hover {
		background-color: rgba(55, 55, 55, 0.7);
		border-color: ${(props) => props.theme.colors.brand[500]};
		backdrop-filter: blur(10px);
	}

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.brand[500]};
		background-color: rgba(55, 55, 55, 0.7);
		backdrop-filter: blur(10px);
	}
`;

const Container = styled.div`
	position: relative;
	height: 100%;
	background: ${(props) => `linear-gradient(
		to bottom,
		${props.theme.colors.background.page} 0%,
		${props.theme.colors.background.page} 60%,
		${props.theme.colors.brand[400]}80 100%
	)`};
	overflow: hidden;
	isolation: isolate;

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: ${(props) => `radial-gradient(
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

export default Timeline;
