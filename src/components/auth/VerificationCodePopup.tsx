import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import Logo from '@/core/common/components/icons/logo';
import { authService } from '@/services';

interface VerificationCodePopupProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onResendCode?: () => Promise<void>;
}

const VerificationCodePopup: React.FC<VerificationCodePopupProps> = ({
  isOpen,
  email,
  onClose,
  onResendCode,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) return;

    setIsLoading(true);
    try {
      await authService.verifyCode(email, code);

      // Success: Close popup, show success message, and redirect
      toast.success(t('auth.verification.success'));
      onClose();
      navigate('/timeline');
    } catch (error) {
      // Failure: Keep popup open and show error message
      toast.error(t('auth.verification.error'));
      console.error('Verification error:', error);
      // Clear the code input so user can try again
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!onResendCode) return;

    setIsResending(true);
    try {
      await onResendCode();
    } finally {
      setIsResending(false);
    }
  };

  return ReactDOM.createPortal(
    <Overlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <LogoContainer>
          <Logo size={48} />
        </LogoContainer>

        <Header>
          <TitlePill>{t('auth.verification.title')}</TitlePill>
        </Header>

        <HeaderText>{t('auth.verification.header')}</HeaderText>

        <Description>
          {t('auth.verification.description')} <EmailText>{email}</EmailText>
        </Description>

        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder={t('auth.verification.placeholder')}
            label={t('auth.verification.label')}
            sized="large"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <Actions>
            <Button
              variant="brand"
              size="large"
              type="submit"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? t('auth.verification.verifying') : t('auth.verification.verifyButton')}
            </Button>

            {onResendCode && (
              <ResendButton
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? t('auth.verification.resending') : t('auth.verification.resendButton')}
              </ResendButton>
            )}

            <Button variant="ghost" onClick={onClose}>
              {t('auth.verification.cancel')}
            </Button>
          </Actions>
        </Form>
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

const Description = styled.p`
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  text-align: center;
  margin: 0.5rem 1.5rem 0 1.5rem;
  line-height: 1.5;
`;

const EmailText = styled.span`
  color: ${palette.colors.brand[400]};
  font-weight: ${palette.typography.fontWeight.medium};
`;

const Form = styled.form`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;

  & > button {
    width: 100%;
  }
`;

const ResendButton = styled.button`
  background: transparent;
  border: none;
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;

  &:hover {
    color: ${palette.colors.brand[400]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default VerificationCodePopup;
