import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';

// ─── Data ────────────────────────────────────────────────────────────────────

const items = [
  {
    title: "Set Up Tiler",
    body: "Tiler works best when it\u2019s running in the background. Autopilot means you don\u2019t manually place tasks on your timeline; you simply tell Tiler what needs to get done, and it schedules everything around your day automatically. Once enabled, Tiler continuously adjusts your timeline as tasks are added, deferred, or as calendar events come in.",
  },
  {
    title: "How to Create a Block",
    body: "Blocks represent fixed commitments, meetings, appointments, events, and things that must happen at a specific time. When you create or sync a block, Tiler treats it as non-negotiable and schedules your flexible work around it. Blocks don\u2019t move unless you move them. This is how Tiler respects real-world commitments while still keeping your day workable.",
  },
  {
    title: "Creating Flexible Tiles",
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

// ─── Styles ──────────────────────────────────────────────────────────────────

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

const SectionHeading = styled.h2`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[200]};
  margin: 0;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 960px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div<{ $expanded: boolean }>`
  border: 1px solid
    ${({ $expanded }) =>
      $expanded ? palette.colors.brand[500] : palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.large};
  background-color: ${({ $expanded }) =>
    $expanded ? `${palette.colors.brand[500]}0d` : palette.colors.gray[900]};
  overflow: hidden;
  transition: border-color 0.25s ease, background-color 0.25s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ $expanded }) =>
      $expanded ? palette.colors.brand[400] : palette.colors.gray[600]};
  }
`;

const CardHeader = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
`;

const CardTitle = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[100]};
  line-height: 1.4;
`;

const ChevronIcon = styled(ChevronDown)<{ $expanded: boolean }>`
  flex-shrink: 0;
  color: ${palette.colors.gray[500]};
  transition: transform 0.25s ease;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const CardBody = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '600px' : '0')};
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
`;

const CardBodyInner = styled.div`
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MediaPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MediaPlaceholderText = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[600]};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const BodyText = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[400]};
  line-height: 1.7;
  margin: 0;
`;

const Divider = styled.hr`
  width: 100%;
  max-width: 960px;
  border: none;
  border-top: 1px solid ${palette.colors.gray[800]};
  margin: 0;
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

// ─── Component ───────────────────────────────────────────────────────────────

const Newsletter: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }

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
          {/* Hero */}
          <Hero>
            <HeroTitle>Newsletter</HeroTitle>
            <HeroSubtitle>
              Explore the moments where your day finally makes sense. Find your way around the app.
              Find things to try in-app.
            </HeroSubtitle>
          </Hero>

          <Divider />

          {/* Section heading */}
          <SectionHeading>See how Tiler works differently for YOU</SectionHeading>

          {/* Expandable card grid */}
          <Grid>
            {items.map((item, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <Card
                  key={item.title + index}
                  $expanded={isExpanded}
                  onClick={() => toggle(index)}
                >
                  <CardHeader
                    aria-expanded={isExpanded}
                    aria-controls={`card-body-${index}`}
                  >
                    <CardTitle>{item.title}</CardTitle>
                    <ChevronIcon size={16} $expanded={isExpanded} />
                  </CardHeader>
                  <CardBody $expanded={isExpanded} id={`card-body-${index}`}>
                    <CardBodyInner>
                      <MediaPlaceholder>
                        <MediaPlaceholderText>Video / GIF</MediaPlaceholderText>
                      </MediaPlaceholder>
                      <BodyText>{item.body}</BodyText>
                    </CardBodyInner>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        </PageWrapper>
      </Section>
    </>
  );
};

export default Newsletter;
