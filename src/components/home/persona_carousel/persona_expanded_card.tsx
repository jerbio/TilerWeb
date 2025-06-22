import React from 'react';
import styled from 'styled-components';
import styles from '../../../util/styles';
import {
	animated,
	config,
	useChain,
	useSpring,
	useSpringRef,
	useTransition,
} from '@react-spring/web';

type PersonaExpandedCardProps = {
	display: boolean;
	occupation: string;
};

const CardContainer = styled(animated.section)<{ $display: boolean }>`
	overflow: hidden;
	background: linear-gradient(to right, ${styles.colors.black}, #161616);
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
	font-family: ${styles.typography.fontFamily.urban};
	font-size: ${styles.typography.fontSize.displayXs};
	font-weight: ${styles.typography.fontWeight.semibold};
	line-height: 1.2;
`;

const CardContent = styled.div`
	flex: 1;

	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(12, 1fr);
`;

const CalendarContainer = styled(animated.div)`
	grid-column: span 12;
	overflow: hidden;
	height: 100%;
	background: ${styles.colors.gray[900]};

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
	top: 0.5rem;
	bottom: 0.5rem;
	left: -2px;
	right: -2px;
	border: 2px solid #2a2a2a;
	background: linear-gradient(to bottom, #1a1a1add, #000000dd);
	backdrop-filter: blur(6px);
	border-radius: ${styles.borderRadius.xLarge};

	@media screen and (min-width: ${styles.screens.lg}) {
		position: static;
		background: transparent;
		grid-column: span 4;
		border: none;
	}
`;

function PersonaExpandedCard({
	display,
	occupation,
}: PersonaExpandedCardProps) {
	const content = [
		{
			key: 'calendar',
			container: CalendarContainer,
			content: <p>Calendar for {occupation} will be displayed here.</p>,
		},
		{
			key: 'chat',
			container: ChatContainer,
			content: (
				<p>Chat interface for {occupation} will be displayed here.</p>
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
	const contentTransition = useTransition(display ? content : [], {
		keys: (item) => item.key,
		ref: contentTransRef,
		from: { opacity: 0 },
		enter: { opacity: 1 },
		leave: { opacity: 0 },
		trail: display ? 100 : 0,
    config: { tension: display ? 200 : 300 }
	});

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
