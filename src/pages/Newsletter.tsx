import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';
import Collapse from '@/core/common/components/collapse';

// ─── How-To Data ─────────────────────────────────────────────────────────────

const items = [
  {
    title: "Set Up Tiler",
    gif: "/gifs/set-up-tiler.gif",
    body: "Tiler works best when it\u2019s running in the background. Autopilot means you don\u2019t manually place tasks on your timeline; you simply tell Tiler what needs to get done, and it schedules everything around your day automatically. Once enabled, Tiler continuously adjusts your timeline as tasks are added, deferred, or as calendar events come in.",
  },
  {
    title: "How to Create a Block",
    gif: "/gifs/how-to-create-a-block.gif",
    body: "Blocks represent fixed commitments, meetings, appointments, events, and things that must happen at a specific time. When you create or sync a block, Tiler treats it as non-negotiable and schedules your flexible work around it. Blocks don\u2019t move unless you move them. This is how Tiler respects real-world commitments while still keeping your day workable.",
  },
  {
    title: "Creating Flexible Tiles",
    gif: "/gifs/creating-flexible-tiles.gif",
    body: "Tiles are where Tiler becomes powerful. A tile represents something you need to do, without locking it to a rigid time. You set the intent, estimated duration, and optional deadline \u2014 Tiler handles placement. Tiles can move, adapt, and reshuffle as your day changes, making them ideal for real work, errands, habits, and focus sessions.",
  },
  {
    title: "How Does Adaptive Scheduling Work?",
    body: "Adaptive scheduling means your timeline updates itself when reality changes. If a meeting runs long, a task is deferred, or a new event is added, Tiler recalculates the rest of your day instantly. You don\u2019t reorganise your schedule, you make one adjustment, and the system resolves conflicts, shifts tiles, and keeps everything realistic.",
  },
  {
    title: "How to Update a Tile",
    body: "Updating a tile is how you communicate change to the system. You can adjust its duration, defer it, change its deadline, or mark it complete. The moment you do, Tiler re-optimises your timeline to reflect the update. You don\u2019t need to move other tasks manually, the system handles the ripple effects.",
  },
  {
    title: "Connect a Calendar",
    body: "Connecting your calendar allows Tiler to see your real commitments. Once synced, incoming calendar events appear as blocks in your timeline. You can accept, edit, or resolve conflicts directly inside Tiler. When events change, Tiler adapts your tiles around them so your day stays balanced and realistic.",
  },
  {
    title: "Show My Route",
    body: "Tiler doesn\u2019t just tell you what to do. It helps you get there. With in-app navigation, your day becomes a route, not a list. Tiler factors in location and transit, guiding you from one tile to the next with real travel awareness. This is especially useful for errand days, on-the-go schedules, and multi-location workflows.",
  },
  {
    title: "Send a TileShare",
    body: "TileShare lets you pass work to others without micromanaging. You can send a tile (or multiple tiles) to someone else, set expectations, and let Tiler handle scheduling on both sides. It\u2019s ideal for teams, partners, and shared responsibilities \u2014 the context travels with the task, not the reminders.",
  },
  {
    title: "Travel Time?",
    body: "Look for the orange rectangle living between your tiles. That\u2019s Tiler quietly accounting for reality \u2014 showing how long it will take to get from one place to the next. Tap it and you\u2019re on the map, route loaded, time counted.",
  },
  {
    title: "Where Does Navigation Start?",
    body: "Tap Show Route and your timeline turns into a journey. One tile flows into the next, with directions baked in. Your day stops being a list and starts becoming a path.",
  },
];

// ─── What Is Tiler — Sub-item data ───────────────────────────────────────────

const coreBlocks = [
  {
    emoji: "\uD83E\uDDE9",
    label: "AutoTile",
    title: "Tiles",
    desc: "Flexible tasks. Set a goal and duration — Tiler finds the slot, moves them as your day shifts, and sequences them intelligently.",
  },
  {
    emoji: "\uD83D\uDCCC",
    label: "Locked",
    title: "Blocks",
    desc: "Fixed commitments: meetings, flights, appointments. Tiler treats these as immovable anchors and schedules everything else around them.",
  },
  {
    emoji: "\uD83D\uDDFA\uFE0F",
    label: "Location-aware",
    title: "Route",
    desc: "When tiles have locations, Tiler sequences them geographically, surfaces real transit options, and builds travel buffers between every stop.",
  },
  {
    emoji: "\uD83D\uDC65",
    label: "Team & Family",
    title: "TileShare",
    desc: "Assign tiles to teammates or family. Everyone's calendar adapts around shared commitments automatically. Context travels with the task.",
  },
];

