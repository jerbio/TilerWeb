import React from 'react';
import { LoaderCircle } from 'lucide-react';
import Logo from '@/core/common/components/icons/logo';
import palette from '@/core/theme/palette';
import styled from 'styled-components';
import { keyframes } from 'styled-components';

type LoaderProps = {
	message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "" }) => {
  const SIZE = 72;
  return (
		<Container>
    <LoaderContainer $size={SIZE}>
      <LoaderCircle size={SIZE} />
      <div>
        <Logo size={SIZE / 3} />
      </div>
    </LoaderContainer>
			<LoaderMessage>{message}</LoaderMessage>
    </Container>
  );
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: .5rem;
	align-items: center;
`;

const LoaderMessage = styled.div`
	color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily.urban};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.base};
`;

const spin = keyframes`
	0% {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	100% {
		transform: translate(-50%, -50%) rotate(360deg);
	}
`;

const LoaderContainer = styled.div<{ $size: number }>`
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
		color: ${palette.colors.gray[400]};
		opacity: 0.25;
		animation: ${spin} 1.5s ease-in-out infinite;
	}
`;

export default Loader;
