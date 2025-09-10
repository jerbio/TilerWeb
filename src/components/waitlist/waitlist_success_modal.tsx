import Logo from '@/core/common/components/icons/logo';
import socials from '@/core/common/data/socials.ts';
import palette from '@/core/theme/palette';
import React from 'react';
import styled from 'styled-components';

const WaitlistSuccessModal: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <StyledWaitlistSuccessModal $open={open} onClick={(e) => e.stopPropagation()}>
      <LogoContainer>
        <Logo size={36} />
      </LogoContainer>
      <ContentContainer>
        <Header>Welcome to Tiler Chat</Header>
        <Description>
          You’re officially on the waitlist! Stay tuned for early access and exclusive
          updates.
        </Description>
      </ContentContainer>
      <Divider />
      <ContentContainer>
        <SmallHeader>
          Stay <span>Connected</span> With Us<span>.</span>
        </SmallHeader>
        <Description>
          Never miss an update, join our community and stay connected.
        </Description>
        <SocialButtons>
          {socials.map((social) => (
            <a
              key={social.i18Name}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={social.button} height={32} />
            </a>
          ))}
        </SocialButtons>
      </ContentContainer>
    </StyledWaitlistSuccessModal>
  );
};

const SocialButtons = styled.div`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 0.5rem;

	@media (max-width: ${palette.screens.md}) {
		max-width: 230px;
	}
`;

const Description = styled.p`
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
	span {
		color: ${palette.colors.brand[400]};
	}
`;

const SmallHeader = styled(Header)`
	font-size: 20px;
`;

const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
`;

const Divider = styled.hr`
	border: none;
	border-top: 1px solid ${palette.colors.gray[800]};
	margin: 0;
	width: 100%;
`;

const LogoContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 64px;
`;

const StyledWaitlistSuccessModal = styled.div<{ $open: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	width: 100%;
	max-width: 650px;
	background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
	border: 2px solid ${palette.colors.border};
	padding: 1.5rem 1rem;
	border-radius: ${palette.borderRadius.xLarge};
	transform: ${(props) => (props.$open ? 'scale(1)' : 'scale(0.95)')};
	transition: transform 0.3s ease-in-out;
`;

export default WaitlistSuccessModal;
