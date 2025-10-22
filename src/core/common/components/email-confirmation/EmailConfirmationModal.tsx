import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import Logo from '@/core/common/components/icons/logo';
import { Mail } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  email,
  onClose,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <LogoContainer>
          <Logo size={48} />
        </LogoContainer>

        <IconContainer>
          <Mail size={64} color={palette.colors.brand[500]} />
        </IconContainer>

        <Header>Check your email!</Header>

        <Message>
          We sent a confirmation link to <strong>{email}</strong>.
          <br /><br />
          Click the link to unlock unlimited chats with Tiler.
        </Message>

        <Actions>
          <Button
            variant="primary"
            onClick={onClose}
          >
            Got it
          </Button>
        </Actions>

        <FooterNote>
          Didn&apos;t receive the email? Check your spam folder or try again.
        </FooterNote>
      </ModalContainer>
    </Overlay>,
    document.body
  );
};

// Styled components
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
  z-index: 10001; /* Higher than ErrorPopup (10000) */
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.large};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  max-width: 450px;
  width: 90%;
  padding: 2rem 1.5rem;
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
  margin-bottom: 1.5rem;
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const Header = styled.h2`
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.xl};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-align: center;
  margin: 0 0 1rem 0;
`;

const Message = styled.p`
  color: ${palette.colors.gray[300]};
  font-size: ${palette.typography.fontSize.base};
  line-height: 1.6;
  text-align: center;
  margin: 0 0 1.5rem 0;

  strong {
    color: ${palette.colors.white};
    font-weight: ${palette.typography.fontWeight.semibold};
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;

  button {
    min-width: 120px;
  }
`;

const FooterNote = styled.p`
  color: ${palette.colors.gray[500]};
  font-size: ${palette.typography.fontSize.sm};
  text-align: center;
  margin: 0;
`;

export default EmailConfirmationModal;
