import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Check, Info } from 'lucide-react';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import { consentManager, ConsentPreferences } from './consent-manager';

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 10001;
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.large};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${palette.colors.gray[800]};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: ${palette.typography.fontSize.displayXs};
    font-weight: ${palette.typography.fontWeight.bold};
    color: ${palette.colors.white};
    margin: 0;
    font-family: ${palette.typography.fontFamily.urban};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${palette.colors.gray[400]};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${palette.colors.white};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Description = styled.p`
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[400]};
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
`;

const ConsentSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConsentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ConsentTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h3 {
    font-size: ${palette.typography.fontSize.base};
    font-weight: ${palette.typography.fontWeight.semibold};
    color: ${palette.colors.white};
    margin: 0;
  }

  span {
    font-size: ${palette.typography.fontSize.xs};
    color: ${palette.colors.gray[500]};
    background: ${palette.colors.gray[800]};
    padding: 0.125rem 0.5rem;
    border-radius: ${palette.borderRadius.medium};
  }
`;

const ConsentDescription = styled.p`
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  line-height: 1.5;
  margin: 0;
`;

const Toggle = styled.button<{ $checked: boolean; $disabled?: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${({ $checked, $disabled }) =>
    $disabled
      ? palette.colors.gray[700]
      : $checked
        ? palette.colors.brand[500]
        : palette.colors.gray[700]};
  border: none;
  border-radius: 12px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${({ $checked, $disabled }) =>
      $disabled
        ? palette.colors.gray[700]
        : $checked
          ? palette.colors.brand[600]
          : palette.colors.gray[600]};
  }

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $checked }) => ($checked ? '22px' : '2px')};
    width: 20px;
    height: 20px;
    background-color: ${palette.colors.white};
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const InfoBox = styled.div`
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;

  .icon {
    color: ${palette.colors.brand[400]};
    flex-shrink: 0;
  }

  p {
    font-size: ${palette.typography.fontSize.xs};
    color: ${palette.colors.gray[400]};
    line-height: 1.5;
    margin: 0;
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${palette.colors.gray[800]};
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const FooterButton = styled(Button)`
  min-width: 100px;
`;

type PrivacySettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Load current preferences when modal opens
    if (isOpen) {
      const current = consentManager.getPreferences();
      if (current) {
        setPreferences(current);
      }
    }
  }, [isOpen]);

  const handleToggle = (key: keyof ConsentPreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    consentManager.savePreferences(preferences);
    onClose();
  };

  const handleAcceptAll = () => {
    consentManager.acceptAll();
    onClose();
  };

  const handleRejectAll = () => {
    consentManager.rejectAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay $visible={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Privacy Settings</h2>
          <CloseButton onClick={onClose} aria-label="Close">
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Description>
            We use different types of cookies to optimize your experience on our website. Click on
            the categories below to learn more and customize your preferences.
          </Description>

          <ConsentSection>
            <ConsentHeader>
              <ConsentTitle>
                <h3>Necessary</h3>
                <span>Always Active</span>
              </ConsentTitle>
              <Toggle $checked={true} $disabled={true} disabled aria-label="Necessary cookies" />
            </ConsentHeader>
            <ConsentDescription>
              These cookies are essential for the website to function properly. They enable basic
              features like page navigation and access to secure areas.
            </ConsentDescription>
          </ConsentSection>

          <ConsentSection>
            <ConsentHeader>
              <ConsentTitle>
                <h3>Analytics</h3>
              </ConsentTitle>
              <Toggle
                $checked={preferences.analytics}
                onClick={() => handleToggle('analytics')}
                aria-label="Analytics cookies"
              />
            </ConsentHeader>
            <ConsentDescription>
              Analytics cookies help us understand how visitors interact with our website by
              collecting and reporting information anonymously. This helps us improve our service.
            </ConsentDescription>
          </ConsentSection>

          <ConsentSection>
            <ConsentHeader>
              <ConsentTitle>
                <h3>Marketing</h3>
              </ConsentTitle>
              <Toggle
                $checked={preferences.marketing}
                onClick={() => handleToggle('marketing')}
                aria-label="Marketing cookies"
              />
            </ConsentHeader>
            <ConsentDescription>
              Marketing cookies are used to track visitors across websites. The intention is to
              display ads that are relevant and engaging for individual users.
            </ConsentDescription>
          </ConsentSection>

          <ConsentSection>
            <ConsentHeader>
              <ConsentTitle>
                <h3>Preferences</h3>
              </ConsentTitle>
              <Toggle
                $checked={preferences.preferences}
                onClick={() => handleToggle('preferences')}
                aria-label="Preference cookies"
              />
            </ConsentHeader>
            <ConsentDescription>
              Preference cookies enable a website to remember information that changes the way the
              website behaves or looks, like your preferred language or region.
            </ConsentDescription>
          </ConsentSection>

          <InfoBox>
            <Info className="icon" size={20} />
            <p>
              You can change your preferences at any time. Your choices will be saved for future
              visits. For more information, please read our privacy policy.
            </p>
          </InfoBox>
        </ModalBody>

        <ModalFooter>
          <FooterButton variant="ghost" onClick={handleRejectAll}>
            Reject All
          </FooterButton>
          <FooterButton variant="outline" onClick={handleAcceptAll}>
            Accept All
          </FooterButton>
          <FooterButton variant="primary" onClick={handleSave}>
            <Check size={16} />
            Save Settings
          </FooterButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default PrivacySettingsModal;
