import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import useAppStore from '@/global_state';
import { usePersonaSessionManager } from '@/core/common/hooks/usePersonaSessionManager';
import { X } from 'lucide-react';

type DevUserIdOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

const DevUserIdOverlay: React.FC<DevUserIdOverlayProps> = ({ isVisible, onClose }) => {
  const getActivePersonaSession = useAppStore((state) => state.getActivePersonaSession);
  const activePersonaSession = getActivePersonaSession();
  const devUserIdOverride = useAppStore((state) => state.devUserIdOverride);
  
  // Use PersonaSessionManager for centralized session management
  const { applyDevOverride, clearDevOverride } = usePersonaSessionManager();

  const [inputUserId, setInputUserId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    if (devUserIdOverride) {
      setInputUserId(devUserIdOverride);
    }
  }, [devUserIdOverride]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleApply = () => {
    const trimmedUserId = inputUserId.trim();
    
    if (!trimmedUserId) {
      setFeedback({ type: 'error', message: 'User ID cannot be empty' });
      return;
    }

    // Use PersonaSessionManager to apply dev override
    // This automatically updates both global state and active session
    applyDevOverride(trimmedUserId);
    
    setFeedback({ type: 'success', message: `Custom User ID set: ${trimmedUserId}` });
  };

  const handleReset = () => {
    // Use PersonaSessionManager to clear dev override
    // This automatically reverts to stored userId
    clearDevOverride();
    setInputUserId('');
    setFeedback({ type: 'success', message: 'Custom User ID cleared. Using default behavior.' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <Backdrop onClick={onClose}>
      <OverlayCard onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderTitle>
            <DevBadge>DEV</DevBadge>
            User ID Override
          </HeaderTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <WarningBanner>
          ⚠️ Development Mode Only - This tool overrides the normal persona user creation flow
        </WarningBanner>

        <Section>
          <SectionTitle>Current Active Session</SectionTitle>
          {activePersonaSession ? (
            <InfoGrid>
              <InfoItem>
                <Label>Persona:</Label>
                <Value>{activePersonaSession.personaName}</Value>
              </InfoItem>
              <InfoItem>
                <Label>User ID:</Label>
                <Value $highlight>{activePersonaSession.userId || 'Not set'}</Value>
              </InfoItem>
              <InfoItem>
                <Label>Schedule ID:</Label>
                <Value>{activePersonaSession.scheduleId || 'Not set'}</Value>
              </InfoItem>
              <InfoItem>
                <Label>Chat Session:</Label>
                <Value>{activePersonaSession.chatSessionId || 'Not set'}</Value>
              </InfoItem>
            </InfoGrid>
          ) : (
            <EmptyState>No active persona session</EmptyState>
          )}
        </Section>

        <Section>
          <SectionTitle>Override User ID</SectionTitle>
          <Description>
            Enter a custom User ID to test specific user requests. When set, all persona creations
            will use this ID instead of creating a new anonymous user.
          </Description>

          <InputGroup>
            <Input
              type="text"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter User ID (e.g., TilerUser@@12345)"
              autoFocus
            />
          </InputGroup>

          {devUserIdOverride && (
            <CurrentOverride>
              <OverrideLabel>Current Override:</OverrideLabel>
              <OverrideValue>{devUserIdOverride}</OverrideValue>
            </CurrentOverride>
          )}

          {feedback && (
            <Feedback $type={feedback.type}>
              {feedback.message}
            </Feedback>
          )}

          <ButtonGroup>
            <Button onClick={handleApply} $primary>
              Apply Override
            </Button>
            <Button onClick={handleReset} disabled={!devUserIdOverride}>
              Reset to Default
            </Button>
          </ButtonGroup>
        </Section>

        <Footer>
          Keyboard shortcuts: <Kbd>Enter</Kbd> to apply, <Kbd>Esc</Kbd> to close,{' '}
          <Kbd>Ctrl+Shift+U+F12</Kbd> to toggle
        </Footer>
      </OverlayCard>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
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

const OverlayCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 2px solid ${palette.colors.brand[500]};
  border-radius: ${palette.borderRadius.large};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(194, 15, 49, 0.3);
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid ${palette.colors.gray[800]};
`;

const HeaderTitle = styled.h2`
  font-size: ${palette.typography.fontSize.xl};
  font-weight: ${palette.typography.fontWeight.bold};
  color: ${palette.colors.white};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const DevBadge = styled.span`
  background: ${palette.colors.brand[500]};
  color: ${palette.colors.white};
  padding: 0.25rem 0.5rem;
  border-radius: ${palette.borderRadius.small};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.bold};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${palette.colors.gray[400]};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${palette.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${palette.colors.gray[800]};
    color: ${palette.colors.white};
  }
`;

const WarningBanner = styled.div`
  background: rgba(194, 15, 49, 0.1);
  border-left: 4px solid ${palette.colors.brand[500]};
  padding: 1rem;
  margin: 1rem 1.5rem;
  border-radius: ${palette.borderRadius.small};
  color: ${palette.colors.brand[300]};
  font-size: ${palette.typography.fontSize.sm};
`;

const Section = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${palette.colors.gray[800]};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${palette.typography.fontSize.lg};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.white};
  margin: 0 0 1rem 0;
`;

const Description = styled.p`
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[400]};
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.span`
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.span<{ $highlight?: boolean }>`
  font-size: ${palette.typography.fontSize.sm};
  color: ${(props) => (props.$highlight ? palette.colors.brand[400] : palette.colors.white)};
  font-family: monospace;
  background: ${palette.colors.gray[900]};
  padding: 0.5rem;
  border-radius: ${palette.borderRadius.small};
  word-break: break-all;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${palette.colors.gray[500]};
  font-style: italic;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: ${palette.colors.gray[900]};
  border: 2px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.sm};
  font-family: monospace;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${palette.colors.brand[500]};
  }

  &::placeholder {
    color: ${palette.colors.gray[600]};
  }
`;

const CurrentOverride = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(194, 15, 49, 0.1);
  border-radius: ${palette.borderRadius.small};
  margin-bottom: 1rem;
`;

const OverrideLabel = styled.span`
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[400]};
`;

const OverrideValue = styled.span`
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.brand[400]};
  font-family: monospace;
  font-weight: ${palette.typography.fontWeight.semibold};
`;

const Feedback = styled.div<{ $type: 'success' | 'error' }>`
  padding: 0.75rem;
  border-radius: ${palette.borderRadius.small};
  margin-bottom: 1rem;
  font-size: ${palette.typography.fontSize.sm};
  background: ${(props) =>
    props.$type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${(props) => (props.$type === 'success' ? '#22c55e' : '#ef4444')};
  border-left: 4px solid
    ${(props) => (props.$type === 'success' ? '#22c55e' : '#ef4444')};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: ${palette.borderRadius.medium};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  background: ${(props) =>
    props.$primary ? palette.colors.brand[500] : palette.colors.gray[800]};
  color: ${palette.colors.white};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$primary ? palette.colors.brand[600] : palette.colors.gray[700]};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  background: ${palette.colors.gray[900]};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[500]};
  text-align: center;
  border-radius: 0 0 ${palette.borderRadius.large} ${palette.borderRadius.large};
`;

const Kbd = styled.kbd`
  background: ${palette.colors.gray[800]};
  padding: 0.125rem 0.375rem;
  border-radius: ${palette.borderRadius.small};
  font-family: monospace;
  color: ${palette.colors.white};
  border: 1px solid ${palette.colors.gray[700]};
  font-size: ${palette.typography.fontSize.xs};
`;

export default DevUserIdOverlay;
