import React from 'react';
import styled from 'styled-components';
import styles from '../../util/styles';

interface PersonaCardProps {
	occupation: string;
	backgroundImage: string;
}

const Card = styled.div<{ backgroundImage: string }>`
	width: 315px;
	height: 680px;
	background-image: url(${(props) => props.backgroundImage});
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
  overflow: hidden;
  border: 2px solid ${styles.colors.gray[800]};

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(
			transparent,
			66%,
			rgba(0, 0, 0, 0.6),
			88%,
			rgba(0, 0, 0, 0.9)
		);
	}
`;

const Occupation = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: bold;
	position: absolute;
	bottom: 1.5rem;
	left: 1.5rem;
`;

const PersonaCard: React.FC<PersonaCardProps> = ({
	occupation,
	backgroundImage,
}) => {
	return (
		<Card backgroundImage={backgroundImage}>
			<Occupation>{occupation}</Occupation>
		</Card>
	);
};

export default PersonaCard;