const comparisonRows = [
  { left: "You schedule everything manually", right: "AI builds your schedule from plain English" },
  { left: "No awareness of travel time", right: "Auto-calculates and adds travel buffers" },
  { left: "Static — won't adapt when things change", right: "Detects ripples and reschedules instantly" },
  { left: "No navigation or route planning", right: "Navigate your day tile-to-tile with real transit" },
  { left: "Shared calendars only — no task assignment", right: "TileShare: assign and track tasks with anyone" },
  { left: "Nothing confirmed — events just appear", right: "Confirmation-first — you approve all changes" },
];

// ─── Styles — Existing ───────────────────────────────────────────────────────

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 4rem 1.5rem 6rem;
  gap: 3rem;
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 680px;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, ${palette.colors.brand[500]}20, ${palette.colors.brand[600]}30);
  border: 1px solid ${palette.colors.brand[500]}40;
  border-radius: 9999px;
  color: ${palette.colors.brand[300]};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeroTitle = styled.h1`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: ${palette.typography.fontWeight.bold};
  color: ${palette.colors.gray[100]};
  margin: 0;
  line-height: 1.15;
`;

const HeroSubtitle = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[400]};
  margin: 0;
  line-height: 1.7;
`;

const CollapseWrapper = styled.div`
  width: 100%;
  max-width: 860px;
`;

const ContentRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: flex-start;
  padding-bottom: 0.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const MediaPlaceholder = styled.div`
  flex: 0 0 55%;
  aspect-ratio: 16 / 9;
  background: ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 640px) {
    flex: unset;
    width: 100%;
  }
`;

const GifImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${palette.borderRadius.medium};
`;

const MediaPlaceholderText = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[600]};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const BodyText = styled.span`
  flex: 1;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[500]};
  line-height: 1.6;
`;

const BackgroundBlur = styled.div`
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -10;
  width: 900px;
  height: 900px;
  background: radial-gradient(circle, ${palette.colors.brand[500]}14, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
`;

// ─── Styles — What Is Tiler Section ──────────────────────────────────────────

const WhatIsTilerWrapper = styled.div`
  width: 100%;
  max-width: 860px;
`;

const WhatIsTilerSection = styled.div`
  border: 1px solid ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.large};
  background: ${palette.colors.gray[900]}80;
  overflow: hidden;
`;

const WhatIsTilerHeader = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;

  &:hover {
    background: ${palette.colors.gray[800]}40;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const WhatIsTilerTextSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionBadge = styled.span`
  display: inline-block;
  width: fit-content;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, ${palette.colors.brand[500]}20, ${palette.colors.brand[600]}30);
  border: 1px solid ${palette.colors.brand[500]}40;
  border-radius: 9999px;
  color: ${palette.colors.brand[300]};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SectionTitle = styled.h2`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: ${palette.typography.fontWeight.bold};
  background: linear-gradient(to bottom, ${palette.colors.gray[100]}, ${palette.colors.gray[400]});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
  line-height: 1.2;
`;

const SectionSummary = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  line-height: 1.65;
  margin: 0;
`;

const WhatIsTilerHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
`;

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

const mockTileColors: Record<string, string> = {
  brand: palette.colors.brand[500],
  orange: "#f97316",
  teal: "#14b8a6",
};

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

const chevronBounce = css`
  @keyframes chevronBounce {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    50%       { transform: rotate(0deg) translateY(4px); }
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  ${chevronBounce}
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ $open }) =>
    $open ? `${palette.colors.brand[500]}25` : `${palette.colors.gray[700]}80`};
  border: 1px solid ${({ $open }) =>
    $open ? `${palette.colors.brand[500]}50` : `${palette.colors.gray[600]}60`};
  color: ${({ $open }) => ($open ? palette.colors.brand[400] : palette.colors.gray[300])};
  font-size: 0.7rem;
  flex-shrink: 0;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 0.3s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  animation: ${({ $open }) => ($open ? "none" : "chevronBounce 1.6s ease-in-out infinite")};
`;

const WhatIsTilerExpanded = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.35s ease-in-out;
`;

const WhatIsTilerExpandedInner = styled.div`
  overflow: hidden;
`;

const SubCollapseWrapper = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid ${palette.colors.gray[800]};
`;

// ─── Styles — Core Blocks Grid ───────────────────────────────────────────────

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

// ─── Styles — Comparison Table ───────────────────────────────────────────────

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

const ComparisonHeaderCell = styled.div<{ $side: "left" | "right" }>`
  padding: 0.625rem 1rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  font-weight: ${palette.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $side }) => ($side === "right" ? palette.colors.brand[400] : palette.colors.gray[500])};
`;

const ComparisonRow = styled.div<{ $even: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${({ $even }) => ($even ? `${palette.colors.gray[900]}80` : "transparent")};
  border-top: 1px solid ${palette.colors.gray[800]};
`;

