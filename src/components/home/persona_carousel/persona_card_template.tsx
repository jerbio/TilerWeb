import React from 'react';
import styled, { keyframes } from 'styled-components';
import pallette from '../../../core/theme/pallete';

// Pulse Animation
const pulse = keyframes`
	0% {
		background-color: #ffffff0d;
	}
	50% {
		background-color: ${pallette.colors.black};
	}
	100% {
		background-color: #ffffff0d;
	}
`;

const Template = styled.div`
	width: 300px;
	height: 100%;
	animation: ${pulse} 2s linear infinite;
	box-shadow: 0 0 0 0.5px ${pallette.colors.gray[800]} inset;
	border-radius: ${pallette.borderRadius.xxLarge};
`;

const PersonaCardTemplate: React.FC = () => {
	return <Template />;
}

export default PersonaCardTemplate;
