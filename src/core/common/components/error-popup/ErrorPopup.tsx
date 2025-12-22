import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { ArrowRight } from 'lucide-react';
import Logo from '@/core/common/components/icons/logo';
import FetchingChatInterface from '@/assets/fetching_chat_interface.svg';
import { emailListService } from '@/services';
import { useTranslation } from 'react-i18next';
import { validateEmail } from '@/core/util/validation';

interface ErrorPopupProps {
  isOpen: boolean;
  message: string;
  title?: string;
  onClose: () => void;
  onRedirect?: () => void;
  redirectButtonText?: string;
  showWaitlistButton?: boolean;
  onEmailSubmitted?: (email: string) => void;
  tilerUserId: string;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  isOpen,
  message,
  title = 'Error',
  onClose,
  onRedirect,
  redirectButtonText = 'Go Back',
  showWaitlistButton = false,
  onEmailSubmitted,
  tilerUserId,
}) => {
  // Runtime guard: this popup requires a tilerUserId to function correctly
  if (!tilerUserId) {
    // Throwing early makes the missing-prop failure obvious during development/runtime
    throw new Error('ErrorPopup requires a tilerUserId prop');
  }

  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async () => {
    if (!email.trim()) {
      setEmailError(t('home.expanded.chat.errorPopup.errors.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t('home.expanded.chat.errorPopup.errors.emailInvalid'));
      return;
    }

    setIsSubmitting(true);
    setEmailError('');

    try {
      const response = await emailListService.submitEmail(
        email.trim(),
        'chatLimitReached',
        // pass the optional tiler user id through to the API
        tilerUserId
      );

      // Check response structure based on API
      if (response?.Error?.Code === "0") {
        // Success - call parent callback
        onEmailSubmitted?.(email);
      } else {
        setEmailError(response?.Error?.Message || t('home.expanded.chat.errorPopup.errors.submitFailed'));
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setEmailError(t('home.expanded.chat.errorPopup.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <HeaderText>{t('home.expanded.chat.errorPopup.headerText')}</HeaderText>

        <IllustrationContainer>
          <img src={FetchingChatInterface} alt={t('home.expanded.chat.errorPopup.altText')} />
        </IllustrationContainer>

        {/* OLAMIDE TODO: Remove this conditional when pop up fleshed out to use the message response from the backend */}
        {!showWaitlistButton && <Content>
          <Message>{message}</Message>
        </Content>}

        <Actions>
          {showWaitlistButton && onEmailSubmitted && (
            <>
              <WaitlistDescription>
                {t('home.expanded.chat.errorPopup.description')}
              </WaitlistDescription>

              {/* Email Input */}
              <EmailInputContainer>
                <EmailInputField
                  type="email"
                  placeholder={t('home.expanded.chat.errorPopup.emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  disabled={isSubmitting}
                  $hasError={!!emailError}
                />
                {emailError && <EmailError>{emailError}</EmailError>}
              </EmailInputContainer>

              <Button
                variant={palette.colors.brand[500]}
                onClick={handleWaitlistSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('home.expanded.chat.errorPopup.submitting') : (email.trim() ? t('home.expanded.chat.errorPopup.submitEmail') : t('home.expanded.chat.errorPopup.joinWaitlist'))}
                {!isSubmitting && <ArrowRight size={16} />}
              </Button>
              <WaitlistSubtext>{t('home.expanded.chat.errorPopup.subtext')}</WaitlistSubtext>
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
              {t('home.expanded.chat.errorPopup.close')}
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

const EmailInputContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmailInputField = styled.input<{ $hasError: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${palette.colors.gray[800]};
  border: 1px solid ${props => props.$hasError ? palette.colors.error[500] : palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.base};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? palette.colors.error[500] : palette.colors.brand[500]};
  }

  &::placeholder {
    color: ${palette.colors.gray[500]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmailError = styled.span`
  color: ${palette.colors.error[500]};
  font-size: ${palette.typography.fontSize.sm};
  margin-top: -0.25rem;
`;

export default ErrorPopup;