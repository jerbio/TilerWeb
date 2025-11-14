import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import Logo from '@/core/common/components/icons/logo';
import Button from '@/core/common/components/button';
import Input from '@/core/common/components/input';
import palette from '@/core/theme/palette';
import { Env } from '@/config/config_getter';
import { authService } from '@/services';
import VerificationCodePopup from '@/components/auth/VerificationCodePopup';

const UserAuthentication: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine mode from URL path or query parameter
  const pathname = window.location.pathname;
  const queryMode = searchParams.get('mode');
  const mode = queryMode || (pathname.includes('signin') ? 'signin' : 'signup');
  const isSignUp = mode === 'signup';

  const baseUrl = Env.get('BASE_URL');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('auth.signup.emailPlaceholder'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUp(email);
      toast.success(t('auth.signup.verificationSent'));

      // Show verification popup
      setShowVerificationPopup(true);
    } catch (error) {
      toast.error(t('auth.signup.createAccountError'));
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await authService.signUp(email);
      toast.success(t('auth.verification.resendSuccess'));
    } catch (error) {
      toast.error(t('auth.verification.resendError'));
      throw error;
    }
  };

  return (
    <Container>
      <BackButton onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t('auth.goBack')}
      </BackButton>

      <Content>
        <Logo size={48} />

        <Title>{t(isSignUp ? 'auth.signup.title' : 'auth.signin.title')}</Title>
        <Subtitle>
          {t(isSignUp ? 'auth.signup.subtitle' : 'auth.signin.subtitle')}
        </Subtitle>

        <SocialLoginForm id="SocialLogin" action={`${baseUrl}/Account/ExternalLogin`} method="post">
          <input name="__RequestVerificationToken" type="hidden" value="E6PHbDLl86PTMhuBBti-2XuPdDm_WMFryLW4Jp-ZDvXCJcv7talXKZvZCipwiQSaKcgeWxMLgnTruLQT3cn55A7GcBDMRuoRzS98CzSrq481"/>
          <GoogleButton type="submit" name="provider" value="Google">
            <span>{t(isSignUp ? 'auth.signup.googleButton' : 'auth.signin.googleButton')}</span>
            <GoogleIcon>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </GoogleIcon>
          </GoogleButton>
        </SocialLoginForm>

        <Divider>
          <DividerLine />
          <DividerText>OR</DividerText>
          <DividerLine />
        </Divider>

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder={t('auth.signup.emailPlaceholder')}
            label={t('auth.signup.emailLabel')}
            sized="large"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <StyledButton variant="brand" size="large" type="submit" disabled={isLoading}>
            {isLoading
              ? t(isSignUp ? 'auth.signup.submitting' : 'auth.signin.submitting')
              : t(isSignUp ? 'auth.signup.submitButton' : 'auth.signin.submitButton')}
          </StyledButton>
        </Form>

        <FooterText>
          {isSignUp ? (
            <>
              {t('auth.signup.footer')}{' '}
              <ToggleLink onClick={() => navigate('/signin')}>
                {t('auth.signup.footerLink')}
              </ToggleLink>
            </>
          ) : (
            <>
              {t('auth.signin.footer')}{' '}
              <ToggleLink onClick={() => navigate('/signup')}>
                {t('auth.signin.footerLink')}
              </ToggleLink>
            </>
          )}
        </FooterText>
      </Content>

      <VerificationCodePopup
        isOpen={showVerificationPopup}
        email={email}
        onClose={() => setShowVerificationPopup(false)}
        onResendCode={handleResendCode}
      />
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background-color: ${palette.colors.black};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.base};
  cursor: pointer;
  align-self: flex-start;
  margin-bottom: 2rem;
  transition: color 0.2s;

  &:hover {
    color: ${palette.colors.gray[300]};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  width: 100%;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: ${palette.typography.fontSize.displaySm};
  color: ${palette.colors.white};
  font-family: ${palette.typography.fontFamily.urban};
  font-weight: ${palette.typography.fontWeight.bold};
  text-align: center;
  margin: 0;
  margin-top: 1rem;
`;

const Subtitle = styled.p`
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.base};
  text-align: center;
  margin: 0;
  max-width: 400px;
`;

const SocialLoginForm = styled.form`
  width: 100%;
`;

const GoogleButton = styled.button`
  width: 100%;
  height: 48px;
  background-color: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.little};
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.base};
  font-weight: ${palette.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;

  &:hover {
    background-color: ${palette.colors.gray[800]};
  }
`;

const GoogleIcon = styled.div`
  position: absolute;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Divider = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${palette.colors.gray[800]};
`;

const DividerText = styled.span`
  color: ${palette.colors.gray[600]};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.medium};
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StyledButton = styled(Button)`
  width: 100%;
  opacity: 0.6;
`;

const FooterText = styled.p`
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  text-align: center;
  margin-top: 0.5rem;
`;

const ToggleLink = styled.span`
  color: ${palette.colors.brand[400]};
  cursor: pointer;

  &:hover {
    color: ${palette.colors.brand[300]};
  }
`;

export default UserAuthentication;
