import Button from '@/core/common/components/button';
import ArrowRight from '@/core/common/components/icons/arrow_right';
import Logo from '@/core/common/components/icons/logo';
import palette from '@/core/theme/palette';
import React from 'react';
import styled from 'styled-components';
import CHAT_ILLUSTRATION from '@/assets/persona/chat-illustration.svg';

const PersonaLimitWarning: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <PersonaLimitContainer $open={open}>
      <LogoContainer>
        <Logo size={36} />
      </LogoContainer>
      <HeaderContainer>
        <HeaderChip>Chat limit Reached</HeaderChip>
        <Header>Want more than 20 prompts?</Header>
      </HeaderContainer>
      <img src={CHAT_ILLUSTRATION} height={180} width={200} />
      <LimitDescription>
        Get early access to unlimited chats, smart integrations, and the full Tiler
        experience.
      </LimitDescription>
      <ButtonContainer>
        <Button variant="brand">
          <span>Join the waitlist</span>
          <ArrowRight />
        </Button>
        <span>Spots are limited - Save yours now.</span>
      </ButtonContainer>
    </PersonaLimitContainer>
  );
};

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	max-width: 355px;

	& > span {
		font-size: ${palette.typography.fontSize.xxs};
		color: ${palette.colors.gray[500]};
		text-align: center;
	}
`;

const LimitDescription = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[500]};
	text-align: center;
	max-width: 355px;
`;

const Header = styled.h2`
	font-size: 24px;
	color: ${palette.colors.gray[100]};
	font-weight: ${palette.typography.fontWeight.bold};
	font-family: ${palette.typography.fontFamily.urban};
	line-height: 1.2;
`;

const HeaderChip = styled.div`
	display: inline-block;
	background-color: ${palette.colors.brand[900]};
	color: ${palette.colors.brand[100]};
	font-size: 10px;
	line-height: 24px;
	padding-inline: 16px;
	border-radius: ${palette.borderRadius.large};
	font-weight: ${palette.typography.fontWeight.medium};
`;

const HeaderContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	text-align: center;
`;

const LogoContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 64px;
`;

const PersonaLimitContainer = styled.div<{ $open: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	width: 100%;
	max-width: 650px;
	background: linear-gradient(180deg, #1a1a1a80 0%, #00000080 100%);
	border: 2px solid ${palette.colors.border};
	padding: 1.5rem 1rem;
	border-radius: ${palette.borderRadius.xLarge};
	transform: ${(props) => (props.$open ? 'scale(1)' : 'scale(0.95)')};
	transition: transform 0.3s ease-in-out;
`;

export default PersonaLimitWarning;