const ComparisonCell = styled.div<{ $side: "left" | "right" }>`
  padding: 0.625rem 1rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${({ $side }) => ($side === "right" ? palette.colors.gray[300] : palette.colors.gray[600])};
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;

  &::before {
    content: ${({ $side }) => ($side === "right" ? '"✓"' : '"✕"')};
    flex-shrink: 0;
    margin-top: 1px;
    font-weight: bold;
    color: ${({ $side }) =>
      $side === "right" ? palette.colors.brand[400] : palette.colors.gray[700]};
  }
`;

// ─── Sub-item content components ─────────────────────────────────────────────

const SubBodyText = styled.div`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[500]};
  line-height: 1.65;
  margin: 0 0 0.5rem;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const Newsletter: React.FC = () => {
  const [whatIsOpen, setWhatIsOpen] = useState(false);

  const whatIsSubItems = [
    {
      title: "Tiler is an AI that runs your day.",
      content: (
        <SubBodyText>
          When a meeting runs long, or a task gets deferred, Tiler doesn&rsquo;t wait for you to
          fix it. It detects the shift and rebuilds your schedule around it, instantly. You set the
          intent. Tiler handles the rest.
        </SubBodyText>
      ),
    },
    {
      title: "The Four Core Blocks of Tiler",
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
      title: "How Tiler is Different",
      content: (
        <ComparisonTable>
          <ComparisonHeader>
            <ComparisonHeaderCell $side="left">Google Calendar</ComparisonHeaderCell>
            <ComparisonHeaderCell $side="right">Tiler</ComparisonHeaderCell>
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
  ];

  const collapseItems = items.map((item) => ({
    title: item.title,
    content: (
      <ContentRow>
        <MediaPlaceholder>
          {item.gif
            ? <GifImage src={item.gif} alt={item.title} />
            : <MediaPlaceholderText>Video / GIF</MediaPlaceholderText>
          }
        </MediaPlaceholder>
        <BodyText>{item.body}</BodyText>
      </ContentRow>
    ),
  }));

  return (
    <>
      <SEO
        title="Newsletter - Tiler"
        description="Explore the moments where your day finally makes sense. Find your way around the Tiler app and discover things to try in-app."
        canonicalUrl="/newsletter"
      />
      <Section>
        <BackgroundBlur />
        <PageWrapper>
          <Hero>
            <Badge>Navigate Tiler</Badge>
            <HeroTitle>Here&rsquo;s Where Everything Lives</HeroTitle>
            <HeroSubtitle>
              Explore the moments where your day finally makes sense. Find your way around the app.
              Find things to try in-app.
            </HeroSubtitle>
          </Hero>

          {/* ── What Is Tiler ── */}
          <WhatIsTilerWrapper>
            <WhatIsTilerSection>
              <WhatIsTilerHeader
                $open={whatIsOpen}
                onClick={() => setWhatIsOpen((o) => !o)}
              >
                <WhatIsTilerTextSide>
                  <SectionBadge>What Is Tiler</SectionBadge>
                  <SectionTitle>Not a calendar. An AI that runs your day</SectionTitle>
                  <SectionSummary>
                    Tell Tiler what needs doing. It finds the time, handles conflicts, and adjusts
                    when your day doesn&rsquo;t go to plan.
                  </SectionSummary>
                </WhatIsTilerTextSide>

                <WhatIsTilerHeaderRight>
                  <WhatIsTilerVisual>
                    <MockTile $color="brand">
                      <MockTileDot $color="brand" />
                      Gym · 45 min
                    </MockTile>
                    <MockTile $color="orange">
                      <MockTileDot $color="orange" />
                      Travel · 12 min
                    </MockTile>
                    <MockTile $color="teal">
                      <MockTileDot $color="teal" />
                      Client Call · 1 hr
                    </MockTile>
                    <MockTile $color="brand">
                      <MockTileDot $color="brand" />
                      Groceries · 30 min
                    </MockTile>
                  </WhatIsTilerVisual>
                  <Chevron $open={whatIsOpen}>&#9660;</Chevron>
                </WhatIsTilerHeaderRight>
              </WhatIsTilerHeader>

              <WhatIsTilerExpanded $open={whatIsOpen}>
                <WhatIsTilerExpandedInner>
                  <SubCollapseWrapper>
                    <Collapse items={whatIsSubItems} />
                  </SubCollapseWrapper>
                </WhatIsTilerExpandedInner>
              </WhatIsTilerExpanded>
            </WhatIsTilerSection>
          </WhatIsTilerWrapper>

          {/* ── How-To Rows ── */}
          <CollapseWrapper>
            <Collapse items={collapseItems} />
          </CollapseWrapper>
        </PageWrapper>
      </Section>
    </>
  );
};

export default Newsletter;
