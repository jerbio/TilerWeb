import React, { useState } from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import {
	animated,
	useChain,
	useSpring,
	useSpringRef,
	useTransition,
} from '@react-spring/web';
import Chat from '../../shared/chat/chat';
import Button from '../../shared/button';
import { ChevronLeftIcon, Plus } from 'lucide-react';
import useIsMobile from '../../../hooks/useIsMobile';
import Calendar from '../../shared/calendar/calendar';

const CardContainer = styled(animated.section)<{ $display: boolean }>`
	overflow: hidden;
	background: linear-gradient(
		to right,
		${styles.colors.black},
		${styles.colors.gray[900]}
	);
	border-radius: ${styles.borderRadius.xxLarge};
	border: 2px solid ${styles.colors.gray[800]};
	pointer-events: ${(props) => (props.$display ? 'auto' : 'none')};
	width: 100%;
	height: 100%;
	position: relative;

	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding-top: 1.5rem;

	@media screen and (min-width: ${styles.screens.lg}) {
		padding-block: 1.5rem;
		padding-right: 2rem;
		gap: 1.5rem;
		flex-direction: column-reverse;
	}
`;

const Header = styled.header`
	padding: 0 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;

	h2 {
		line-height: 1.2;
		font-weight: ${styles.typography.fontWeight.bold};
		font-size: ${styles.typography.fontSize.xl};
		font-family: ${styles.typography.fontFamily.urban};
	}

	@media screen and (min-width: ${styles.screens.lg}) {
		h2 {
			font-size: ${styles.typography.fontSize.displayXs};
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
	background: ${styles.colors.gray[900]};
	border-top: 1px solid ${styles.colors.gray[700]};

	@media screen and (min-width: ${styles.screens.lg}) {
		grid-column: span 8;
		border: 1px solid ${styles.colors.gray[700]};
		border-left: none;
		border-radius: 0 ${styles.borderRadius.large}
			${styles.borderRadius.large} 0;
	}
`;

const ChatContainer = styled(animated.div)`
	position: absolute;
	inset: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1acc, #000000cc);
	backdrop-filter: blur(6px);
	border-radius: ${styles.borderRadius.xxLarge};

	@media screen and (min-width: ${styles.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span 4;
		border: none;
	}
`;

const CalendarContainerActionButtons = styled.div`
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	display: flex;
	gap: 12px;
`;

const MobileShowChatButton = styled.button`
	display: grid;
	place-items: center;
	height: 36px;
	width: 36px;
	border-radius: ${styles.borderRadius.xxLarge};
	background-color: ${styles.colors.brand[500]};
	color: ${styles.colors.white};

	@media screen and (min-width: ${styles.screens.lg}) {
		display: none;
	}
`;

const MobileCloseButtonContainer = styled.div`
	width: fit-content;
	@media screen and (min-width: ${styles.screens.lg}) {
		display: none;
	}
`;

type PersonaExpandedCardProps = {
	display: boolean;
	occupation: string;
	onCollapse: () => void;
	expandedWidth: number;
};

function PersonaExpandedCard({
  display,
	occupation,
	onCollapse,
  expandedWidth,
}: PersonaExpandedCardProps) {
	const [mobileChatVisible, setMobileChatVisible] = useState(false);
	const isDesktop = !useIsMobile(parseInt(styles.screens.lg, 10));
	const showChat = isDesktop || mobileChatVisible;

	const content = [
		{
			key: 'calendar',
			container: CalendarContainer,
			content: (
				<React.Fragment>
					<Calendar width={expandedWidth} />
					<CalendarContainerActionButtons>
						<MobileShowChatButton
							onClick={() =>
								setMobileChatVisible(!mobileChatVisible)
							}
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
			content: (
				<Chat
					onClose={
						!isDesktop
							? () => {
									setMobileChatVisible(false);
								}
							: onCollapse
					}
				/>
			),
		},
	];

	// Content revealing animations
	const cardSpringRef = useSpringRef();
	const cardSpring = useSpring({
		ref: cardSpringRef,
		from: { opacity: 0 },
		to: { opacity: display ? 1 : 0 },
	});

	const contentTransRef = useSpringRef();
	const contentTransition = useTransition(
		display ? (showChat ? content : content.slice(0, 1)) : [],
		{
			keys: (item) => item.key,
			ref: contentTransRef,
			from: { opacity: 0, scale: 1.05 },
			enter: { opacity: 1, scale: 1 },
			leave: { opacity: 0, scale: 1 },
			trail: display ? 200 : 0,
			config: { tension: display ? 200 : 300 },
		}
	);

	useChain(
		display
			? [cardSpringRef, contentTransRef]
			: [contentTransRef, cardSpringRef],
		display ? [0, 0.75] : [0, 1],
		300
	);

	return (
		<CardContainer $display={display} style={cardSpring}>
			<Header>
				<h2>{occupation}</h2>
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
}

export default PersonaExpandedCard;

