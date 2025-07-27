import styled, { keyframes } from 'styled-components';
import styles from '../../../util/styles';

// Pulse Animation
const pulse = keyframes`
	0% {
		background-color: #ffffff0d;
	}
	50% {
		background-color: ${styles.colors.black};
	}
	100% {
		background-color: #ffffff0d;
	}
`;

const Template = styled.div`
	width: 300px;
	height: 100%;
	animation: ${pulse} 2s linear infinite;
	box-shadow: 0 0 0 0.5px ${styles.colors.gray[800]} inset;
	border-radius: ${styles.borderRadius.xxLarge};
`;

export default function PersonaCardTemplate() {
	return <Template />;
}
