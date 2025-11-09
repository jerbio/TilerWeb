import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import useAppStore from '@/global_state';
import { Env } from '@/config/config_getter';
import { Code2 } from 'lucide-react';

/**
 * Persistent badge that shows when dev mode user ID override is active
 * Only visible in development mode when an override is set
 */
const DevModeBadge: React.FC = () => {
  const devUserIdOverride = useAppStore((state) => state.devUserIdOverride);
  const isDevMode = Env.isDevToolsEnabled();

  if (!isDevMode || !devUserIdOverride) {
    return null;
  }

  return (
    <BadgeContainer>
      <Badge>
        <IconWrapper>
          <Code2 size={14} />
        </IconWrapper>
        <BadgeText>
          <BadgeLabel>DEV MODE</BadgeLabel>
          <BadgeValue>{devUserIdOverride}</BadgeValue>
        </BadgeText>
      </Badge>
    </BadgeContainer>
  );
};

const BadgeContainer = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9998;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, rgba(194, 15, 49, 0.95) 0%, rgba(139, 10, 35, 0.95) 100%);
  backdrop-filter: blur(12px);
  border: 2px solid ${palette.colors.brand[400]};
  border-radius: ${palette.borderRadius.large};
  padding: 0.5rem 0.75rem;
  box-shadow: 0 4px 12px rgba(194, 15, 49, 0.4);
  cursor: help;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(194, 15, 49, 0.5);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${palette.colors.white};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const BadgeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const BadgeLabel = styled.span`
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.bold};
  color: ${palette.colors.white};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
`;

const BadgeValue = styled.span`
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.medium};
  color: ${palette.colors.gray[200]};
  font-family: monospace;
  line-height: 1;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media screen and (max-width: ${palette.screens.sm}) {
    max-width: 120px;
  }
`;

export default DevModeBadge;
