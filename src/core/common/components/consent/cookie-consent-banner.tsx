import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Cookie, Settings, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { consentManager } from '@/core/common/components/consent/consent-manager';

const BannerContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  transform: translateY(${({ $visible }) => ($visible ? '0' : '100%')});
  transition: transform 0.3s ease-in-out;
`;

const BannerContent = styled.div`
  background: ${palette.colors.gray[900]};
  border-top: 1px solid ${palette.colors.gray[700]};
  padding: 1.5rem;
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  @media (min-width: ${palette.screens.lg}) {
    padding: 2rem;
  }
`;

const BannerInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: ${palette.screens.lg}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
`;

const BannerText = styled.div`
  flex: 1;
  display: flex;
  align-items: start;
  gap: 1rem;

  .icon {
    flex-shrink: 0;
    color: ${palette.colors.brand[400]};
    margin-top: 2px;
  }
`;

const TextContent = styled.div`
  h3 {
    font-size: ${palette.typography.fontSize.lg};
    font-weight: ${palette.typography.fontWeight.bold};
    color: ${palette.colors.white};
    margin: 0 0 0.5rem 0;
    font-family: ${palette.typography.fontFamily.urban};
  }

  p {
    font-size: ${palette.typography.fontSize.sm};
    color: ${palette.colors.gray[400]};
    line-height: 1.5;
    margin: 0;

    a {
      color: ${palette.colors.brand[400]};
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const BannerActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: ${palette.screens.md}) {
    flex-direction: row;
    align-items: center;
  }
`;

const ActionButton = styled(Button)`
  white-space: nowrap;
  min-width: 120px;
  justify-content: center;
`;

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.medium};
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: ${palette.colors.white};
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${palette.colors.gray[500]};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${palette.colors.white};
  }

  @media (min-width: ${palette.screens.lg}) {
    display: none;
  }
`;

type CookieConsentBannerProps = {
  onOpenSettings?: () => void;
};

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenSettings }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner if user hasn't made a consent decision
    const hasConsent = consentManager.hasConsent();
    if (!hasConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    consentManager.acceptAll();
    setVisible(false);
  };

  const handleRejectAll = () => {
    consentManager.rejectAll();
    setVisible(false);
  };

  const handleCustomize = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
    setVisible(false);
  };

  const handleClose = () => {
    // Treat close as reject all
    handleRejectAll();
  };

  if (!visible) return null;

  return (
    <BannerContainer $visible={visible}>
      <BannerContent>
        <CloseButton onClick={handleClose} aria-label={t('common.consent.banner.close')}>
          <X size={20} />
        </CloseButton>
        <BannerInner>
          <BannerText>
            <Cookie className="icon" size={24} />
            <TextContent>
              <h3>{t('common.consent.banner.title')}</h3>
              <p>
                {t('common.consent.banner.description')}{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  {t('common.consent.banner.learnMore')}
                </a>
              </p>
            </TextContent>
          </BannerText>
          <BannerActions>
            <ActionButton variant="primary" onClick={handleAcceptAll}>
              {t('common.consent.banner.buttons.acceptAll')}
            </ActionButton>
            <ActionButton variant="outline" onClick={handleRejectAll}>
              {t('common.consent.banner.buttons.rejectAll')}
            </ActionButton>
            <SettingsButton onClick={handleCustomize}>
              <Settings size={16} />
              {t('common.consent.banner.buttons.customize')}
            </SettingsButton>
          </BannerActions>
        </BannerInner>
      </BannerContent>
    </BannerContainer>
  );
};

export default CookieConsentBanner;
