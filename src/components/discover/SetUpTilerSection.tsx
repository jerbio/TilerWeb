import React, { useState, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import {
  ExpandableWrapper,
  ExpandableSection,
  ExpandableHeader,
  ExpandableTextSide,
  SectionBadge,
  SectionTitle,
  SectionSummary,
  ExpandableHeaderRight,
  Chevron,
  ExpandableBody,
  ExpandableBodyInner,
} from './shared';

// ─── Set Up Tiler Visual (header) ────────────────────────────────────────────

const SetUpVisual = styled.div`
  width: 160px;
  height: 120px;
  border-radius: ${palette.borderRadius.medium};
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.55rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    height: auto;
    padding: 1rem 1.25rem;
  }
`;

const setupPulse = css`
  @keyframes setupPulse {
    0%, 100% { box-shadow: 0 0 0 0 ${palette.colors.brand[500]}50; }
    60%       { box-shadow: 0 0 0 5px ${palette.colors.brand[500]}00; }
  }
`;

const SetupRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SetupDot = styled.div<{ $done?: boolean; $active?: boolean }>`
  ${setupPulse}
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: bold;
  background: ${({ $done, $active }) =>
    $active
      ? `${palette.colors.brand[500]}35`
      : $done
      ? `${palette.colors.brand[500]}25`
      : `${palette.colors.gray[700]}60`};
  border: 1px solid ${({ $done, $active }) =>
    $active
      ? palette.colors.brand[400]
      : $done
      ? `${palette.colors.brand[500]}55`
      : `${palette.colors.gray[600]}40`};
  color: ${({ $done, $active }) =>
    $done || $active ? palette.colors.brand[400] : palette.colors.gray[600]};
  animation: ${({ $active }) =>
    $active ? 'setupPulse 1.8s ease-in-out infinite' : 'none'};
`;

const SetupRowLabel = styled.span<{ $done?: boolean }>`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 8px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${({ $done }) => ($done ? palette.colors.gray[300] : palette.colors.gray[500])};
  line-height: 1;
`;

// ─── Google Maps-style Step List ─────────────────────────────────────────────

const StepList = styled.div`
  padding: 1.5rem 1.5rem 0.5rem;

  @media (max-width: 640px) {
    padding: 1.25rem 1rem 0.5rem;
  }
`;

const StepItem = styled.div`
  display: flex;
  gap: 1rem;
  position: relative;
`;

const StepIconColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 28px;
`;

const dotPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 ${palette.colors.brand[500]}50; }
  50%       { box-shadow: 0 0 0 6px ${palette.colors.brand[500]}00; }
`;

const StepCircle = styled.div<{ $active?: boolean; $last?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $active, $last }) =>
    $last
      ? `${palette.colors.brand[500]}20`
      : $active
      ? `${palette.colors.brand[500]}25`
      : `${palette.colors.gray[800]}`};
  border: 2px solid ${({ $active, $last }) =>
    $last
      ? palette.colors.brand[400]
      : $active
      ? `${palette.colors.brand[500]}60`
      : palette.colors.gray[600]};
  animation: ${({ $last }) => ($last ? css`${dotPulse} 2s ease-in-out infinite` : 'none')};
`;

const StepConnector = styled.div`
  flex: 1;
  width: 2px;
  background: ${palette.colors.gray[700]};
  min-height: 24px;
`;

const StepContent = styled.div<{ $last?: boolean }>`
  flex: 1;
  padding-bottom: ${({ $last }) => ($last ? '0' : '1.5rem')};

  @media (max-width: 640px) {
    padding-bottom: ${({ $last }) => ($last ? '0' : '1.25rem')};
  }
`;

const StepTitle = styled.h3`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[100]};
  margin: 0;
  line-height: 1.75;
`;

const StepDesc = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  margin: 0.25rem 0 0;
  line-height: 1.6;
`;

// ─── Step Icons (small SVG illustrations) ────────────────────────────────────

const IconSvg = styled.svg`
  width: 14px;
  height: 14px;
`;

