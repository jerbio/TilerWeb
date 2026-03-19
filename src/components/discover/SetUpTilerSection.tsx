import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
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

// ─── Set Up Tiler Card Grid ─────────────────────────────────────────────────

const SetupGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.25rem 0 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SetupCard = styled.div`
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.xLarge};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s, transform 0.3s;

  &:hover {
    border-color: ${palette.colors.brand[500]}40;
    transform: translateY(-3px);
  }
`;

const SetupAnim = styled.div`
  height: 170px;
  background: ${palette.colors.gray[900]};
  border-bottom: 1px solid ${palette.colors.gray[700]};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SetupBody = styled.div`
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SetupCardStepBadge = styled.div`
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 9999px;
  background: ${palette.colors.brand[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.bold};
  flex-shrink: 0;
`;

const SetupCardTitle = styled.h3`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xl};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[100]};
  margin: 0;
  line-height: 1.25;
`;

const SetupCardSubtext = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  line-height: 1.5;
  margin: 0;
`;

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

// ─── Card 1: Sign-up form (JS-animated) ─────────────────────────────────────

const SaSignupScene = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 78%;
`;

const SaSignupInput = styled.div`
  padding: 9px 12px;
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[400]};
`;

const SaSignupBtn = styled.div<{ $phase: 'idle' | 'creating' | 'done' }>`
  padding: 9px 12px;
  border-radius: ${palette.borderRadius.medium};
  text-align: center;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: #fff;
  background: ${({ $phase }) =>
    $phase === 'done' ? '#12B76A' :
    $phase === 'creating' ? palette.colors.gray[600] :
    palette.colors.brand[500]};
  transition: background 0.35s;
`;

// ─── Card 2: Calendar connect (JS-animated) ─────────────────────────────────

const SaCalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 78%;
`;

const SaCalIcon = styled.div<{ $connected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${palette.borderRadius.medium};
  border: 2px solid ${({ $connected }) => $connected ? '#12B76A' : palette.colors.gray[700]};
  background: ${palette.colors.gray[800]};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.4s;
`;

const SaCalIconTop = styled.div`
  background: ${palette.colors.brand[500]};
  height: 12px;
  width: 100%;
  flex-shrink: 0;
`;

const SaCalIconDate = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 17px;
  font-weight: ${palette.typography.fontWeight.bold};
  color: ${palette.colors.gray[100]};
  line-height: 1;
`;

const SaCalInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SaCalName = styled.div`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[100]};
`;

const SaCalStatus = styled.div<{ $ok: boolean }>`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${({ $ok }) => $ok ? '#12B76A' : palette.colors.gray[500]};
  transition: color 0.4s;
`;

const SaCalCheck = styled.div<{ $show: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #12B76A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
  opacity: ${({ $show }) => $show ? 1 : 0};
  transition: opacity 0.4s;
`;

// ─── Card 3: Preferences (JS-animated) ──────────────────────────────────────

