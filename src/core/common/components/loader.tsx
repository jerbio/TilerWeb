import React from 'react';
import { LoaderCircle } from 'lucide-react';
import Logo from '@/core/common/components/icons/logo';
import pallette from '@/core/theme/pallete';
import styled from 'styled-components';
import { keyframes } from 'styled-components';
const spin = keyframes`
	0% {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	100% {
		transform: translate(-50%, -50%) rotate(360deg);
	}
`;

const SpinnerContainer = styled.div<{ $size: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	position: relative;

	> div,
	> svg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	> svg {
		color: ${pallette.colors.gray[400]};
		opacity: 0.25;
		animation: ${spin} 1.5s ease-in-out infinite;
	}
`;

export const Spinner : React.FC = () => {
	const SIZE = 72;
	return (
		<SpinnerContainer $size={SIZE}>
			<LoaderCircle size={SIZE} />
			<div>
				<Logo size={SIZE / 3} />
			</div>
		</SpinnerContainer>
	);
};

export default Spinner;
