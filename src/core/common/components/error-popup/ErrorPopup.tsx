import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { X } from 'lucide-react';

interface ErrorPopupProps {
  isOpen: boolean;
  message: string;
  title?: string;
  onClose: () => void;
  onRedirect?: () => void;
  redirectButtonText?: string;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  isOpen,
  message,
  title = 'Error',
  onClose,
  onRedirect,
  redirectButtonText = 'Go Back'
}) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          <Message>{message}</Message>
        </Content>

        <Actions>
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
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </Actions>
      </PopupContainer>
    </Overlay>
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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
`;

const Title = styled.h3`
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.lg};
  font-weight: ${palette.typography.fontWeight.semibold};
  margin: 0;
`;

const CloseButton = styled.button`
  color: ${palette.colors.gray[400]};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: ${palette.borderRadius.medium};
  transition: color 0.2s ease;

  &:hover {
    color: ${palette.colors.gray[200]};
    background: ${palette.colors.gray[800]};
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
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
  justify-content: flex-end;
`;

export default ErrorPopup;