const SaPrefsScene = styled.div`
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SaPrefRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SaPrefLabel = styled.div`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 10px;
  color: ${palette.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const SaTransitRow = styled.div`
  display: flex;
  gap: 6px;
`;

const SaTransitOption = styled.div<{ $active: boolean }>`
  flex: 1;
  padding: 6px 4px;
  border-radius: ${palette.borderRadius.medium};
  border: 1px solid ${({ $active }) => $active ? `${palette.colors.brand[500]}40` : palette.colors.gray[700]};
  background: ${({ $active }) => $active ? `${palette.colors.brand[500]}15` : palette.colors.gray[800]};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 10px;
  text-align: center;
  color: ${({ $active }) => $active ? palette.colors.brand[400] : palette.colors.gray[500]};
  transition: all 0.4s;
`;

const SaTimeRange = styled.div`
  padding: 7px 10px;
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 10px;
  color: ${palette.colors.gray[400]};
  display: flex;
  justify-content: space-between;
`;

// ─── Card 4: Adaptive scheduling (JS-animated) ──────────────────────────────

const SaSchedScene = styled.div`
  width: 88%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SaSchedTimeLabel = styled.div`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 9px;
  color: ${palette.colors.gray[600]};
  margin-bottom: 1px;
`;

const SaSchedRow = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

const SaSchedBlock = styled.div<{
  $bg: string;
  $width?: string;
  $shifted?: boolean;
  $visible?: boolean;
}>`
  height: 28px;
  border-radius: ${palette.borderRadius.little};
  background: ${({ $bg }) => $bg};
  width: ${({ $width }) => $width || 'auto'};
  flex: ${({ $width }) => $width ? '0 0 auto' : '1'};
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 9px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: rgba(255, 255, 255, 0.75);
  transform: translateX(${({ $shifted }) => $shifted ? '46px' : '0'});
  opacity: ${({ $visible }) => $visible === false ? 0 : 1};
  transition: transform 0.65s ease, opacity 0.45s ease;
  white-space: nowrap;
  overflow: hidden;
`;

const SaSchedStatus = styled.div<{ $phase: string }>`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 10px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${({ $phase }) =>
    $phase === 'settled' ? '#12B76A' :
    $phase === 'disrupted' ? palette.colors.brand[400] :
    'transparent'};
  margin-top: 3px;
  transition: color 0.35s;
  min-height: 15px;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const SetUpTilerSection: React.FC = () => {
  const { t } = useTranslation();
  const [setUpOpen, setSetUpOpen] = useState(false);

  // Animation state
  const [signupPhase, setSignupPhase] = useState<'idle' | 'creating' | 'done'>('idle');
  const [calStatus, setCalStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [transitMode, setTransitMode] = useState<'drive' | 'transit' | 'walk'>('drive');
  const [schedPhase, setSchedPhase] = useState<'normal' | 'disrupted' | 'settled'>('normal');

  useEffect(() => {
    if (!setUpOpen) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const signupCycle = () => {
      setSignupPhase('idle');
      timers.push(setTimeout(() => setSignupPhase('creating'), 2000));
      timers.push(setTimeout(() => setSignupPhase('done'), 3200));
      timers.push(setTimeout(signupCycle, 6000));
    };
    signupCycle();

    const calCycle = () => {
      setCalStatus('idle');
      timers.push(setTimeout(() => setCalStatus('connecting'), 2000));
      timers.push(setTimeout(() => setCalStatus('connected'), 3200));
      timers.push(setTimeout(calCycle, 6500));
    };
    calCycle();

    const transitCycle = () => {
      setTransitMode('drive');
      timers.push(setTimeout(() => setTransitMode('transit'), 2000));
      timers.push(setTimeout(() => setTransitMode('walk'), 3800));
      timers.push(setTimeout(transitCycle, 6000));
    };
    transitCycle();

    const schedCycle = () => {
      setSchedPhase('normal');
      timers.push(setTimeout(() => setSchedPhase('disrupted'), 2000));
      timers.push(setTimeout(() => setSchedPhase('settled'), 3500));
      timers.push(setTimeout(schedCycle, 7000));
    };
    schedCycle();

    return () => timers.forEach(clearTimeout);
  }, [setUpOpen]);

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
            <SetupGrid>

              {/* Card 1: Create your account */}
              <SetupCard>
                <SetupAnim>
                  <SaSignupScene>
                    <SaSignupInput>gloria@example.com</SaSignupInput>
                    <SaSignupBtn $phase={signupPhase}>
                      {signupPhase === 'idle'
                        ? t('discover.setUpTiler.cards.account.btnIdle')
                        : signupPhase === 'creating'
                        ? t('discover.setUpTiler.cards.account.btnCreating')
                        : t('discover.setUpTiler.cards.account.btnDone')}
                    </SaSignupBtn>
                  </SaSignupScene>
                </SetupAnim>
                <SetupBody>
                  <SetupCardStepBadge>1</SetupCardStepBadge>
                  <SetupCardTitle>{t('discover.setUpTiler.cards.account.title')}</SetupCardTitle>
                  <SetupCardSubtext>{t('discover.setUpTiler.cards.account.subtext')}</SetupCardSubtext>
                </SetupBody>
              </SetupCard>

              {/* Card 2: Connect your calendar */}
              <SetupCard>
                <SetupAnim>
                  <SaCalRow>
                    <SaCalIcon $connected={calStatus !== 'idle'}>
                      <SaCalIconTop />
                      <SaCalIconDate>17</SaCalIconDate>
                    </SaCalIcon>
                    <SaCalInfo>
                      <SaCalName>{t('discover.setUpTiler.cards.calendar.calName')}</SaCalName>
                      <SaCalStatus $ok={calStatus !== 'idle'}>
                        {calStatus === 'idle'
                          ? t('discover.setUpTiler.cards.calendar.statusIdle')
                          : calStatus === 'connecting'
                          ? t('discover.setUpTiler.cards.calendar.statusConnecting')
                          : t('discover.setUpTiler.cards.calendar.statusConnected')}
                      </SaCalStatus>
                    </SaCalInfo>
                    <SaCalCheck $show={calStatus === 'connected'}>✓</SaCalCheck>
                  </SaCalRow>
                </SetupAnim>
                <SetupBody>
                  <SetupCardStepBadge>2</SetupCardStepBadge>
                  <SetupCardTitle>{t('discover.setUpTiler.cards.calendar.title')}</SetupCardTitle>
                  <SetupCardSubtext>{t('discover.setUpTiler.cards.calendar.subtext')}</SetupCardSubtext>
                </SetupBody>
              </SetupCard>

              {/* Card 3: Set up your preferences */}
              <SetupCard>
                <SetupAnim>
                  <SaPrefsScene>
                    <SaPrefRow>
                      <SaPrefLabel>{t('discover.setUpTiler.cards.preferences.transitLabel')}</SaPrefLabel>
                      <SaTransitRow>
                        <SaTransitOption $active={transitMode === 'drive'}>
                          🚗 {t('discover.setUpTiler.cards.preferences.drive')}
                        </SaTransitOption>
                        <SaTransitOption $active={transitMode === 'transit'}>
                          🚌 {t('discover.setUpTiler.cards.preferences.transit')}
                        </SaTransitOption>
                        <SaTransitOption $active={transitMode === 'walk'}>
                          🚶 {t('discover.setUpTiler.cards.preferences.walk')}
                        </SaTransitOption>
                      </SaTransitRow>
                    </SaPrefRow>
                    <SaPrefRow>
                      <SaPrefLabel>{t('discover.setUpTiler.cards.preferences.workHoursLabel')}</SaPrefLabel>
                      <SaTimeRange>
                        <span>9:00 am</span>
                        <span>→</span>
                        <span>6:00 pm</span>
                      </SaTimeRange>
                    </SaPrefRow>
                  </SaPrefsScene>
                </SetupAnim>
                <SetupBody>
                  <SetupCardStepBadge>3</SetupCardStepBadge>
                  <SetupCardTitle>{t('discover.setUpTiler.cards.preferences.title')}</SetupCardTitle>
                  <SetupCardSubtext>{t('discover.setUpTiler.cards.preferences.subtext')}</SetupCardSubtext>
                </SetupBody>
              </SetupCard>

              {/* Card 4: Ready for Adaptive Scheduling */}
              <SetupCard>
                <SetupAnim>
                  <SaSchedScene>
                    <SaSchedTimeLabel>{t('discover.setUpTiler.cards.adaptive.schedLabel')}</SaSchedTimeLabel>
                    <SaSchedRow>
                      <SaSchedBlock $bg={palette.colors.gray[700]} $width="88px">
                        {t('discover.setUpTiler.cards.adaptive.meeting')}
                      </SaSchedBlock>
                      <SaSchedBlock
                        $bg={`${palette.colors.brand[500]}90`}
                        $shifted={schedPhase === 'settled'}
                      >
                        {t('discover.setUpTiler.cards.adaptive.run')}
                      </SaSchedBlock>
                    </SaSchedRow>
                    <SaSchedRow>
                      <SaSchedBlock
                        $bg={palette.colors.gray[700]}
                        $width="88px"
                        $visible={schedPhase !== 'normal'}
                      >
                        {t('discover.setUpTiler.cards.adaptive.newTime')}
                      </SaSchedBlock>
                      <SaSchedBlock
                        $bg={`${palette.colors.gray[600]}`}
                        $visible={schedPhase !== 'normal'}
                      >
                        {t('discover.setUpTiler.cards.adaptive.urgentCall')}
                      </SaSchedBlock>
                    </SaSchedRow>
                    <SaSchedStatus $phase={schedPhase}>
                      {schedPhase === 'disrupted'
                        ? t('discover.setUpTiler.cards.adaptive.recalculating')
                        : schedPhase === 'settled'
                        ? t('discover.setUpTiler.cards.adaptive.rebuilt')
                        : ''}
                    </SaSchedStatus>
                  </SaSchedScene>
                </SetupAnim>
                <SetupBody>
                  <SetupCardStepBadge>4</SetupCardStepBadge>
                  <SetupCardTitle>{t('discover.setUpTiler.cards.adaptive.title')}</SetupCardTitle>
                  <SetupCardSubtext>{t('discover.setUpTiler.cards.adaptive.subtext')}</SetupCardSubtext>
                </SetupBody>
              </SetupCard>

            </SetupGrid>

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