const UserIcon = () => (
  <IconSvg viewBox="0 0 24 24" fill="none" stroke={palette.colors.brand[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <circle cx="17" cy="4" r="2.5" fill="#12B76A" stroke="#12B76A" strokeWidth="1.5" opacity="0.9">
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.6;0.85;1" dur="3s" repeatCount="indefinite" />
    </circle>
    <path d="M16 4l0.7 0.7 1.3-1.4" stroke="#fff" strokeWidth="1.5" fill="none">
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.65;0.9;1" dur="3s" repeatCount="indefinite" />
    </path>
  </IconSvg>
);

const CalendarIcon = () => (
  <IconSvg viewBox="0 0 24 24" fill="none" stroke={palette.colors.brand[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="15" r="1.5" fill={palette.colors.brand[400]} stroke="none">
      <animate attributeName="r" values="1.5;2.2;1.5" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
  </IconSvg>
);

const GearIcon = () => (
  <IconSvg viewBox="0 0 24 24" fill="none" stroke={palette.colors.brand[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'none' }}>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="8s" repeatCount="indefinite" />
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </g>
  </IconSvg>
);

const SparkleIcon = () => (
  <IconSvg viewBox="0 0 24 24" fill={palette.colors.brand[400]} stroke="none">
    <g>
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </g>
  </IconSvg>
);

// ─── Support Note ────────────────────────────────────────────────────────────

const SetupSupportNote = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  line-height: 1.75;
  margin: 0;
  margin-top: 20px;
  padding: 4px 0 8px 18px;
  border-left: 2px solid ${palette.colors.brand[500]}44;
  text-align: left;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const SetUpTilerSection: React.FC = () => {
  const { t } = useTranslation();
  const [setUpOpen, setSetUpOpen] = useState(false);

  const steps = useMemo(
    () => [
      {
        icon: <UserIcon />,
        title: t('discover.setUpTiler.cards.account.title'),
        desc: t('discover.setUpTiler.cards.account.subtext'),
      },
      {
        icon: <CalendarIcon />,
        title: t('discover.setUpTiler.cards.calendar.title'),
        desc: t('discover.setUpTiler.cards.calendar.subtext'),
      },
      {
        icon: <GearIcon />,
        title: t('discover.setUpTiler.cards.preferences.title'),
        desc: t('discover.setUpTiler.cards.preferences.subtext'),
      },
      {
        icon: <SparkleIcon />,
        title: t('discover.setUpTiler.cards.adaptive.title'),
        desc: t('discover.setUpTiler.cards.adaptive.subtext'),
      },
    ],
    [t]
  );

  return (
    <ExpandableWrapper>
      <ExpandableSection>
        <ExpandableHeader
          $open={setUpOpen}
          onClick={() => setSetUpOpen((o) => !o)}
        >
          <ExpandableTextSide>
            <SectionBadge>{t('discover.setUpTiler.badge')}</SectionBadge>
            <SectionTitle>{t('discover.setUpTiler.title')}</SectionTitle>
            <SectionSummary>{t('discover.setUpTiler.summary')}</SectionSummary>
          </ExpandableTextSide>

          <ExpandableHeaderRight>
            <SetUpVisual>
              <SetupRow>
                <SetupDot $done>✓</SetupDot>
                <SetupRowLabel $done>{t('discover.setUpTiler.visual.step1')}</SetupRowLabel>
              </SetupRow>
              <SetupRow>
                <SetupDot $done>✓</SetupDot>
                <SetupRowLabel $done>{t('discover.setUpTiler.visual.step2')}</SetupRowLabel>
              </SetupRow>
              <SetupRow>
                <SetupDot $done>✓</SetupDot>
                <SetupRowLabel $done>{t('discover.setUpTiler.visual.step3')}</SetupRowLabel>
              </SetupRow>
              <SetupRow>
                <SetupDot $active>◎</SetupDot>
                <SetupRowLabel>{t('discover.setUpTiler.visual.step4')}</SetupRowLabel>
              </SetupRow>
            </SetUpVisual>
            <Chevron $open={setUpOpen}>&#9660;</Chevron>
          </ExpandableHeaderRight>
        </ExpandableHeader>

        <ExpandableBody $open={setUpOpen}>
          <ExpandableBodyInner>
            <StepList>
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                return (
                  <StepItem key={i}>
                    <StepIconColumn>
                      <StepCircle $active={!isLast} $last={isLast}>
                        {step.icon}
                      </StepCircle>
                      {!isLast && <StepConnector />}
                    </StepIconColumn>
                    <StepContent $last={isLast}>
                      <StepTitle>{step.title}</StepTitle>
                      <StepDesc>{step.desc}</StepDesc>
                    </StepContent>
                  </StepItem>
                );
              })}
            </StepList>

            <SetupSupportNote>
              {t('discover.setUpTiler.supportNote')}
            </SetupSupportNote>
          </ExpandableBodyInner>
        </ExpandableBody>
      </ExpandableSection>
    </ExpandableWrapper>
  );
};

export default SetUpTilerSection;
