import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { ArrowRight } from 'lucide-react';
import Logo from '@/core/common/components/icons/logo';
import FetchingChatInterface from '@/assets/fetching_chat_interface.svg';

interface ErrorPopupProps {
  isOpen: boolean;
  message: string;
  title?: string;
  onClose: () => void;
  onRedirect?: () => void;
  redirectButtonText?: string;
  showWaitlistButton?: boolean;
  onWaitlistClick?: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  isOpen,
  message,
  title = 'Error',
  onClose,
  onRedirect,
  redirectButtonText = 'Go Back',
  showWaitlistButton = false,
  onWaitlistClick
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <Overlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <LogoContainer>
          <Logo size={48} />
        </LogoContainer>

        <Header>
          <TitlePill>{title}</TitlePill>
        </Header>

        <HeaderText>Want more than 20 prompts?</HeaderText>

        <IllustrationContainer>
          <img src={FetchingChatInterface} alt="Chat interface illustration" />
        </IllustrationContainer>

        {/* OLAMIDE TODO: Remove this conditional when pop up fleshed out to use the message response from the backend */}
        {!showWaitlistButton && <Content>
          <Message>{message}</Message>
        </Content>}

        <Actions>
          {showWaitlistButton && onWaitlistClick && (
            <>
              <WaitlistDescription>
                Get early access to unlimited chats, smart integrations, and the full Tiler experience.
              </WaitlistDescription>
              <Button
                variant={palette.colors.brand[500]}
                onClick={onWaitlistClick}
              >
                Join The Waitlist
                <ArrowRight size={16} />
              </Button>
              <WaitlistSubtext>Spots are limited – Save yours now.</WaitlistSubtext>
            </>
          )}
          {onRedirect && (
            <Button
              variant="primary"
              onClick={() => {
                onRedirect();
                onClose();
              }}
            >
              {redirectButtonText}
            </Button>
          )}
          {!showWaitlistButton && (
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </Actions>
      </PopupContainer>
    </Overlay>,
    document.body
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PopupContainer = styled.div`
  background: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.large};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1.5rem 1rem 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem 0 1.5rem;
`;

const TitlePill = styled.div`
  background-color: rgba(194, 15, 49, 0.2);
  color: rgba(255, 255, 255, 0.9);
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.medium};
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(194, 15, 49, 0.2);
  display: inline-flex;
  align-items: center;
  margin: 0;
`;

const HeaderText = styled.h2`
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.xl};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-align: center;
  margin: 1rem 1.5rem 0 1.5rem;
  padding: 0;
`;

const IllustrationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 1.5rem;

  img {
    max-width: 200px;
    width: 100%;
    height: auto;
    object-fit: contain;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Message = styled.p`
  color: ${palette.colors.gray[300]};
  font-size: ${palette.typography.fontSize.base};
  line-height: 1.6;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
  justify-content: flex-end;

  & > button {
    width: 100%;
  }
`;

const WaitlistDescription = styled.p`
  color: ${palette.colors.gray[300]};
  font-size: ${palette.typography.fontSize.base};
  text-align: center;
  margin: 0;
  line-height: 1.5;
`;

const WaitlistSubtext = styled.p`
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  text-align: center;
  margin: 0;
  margin-top: -0.25rem;
`;

export default ErrorPopup;