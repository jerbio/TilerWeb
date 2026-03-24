import React, { useState, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Collapse from '@/core/common/components/collapse';
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
} from './shared';

// ─── What Is Tiler Visual ────────────────────────────────────────────────────

const mockTileColors: Record<string, string> = {
  brand: palette.colors.brand[500],
  orange: '#f97316',
  teal: '#14b8a6',
};

const WhatIsTilerVisual = styled.div`
  width: 160px;
  height: 120px;
  border-radius: ${palette.borderRadius.medium};
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
  }
`;

const MockTile = styled.div<{ $color: keyof typeof mockTileColors }>`
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 9px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: white;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  ${({ $color }) => css`
    background: ${mockTileColors[$color]}30;
    border: 1px solid ${mockTileColors[$color]}60;
    color: ${mockTileColors[$color]};
  `}
`;

const MockTileDot = styled.span<{ $color: keyof typeof mockTileColors }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  ${({ $color }) => css`
    background: ${mockTileColors[$color]};
  `}
`;

// ─── Core Blocks Grid ────────────────────────────────────────────────────────

const BlocksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-bottom: 0.5rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const BlockCard = styled.div`
  background: ${palette.colors.gray[800]}60;
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.medium};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BlockCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BlockEmoji = styled.span`
  font-size: 1.1rem;
`;

const BlockTitle = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[200]};
`;

const BlockBadge = styled.span`
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  background: ${palette.colors.brand[500]}20;
  border: 1px solid ${palette.colors.brand[500]}40;
  border-radius: 9999px;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 10px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.brand[400]};
  white-space: nowrap;
`;

const BlockDesc = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[500]};
  line-height: 1.55;
  margin: 0;
`;

// ─── Comparison Table ────────────────────────────────────────────────────────

const ComparisonTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: ${palette.borderRadius.medium};
  overflow: hidden;
  border: 1px solid ${palette.colors.gray[800]};
  margin-bottom: 0.5rem;
`;

const ComparisonHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${palette.colors.gray[800]};
`;

const ComparisonHeaderCell = styled.div<{ $side: 'left' | 'right' }>`
  padding: 0.625rem 1rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $side }) =>
    $side === 'right' ? palette.colors.brand[400] : palette.colors.gray[500]};
`;

