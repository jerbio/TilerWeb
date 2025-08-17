import React from 'react';
import styled, { keyframes } from 'styled-components';
import palette from '../../../core/theme/palette';

// Pulse Animation
const pulse = keyframes`
	0% {
		background-color: #ffffff0d;
	}
	50% {
		background-color: ${palette.colors.black};
	}
	100% {
		background-color: #ffffff0d;
	}
`;

const Template = styled.div`
	width: 300px;
	height: 100%;
	animation: ${pulse} 2s linear infinite;
	box-shadow: 0 0 0 0.5px ${palette.colors.gray[800]} inset;
	border-radius: ${palette.borderRadius.xxLarge};
`;

const PersonaCardTemplate: React.FC = () => {
	return <Template />;
}

export default PersonaCardTemplate;
