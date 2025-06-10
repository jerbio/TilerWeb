import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

interface PersonaCardProps {
	occupation: string;
	backgroundImage: string;
	gradient?: boolean;
}

const Card = styled.div<{ gradient?: boolean }>`
	width: 315px;
	height: 680px;
	background-size: cover;
	background-position: center;
	border-radius: ${styles.borderRadius.xxLarge};
	font-family: ${styles.typography.fontFamily.urban};
	color: white;
	font-size: ${styles.typography.fontSize.displayXs};
	font-weight: bold;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	position: relative;
	isolation: isolate;

	/* Dark fade effect */
	&::before {
		content: '';
		position: absolute;
		inset: 2px;
		z-index: -1;
		border-radius: calc(${styles.borderRadius.xxLarge} - 2.5px);
		background: linear-gradient(
			transparent,
			66%,
			rgba(0, 0, 0, 0.6),
			88%,
			rgba(0, 0, 0, 0.9)
		);
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
		border-radius: ${styles.borderRadius.xxLarge};
		background: ${(props) =>
			props.gradient
				? `conic-gradient(from var(--rotation) at 50% 50%, #B827FC, #2C90FC, #B8FD33, #FEC837, #FD1892,  #B827FC)`
				: styles.colors.gray[800]};
		opacity: ${(props) => (props.gradient ? 0.75 : 1)};
	}
`;

const CardImage = styled.div<{ backgroundImage: string }>`
	background-image: url(${(props) => props.backgroundImage});
	background-size: cover;
	background-position: center;
	position: absolute;
	inset: 2px;
	z-index: -2;
	border-radius: calc(${styles.borderRadius.xxLarge} - 2px);
`;

const Occupation = styled.h3`
	font-size: 1.5rem;
	font-weight: bold;
	position: absolute;
	bottom: 1.5rem;
	left: 1.5rem;
`;

const PersonaCard: React.FC<PersonaCardProps> = ({
	occupation,
	backgroundImage,
	gradient,
}) => {
	return (
		<Card gradient={gradient}>
			<CardImage backgroundImage={backgroundImage} />
			<Occupation>{occupation}</Occupation>
		</Card>
	);
};

export default PersonaCard;

