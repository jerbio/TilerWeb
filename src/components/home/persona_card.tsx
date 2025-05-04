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
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.5rem;
	font-weight: bold;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	position: relative;
`;

const Occupation = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: bold;
	position: absolute;
	bottom: 20px;
	left: 20px;
	background-color: rgba(0, 0, 0, 0.71);
	padding: ${styles.space.small};
	border-radius: ${styles.borderRadius.medium};
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
