import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import connectCalendarGif from '@/assets/gifs/connect-a-calendar.gif';
import createBlockGif from '@/assets/gifs/how-to-create-a-block.gif';
import flexibleTilesGif from '@/assets/gifs/creating-flexible-tiles.gif';
import updateTileGif from '@/assets/gifs/how-to-update-a-tile.gif';
import travelTimeGif from '@/assets/gifs/travel-time-and-route.gif';
import Collapse from '@/core/common/components/collapse';
import connectCalendarGif from '@/assets/connect-a-calendar.gif';
import createBlockGif from '@/assets/how-to-create-a-block.gif';
import flexibleTilesGif from '@/assets/creating-flexible-tiles.gif';
import updateTileGif from '@/assets/how-to-update-a-tile.gif';
import travelTimeGif from '@/assets/travel-time-and-route.gif';
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
  SubCollapseWrapper,
  ContentRow,
  MediaPlaceholder,
  MediaImage,
  MediaPlaceholderText,
  BodyText,
} from './shared';

// ─── How To Visual (header) ──────────────────────────────────────────────────

const HowToVisual = styled.div`
  width: 160px;
  height: 120px;
  border-radius: ${palette.borderRadius.medium};
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.875rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    height: auto;
    padding: 1rem 1.25rem;
  }
`;

const StepFlow = styled.div`
  display: flex;
  align-items: center;
`;

const StepBubble = styled.div<{ $done?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $done }) =>
    $done ? '#14b8a620' : `${palette.colors.brand[500]}30`};
  border: 1px solid ${({ $done }) =>
    $done ? '#14b8a650' : `${palette.colors.brand[500]}50`};
  color: ${({ $done }) => ($done ? '#14b8a6' : palette.colors.brand[400])};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
`;

const StepLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${palette.colors.gray[700]};
  position: relative;

  &::after {
    content: "▶";
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 6px;
    color: ${palette.colors.gray[600]};
    line-height: 1;
  }
`;

const StepLabelRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const StepLabel = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 7.5px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[500]};
  width: 32px;
  text-align: center;
  line-height: 1.3;
`;

// ─── Component ───────────────────────────────────────────────────────────────

interface HowToItem {
  titleKey: string;
  bodyKey: string;
  media?: string;
}

const HOW_TO_ITEMS: HowToItem[] = [
  {
    titleKey: 'discover.howToUseTiler.items.connectCalendar.title',
    bodyKey: 'discover.howToUseTiler.items.connectCalendar.body',
    media: connectCalendarGif,
  },
  {
    titleKey: 'discover.howToUseTiler.items.createBlock.title',
    bodyKey: 'discover.howToUseTiler.items.createBlock.body',
    media: createBlockGif,
  },
  {
    titleKey: 'discover.howToUseTiler.items.flexibleTiles.title',
    bodyKey: 'discover.howToUseTiler.items.flexibleTiles.body',
    media: flexibleTilesGif,
  },
  {
    titleKey: 'discover.howToUseTiler.items.updateTile.title',
    bodyKey: 'discover.howToUseTiler.items.updateTile.body',
    media: updateTileGif,
  },
  {
    titleKey: 'discover.howToUseTiler.items.travelTime.title',
    bodyKey: 'discover.howToUseTiler.items.travelTime.body',
    media: travelTimeGif,
  },
];

const HowToUseTilerSection: React.FC = () => {
  const { t } = useTranslation();
  const [howToOpen, setHowToOpen] = useState(false);

  const howToSubItems = useMemo(
    () =>
      HOW_TO_ITEMS.map((item) => ({
        title: t(item.titleKey),
        content: (
          <ContentRow>
            <MediaPlaceholder>
              {item.media ? (
                <MediaImage src={item.media} alt={t(item.titleKey)} />
              ) : (
                <MediaPlaceholderText>Image / GIF</MediaPlaceholderText>
              )}
            </MediaPlaceholder>
            <BodyText>{t(item.bodyKey)}</BodyText>
          </ContentRow>
        ),
      })),
    [t],
  );

  return (
    <ExpandableWrapper>
      <ExpandableSection>
        <ExpandableHeader
          $open={howToOpen}
          onClick={() => setHowToOpen((o) => !o)}
        >
          <ExpandableTextSide>
            <SectionBadge>{t('discover.howToUseTiler.badge')}</SectionBadge>
            <SectionTitle>{t('discover.howToUseTiler.title')}</SectionTitle>
            <SectionSummary>{t('discover.howToUseTiler.summary')}</SectionSummary>
          </ExpandableTextSide>

          <ExpandableHeaderRight>
            <HowToVisual>
              <StepFlow>
                <StepBubble>+</StepBubble>
                <StepLine />
                <StepBubble>⚡</StepBubble>
                <StepLine />
                <StepBubble $done>✓</StepBubble>
              </StepFlow>
              <StepLabelRow>
                <StepLabel>{t('discover.howToUseTiler.visual.step1')}</StepLabel>
                <StepLabel>{t('discover.howToUseTiler.visual.step2')}</StepLabel>
                <StepLabel>{t('discover.howToUseTiler.visual.step3')}</StepLabel>
              </StepLabelRow>
            </HowToVisual>
            <Chevron $open={howToOpen}>&#9660;</Chevron>
          </ExpandableHeaderRight>
        </ExpandableHeader>

        <ExpandableBody $open={howToOpen}>
          <ExpandableBodyInner>
            <SubCollapseWrapper>
              <Collapse items={howToSubItems} />
            </SubCollapseWrapper>
          </ExpandableBodyInner>
        </ExpandableBody>
      </ExpandableSection>
    </ExpandableWrapper>
  );
};

export default HowToUseTilerSection;
