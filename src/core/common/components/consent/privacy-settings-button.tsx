import React from 'react';
import styled from 'styled-components';
import { Shield, ChevronRight } from 'lucide-react';
import palette from '@/core/theme/palette';
import { useConsent } from './consent-provider';

const SettingsCard = styled.button`
  width: 100%;
  background: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.large};
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    border-color: ${palette.colors.brand[500]};
    background: ${palette.colors.gray[800]};
  }
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${palette.borderRadius.medium};
  background: ${palette.colors.brand[500]}20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    color: ${palette.colors.brand[400]};
  }
`;

const Content = styled.div`
  flex: 1;
  text-align: left;

  h3 {
    font-size: ${palette.typography.fontSize.lg};
    font-weight: ${palette.typography.fontWeight.semibold};
    color: ${palette.colors.white};
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: ${palette.typography.fontSize.sm};
    color: ${palette.colors.gray[400]};
    margin: 0;
  }
`;

const Arrow = styled(ChevronRight)`
  color: ${palette.colors.gray[500]};
  flex-shrink: 0;
`;

const PrivacySettingsButton: React.FC = () => {
  const { openSettings } = useConsent();

  return (
    <SettingsCard onClick={openSettings}>
      <IconContainer>
        <Shield size={24} />
      </IconContainer>
      <Content>
        <h3>Privacy & Cookies</h3>
        <p>Manage your privacy settings and cookie preferences</p>
      </Content>
      <Arrow size={20} />
    </SettingsCard>
  );
};

export default PrivacySettingsButton;