const ComparisonRow = styled.div<{ $even: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${({ $even }) =>
    $even ? `${palette.colors.gray[900]}80` : 'transparent'};
  border-top: 1px solid ${palette.colors.gray[800]};
`;

const ComparisonCell = styled.div<{ $side: 'left' | 'right' }>`
  padding: 0.625rem 1rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${({ $side }) =>
    $side === 'right' ? palette.colors.gray[300] : palette.colors.gray[600]};
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;

  &::before {
    content: ${({ $side }) => ($side === 'right' ? '"✓"' : '"✕"')};
    flex-shrink: 0;
    margin-top: 1px;
    font-weight: bold;
    color: ${({ $side }) =>
      $side === 'right' ? palette.colors.brand[400] : palette.colors.gray[700]};
  }
`;

const SubBodyText = styled.div`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[500]};
  line-height: 1.65;
  margin: 0 0 0.5rem;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const WhatIsTilerSection: React.FC = () => {
  const { t } = useTranslation();
  const [whatIsOpen, setWhatIsOpen] = useState(false);

  const coreBlocks = useMemo(
    () => [
      {
        emoji: '\uD83E\uDDE9',
        label: t('discover.whatIsTiler.coreBlocks.tiles.label'),
        title: t('discover.whatIsTiler.coreBlocks.tiles.title'),
        desc: t('discover.whatIsTiler.coreBlocks.tiles.desc'),
      },
      {
        emoji: '\uD83D\uDCCC',
        label: t('discover.whatIsTiler.coreBlocks.blocks.label'),
        title: t('discover.whatIsTiler.coreBlocks.blocks.title'),
        desc: t('discover.whatIsTiler.coreBlocks.blocks.desc'),
      },
      {
        emoji: '\uD83D\uDDFA\uFE0F',
        label: t('discover.whatIsTiler.coreBlocks.route.label'),
        title: t('discover.whatIsTiler.coreBlocks.route.title'),
        desc: t('discover.whatIsTiler.coreBlocks.route.desc'),
      },
      {
        emoji: '\uD83D\uDC65',
        label: t('discover.whatIsTiler.coreBlocks.tileShare.label'),
        title: t('discover.whatIsTiler.coreBlocks.tileShare.title'),
        desc: t('discover.whatIsTiler.coreBlocks.tileShare.desc'),
      },
    ],
    [t],
  );

  const comparisonRows = useMemo(
    () => [
      {
        left: t('discover.whatIsTiler.comparison.rows.0.left'),
        right: t('discover.whatIsTiler.comparison.rows.0.right'),
      },
      {
        left: t('discover.whatIsTiler.comparison.rows.1.left'),
        right: t('discover.whatIsTiler.comparison.rows.1.right'),
      },
      {
        left: t('discover.whatIsTiler.comparison.rows.2.left'),
        right: t('discover.whatIsTiler.comparison.rows.2.right'),
      },
      {
        left: t('discover.whatIsTiler.comparison.rows.3.left'),
        right: t('discover.whatIsTiler.comparison.rows.3.right'),
      },
      {
        left: t('discover.whatIsTiler.comparison.rows.4.left'),
        right: t('discover.whatIsTiler.comparison.rows.4.right'),
      },
      {
        left: t('discover.whatIsTiler.comparison.rows.5.left'),
        right: t('discover.whatIsTiler.comparison.rows.5.right'),
      },
    ],
    [t],
  );

  const whatIsSubItems = useMemo(
    () => [
      {
        title: t('discover.whatIsTiler.subItems.aiRunsDay.title'),
        content: (
          <SubBodyText>
            {t('discover.whatIsTiler.subItems.aiRunsDay.content')}
          </SubBodyText>
        ),
      },
      {
        title: t('discover.whatIsTiler.subItems.fourCoreBlocks.title'),
        content: (
          <BlocksGrid>
            {coreBlocks.map((block) => (
              <BlockCard key={block.title}>
                <BlockCardHeader>
                  <BlockEmoji>{block.emoji}</BlockEmoji>
                  <BlockTitle>{block.title}</BlockTitle>
                  <BlockBadge>{block.label}</BlockBadge>
                </BlockCardHeader>
                <BlockDesc>{block.desc}</BlockDesc>
              </BlockCard>
            ))}
          </BlocksGrid>
        ),
      },
      {
        title: t('discover.whatIsTiler.subItems.howDifferent.title'),
        content: (
          <ComparisonTable>
            <ComparisonHeader>
              <ComparisonHeaderCell $side="left">
                {t('discover.whatIsTiler.comparison.headerLeft')}
              </ComparisonHeaderCell>
              <ComparisonHeaderCell $side="right">
                {t('discover.whatIsTiler.comparison.headerRight')}
              </ComparisonHeaderCell>
            </ComparisonHeader>
            {comparisonRows.map((row, i) => (
              <ComparisonRow key={i} $even={i % 2 === 0}>
                <ComparisonCell $side="left">{row.left}</ComparisonCell>
                <ComparisonCell $side="right">{row.right}</ComparisonCell>
              </ComparisonRow>
            ))}
          </ComparisonTable>
        ),
      },
    ],
    [t, coreBlocks, comparisonRows],
  );

  return (
    <ExpandableWrapper>
      <ExpandableSection>
        <ExpandableHeader
          $open={whatIsOpen}
          onClick={() => setWhatIsOpen((o) => !o)}
        >
          <ExpandableTextSide>
            <SectionBadge>{t('discover.whatIsTiler.badge')}</SectionBadge>
            <SectionTitle>{t('discover.whatIsTiler.title')}</SectionTitle>
            <SectionSummary>{t('discover.whatIsTiler.summary')}</SectionSummary>
          </ExpandableTextSide>

          <ExpandableHeaderRight>
            <WhatIsTilerVisual>
              <MockTile $color="brand">
                <MockTileDot $color="brand" />
                {t('discover.whatIsTiler.visual.tile1')}
              </MockTile>
              <MockTile $color="orange">
                <MockTileDot $color="orange" />
                {t('discover.whatIsTiler.visual.tile2')}
              </MockTile>
              <MockTile $color="teal">
                <MockTileDot $color="teal" />
                {t('discover.whatIsTiler.visual.tile3')}
              </MockTile>
              <MockTile $color="brand">
                <MockTileDot $color="brand" />
                {t('discover.whatIsTiler.visual.tile4')}
              </MockTile>
            </WhatIsTilerVisual>
            <Chevron $open={whatIsOpen}>&#9660;</Chevron>
          </ExpandableHeaderRight>
        </ExpandableHeader>

        <ExpandableBody $open={whatIsOpen}>
          <ExpandableBodyInner>
            <SubCollapseWrapper>
              <Collapse items={whatIsSubItems} />
            </SubCollapseWrapper>
          </ExpandableBodyInner>
        </ExpandableBody>
      </ExpandableSection>
    </ExpandableWrapper>
  );
};

export default WhatIsTilerSection;
