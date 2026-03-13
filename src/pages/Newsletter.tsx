import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';
import Collapse from '@/core/common/components/collapse';

// ─── How-To Data ─────────────────────────────────────────────────────────────

const items = [
  {
    title: "Set Up Tiler",
    media: "/gifs/set-up-tiler.gif",
    body: "Tiler works best when it\u2019s running in the background. Autopilot means you don\u2019t manually place tasks on your timeline; you simply tell Tiler what needs to get done, and it schedules everything around your day automatically. Once enabled, Tiler continuously adjusts your timeline as tasks are added, deferred, or as calendar events come in.",
  },
  {
    title: "How to Create a Block",
    media: "/gifs/how-to-create-a-block.gif",
    body: "Blocks represent fixed commitments, meetings, appointments, events, and things that must happen at a specific time. When you create or sync a block, Tiler treats it as non-negotiable and schedules your flexible work around it. Blocks don\u2019t move unless you move them. This is how Tiler respects real-world commitments while still keeping your day workable.",
  },
  {
    title: "Creating Flexible Tiles",
    media: "/gifs/creating-flexible-tiles.gif",
    body: "Tiles are where Tiler becomes powerful. A tile represents something you need to do, without locking it to a rigid time. You set the intent, estimated duration, and optional deadline \u2014 Tiler handles placement. Tiles can move, adapt, and reshuffle as your day changes, making them ideal for real work, errands, habits, and focus sessions.",
  },
  {
    title: "How Does Adaptive Scheduling Work?",
    body: "Adaptive scheduling means your timeline updates itself when reality changes. If a meeting runs long, a task is deferred, or a new event is added, Tiler recalculates the rest of your day instantly. You don\u2019t reorganise your schedule, you make one adjustment, and the system resolves conflicts, shifts tiles, and keeps everything realistic.",
  },
  {
    title: "How to Update a Tile",
    media: "/gifs/how-to-update-a-tile.gif",
    body: "Updating a tile is how you communicate change to the system. You can adjust its duration, defer it, change its deadline, or mark it complete. The moment you do, Tiler re-optimises your timeline to reflect the update. You don\u2019t need to move other tasks manually, the system handles the ripple effects.",
  },
  {
    title: "Connect a Calendar",
    media: "/gifs/connect-a-calendar.gif",
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
    title: "Travel Time & Route",
    media: "/gifs/travel-time-and-route.gif",
    body: "Add a location to any tile and Tiler handles the rest. It auto-detects where you need to be and calculates real travel time between every stop on your day. That orange block sitting between your tiles isn\u2019t a gap \u2014 it\u2019s your journey, already planned. Tap it and your route opens: turn-by-turn directions loaded, time accounted for. Your schedule doesn\u2019t just tell you what to do. It gets you there.",
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

const MediaImage = styled.img`
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

// ─── Styles — Shared Expandable Section ──────────────────────────────────────

const ExpandableWrapper = styled.div`
  width: 100%;
  max-width: 860px;
`;

const ExpandableSection = styled.div`
  border: 1px solid ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.large};
  background: ${palette.colors.gray[900]}80;
  overflow: hidden;
`;

const ExpandableHeader = styled.button<{ $open: boolean }>`
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

const ExpandableTextSide = styled.div`
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

const ExpandableHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
`;

const chevronBounce = css`
  @keyframes chevronBounce {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    50%       { transform: rotate(0deg) translateY(4px); }
  }
`;

// ─── Hero visual content animations ──────────────────────────────────────────

const tileSlideIn = css`
  @keyframes tileSlideIn {
    0%   { opacity: 0; transform: translateX(12px); }
    12%  { opacity: 1; transform: translateX(0); }
    80%  { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-12px); }
  }
`;

const setupRowReveal = css`
  @keyframes setupRowReveal {
    0%   { opacity: 0; transform: translateY(6px); }
    12%  { opacity: 1; transform: translateY(0); }
    80%  { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(6px); }
  }
`;

const stepGlow = css`
  @keyframes stepGlow {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    20%      { transform: scale(1.18); filter: brightness(1.5); }
    40%      { transform: scale(1); filter: brightness(1); }
  }
`;

const iconPopIn = css`
  @keyframes iconPopIn {
    0%   { opacity: 0; transform: scale(0.4); }
    12%  { opacity: 1; transform: scale(1.1); }
    22%  { opacity: 1; transform: scale(1); }
    80%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.4); }
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

const ExpandableBody = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.35s ease-in-out;
`;

const ExpandableBodyInner = styled.div`
  overflow: hidden;
`;

const SubCollapseWrapper = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid ${palette.colors.gray[800]};
`;

// ─── Styles — What Is Tiler Visual ───────────────────────────────────────────

const mockTileColors: Record<string, string> = {
  brand: palette.colors.brand[500],
  orange: "#f97316",
  teal: "#14b8a6",
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
  ${tileSlideIn}
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 9px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: white;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  animation: tileSlideIn 3.5s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.15s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.45s; }

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

// ─── Styles — How To Use Tiler Visual ────────────────────────────────────────

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
  ${stepGlow}
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $done }) =>
    $done ? "#14b8a620" : `${palette.colors.brand[500]}30`};
  border: 1px solid ${({ $done }) =>
    $done ? "#14b8a650" : `${palette.colors.brand[500]}50`};
  color: ${({ $done }) => ($done ? "#14b8a6" : palette.colors.brand[400])};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  animation: stepGlow 3s ease-in-out infinite;

  &:nth-child(3) { animation-delay: 0.8s; }
  &:nth-child(5) { animation-delay: 1.6s; }
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

// ─── Styles — Set Up Tiler Visual ────────────────────────────────────────────

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
  ${setupRowReveal}
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: setupRowReveal 4s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
  &:nth-child(4) { animation-delay: 0.6s; }
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
    $active ? "setupPulse 1.8s ease-in-out infinite" : "none"};
`;

const SetupRowLabel = styled.span<{ $done?: boolean }>`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 8px;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${({ $done }) => ($done ? palette.colors.gray[300] : palette.colors.gray[500])};
  line-height: 1;
`;

// ─── Styles — Set Up Tiler card grid ─────────────────────────────────────────

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

// ── Animation area (220px, dark bg, clipped) ─────────────────────────────────
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

// ── Minimal body: step badge + title only ─────────────────────────────────────
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

// ─── Styles — Features section ────────────────────────────────────────────────

const FeaturesVisual = styled.div`
  width: 160px;
  height: 120px;
  border-radius: ${palette.borderRadius.medium};
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    height: auto;
  }
`;

const FeaturesVisualRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;

  &:nth-child(2) > * { animation-delay: 0.3s; }
  &:nth-child(2) > *:nth-child(2) { animation-delay: 0.4s; }
  &:nth-child(2) > *:nth-child(3) { animation-delay: 0.5s; }
  &:nth-child(3) > * { animation-delay: 0.6s; }
  &:nth-child(3) > *:nth-child(2) { animation-delay: 0.7s; }
  &:nth-child(3) > *:nth-child(3) { animation-delay: 0.8s; }
`;

const FeaturesVisualIcon = styled.div<{ $bg: string }>`
  ${iconPopIn}
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  animation: iconPopIn 4s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.2s; }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1.25rem 0 1rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${palette.colors.gray[800]};
  border: 1px solid ${palette.colors.gray[700]};
  border-radius: ${palette.borderRadius.large};
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  transition: border-color 0.3s, transform 0.3s;

  &:hover {
    border-color: ${palette.colors.brand[500]}40;
    transform: translateY(-2px);
  }
`;

const FeatureIconBox = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
`;

const FeatureName = styled.h3`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: 0.875rem;
  font-weight: ${palette.typography.fontWeight.semibold};
  color: ${palette.colors.gray[100]};
  margin: 0;
  line-height: 1.3;
`;

const FeatureDesc = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[400]};
  line-height: 1.55;
  margin: 0;
  flex: 1;
`;

const FeatureBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 9999px;
  background: ${palette.colors.gray[700]};
  color: ${palette.colors.gray[500]};
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  align-self: flex-start;
  margin-top: 2px;
`;

// ── Card 1: Sign up (JS-animated) ─────────────────────────────────────────────
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

// ── Card 1: Sign-up form (JS-animated) ────────────────────────────────────────
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

// ── Card 3: Preferences (JS-animated) ────────────────────────────────────────
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

// ── Card 4: Adaptive scheduling (JS-animated) ────────────────────────────────
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
  const [setUpOpen, setSetUpOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // ── Set Up Tiler animation state ──────────────────────────────────────────
  const [signupPhase, setSignupPhase] = useState<'idle' | 'creating' | 'done'>('idle');
  const [calStatus, setCalStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [transitMode, setTransitMode] = useState<'drive' | 'transit' | 'walk'>('drive');
  const [schedPhase, setSchedPhase] = useState<'normal' | 'disrupted' | 'settled'>('normal');

  useEffect(() => {
    if (!setUpOpen) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    // Card 1: account creation button states (6s loop)
    const signupCycle = () => {
      setSignupPhase('idle');
      t.push(setTimeout(() => setSignupPhase('creating'), 2000));
      t.push(setTimeout(() => setSignupPhase('done'), 3200));
      t.push(setTimeout(signupCycle, 6000));
    };
    signupCycle();

    // Card 2: calendar connect sequence (6.5s loop)
    const calCycle = () => {
      setCalStatus('idle');
      t.push(setTimeout(() => setCalStatus('connecting'), 2000));
      t.push(setTimeout(() => setCalStatus('connected'), 3200));
      t.push(setTimeout(calCycle, 6500));
    };
    calCycle();

    // Card 3: transit mode cycling (6s loop)
    const transitCycle = () => {
      setTransitMode('drive');
      t.push(setTimeout(() => setTransitMode('transit'), 2000));
      t.push(setTimeout(() => setTransitMode('walk'), 3800));
      t.push(setTimeout(transitCycle, 6000));
    };
    transitCycle();

    // Card 4: adaptive schedule rearrange (7s loop)
    const schedCycle = () => {
      setSchedPhase('normal');
      t.push(setTimeout(() => setSchedPhase('disrupted'), 2000));
      t.push(setTimeout(() => setSchedPhase('settled'), 3500));
      t.push(setTimeout(schedCycle, 7000));
    };
    schedCycle();

    return () => t.forEach(clearTimeout);
  }, [setUpOpen]);

  // ── What Is Tiler sub-items ──────────────────────────────────────────────
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

  // ── Set Up Tiler — 4 onboarding steps (rendered inline as SetupGrid) ───────

  // ── How To Use Tiler — ordered subset of items ───────────────────────────
  const howToOrder = [
    "Connect a Calendar",
    "How to Create a Block",
    "Creating Flexible Tiles",
    "How to Update a Tile",
    "Travel Time & Route",
  ];

  const adaptiveItem = (() => {
    const item = items.find((i) => i.title === "How Does Adaptive Scheduling Work?")!;
    return [{
      title: item.title,
      content: (
        <ContentRow>
          <MediaPlaceholder>
            {item.media ? (
              <MediaImage src={item.media} alt={item.title} />
            ) : (
              <MediaPlaceholderText>Image / GIF</MediaPlaceholderText>
            )}
          </MediaPlaceholder>
          <BodyText>{item.body}</BodyText>
        </ContentRow>
      ),
    }];
  })();

  const howToItems = howToOrder.map(
    (title) => items.find((i) => i.title === title)!,
  );

  const howToSubItems = howToItems.map((item) => ({
    title: item.title,
    content: (
      <ContentRow>
        <MediaPlaceholder>
          {item.media ? (
            <MediaImage src={item.media} alt={item.title} />
          ) : (
            <MediaPlaceholderText>Image / GIF</MediaPlaceholderText>
          )}
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
          <ExpandableWrapper>
            <ExpandableSection>
              <ExpandableHeader
                $open={whatIsOpen}
                onClick={() => setWhatIsOpen((o) => !o)}
              >
                <ExpandableTextSide>
                  <SectionBadge>What Is Tiler</SectionBadge>
                  <SectionTitle>Not a calendar. An AI that runs your day</SectionTitle>
                  <SectionSummary>
                    Tell Tiler what needs doing. It finds the time, handles conflicts, and adjusts
                    when your day doesn&rsquo;t go to plan.
                  </SectionSummary>
                </ExpandableTextSide>

                <ExpandableHeaderRight>
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

          {/* ── Set Up Tiler ── */}
          <ExpandableWrapper>
            <ExpandableSection>
              <ExpandableHeader
                $open={setUpOpen}
                onClick={() => setSetUpOpen((o) => !o)}
              >
                <ExpandableTextSide>
                  <SectionBadge>Set Up Tiler</SectionBadge>
                  <SectionTitle>Ready in under 3 minutes.</SectionTitle>
                  <SectionSummary>
                    Your calendar, your preferences, your constraints — four steps
                    that give Tiler everything it needs to run Adaptive Scheduling
                    from day one.
                  </SectionSummary>
                </ExpandableTextSide>

                <ExpandableHeaderRight>
                  <SetUpVisual>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>Create Account</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>Connect Calendar</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>Set Up Preferences</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $active>◎</SetupDot>
                      <SetupRowLabel>Adaptive Scheduling</SetupRowLabel>
                    </SetupRow>
                  </SetUpVisual>
                  <Chevron $open={setUpOpen}>&#9660;</Chevron>
                </ExpandableHeaderRight>
              </ExpandableHeader>

              <ExpandableBody $open={setUpOpen}>
                <ExpandableBodyInner>
                  <SetupGrid>

                    {/* ── Card 1: Create your account (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaSignupScene>
                          <SaSignupInput>gloria@example.com</SaSignupInput>
                          <SaSignupBtn $phase={signupPhase}>
                            {signupPhase === 'idle'
                              ? 'Create free account'
                              : signupPhase === 'creating'
                              ? 'Creating account…'
                              : '✓ Account created!'}
                          </SaSignupBtn>
                        </SaSignupScene>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>1</SetupCardStepBadge>
                        <SetupCardTitle>Create your account</SetupCardTitle>
                        <SetupCardSubtext>
                          Sign up with your email — free to start, no credit card needed.
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 2: Connect your calendar (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaCalRow>
                          <SaCalIcon $connected={calStatus !== 'idle'}>
                            <SaCalIconTop />
                            <SaCalIconDate>17</SaCalIconDate>
                          </SaCalIcon>
                          <SaCalInfo>
                            <SaCalName>Google Calendar</SaCalName>
                            <SaCalStatus $ok={calStatus !== 'idle'}>
                              {calStatus === 'idle'
                                ? 'Tap to connect'
                                : calStatus === 'connecting'
                                ? 'Connecting…'
                                : '✓ Connected'}
                            </SaCalStatus>
                          </SaCalInfo>
                          <SaCalCheck $show={calStatus === 'connected'}>✓</SaCalCheck>
                        </SaCalRow>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>2</SetupCardStepBadge>
                        <SetupCardTitle>Connect your calendar</SetupCardTitle>
                        <SetupCardSubtext>
                          Link Google or Outlook — Tiler reads your events and builds around them.
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 3: Set up your preferences (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaPrefsScene>
                          <SaPrefRow>
                            <SaPrefLabel>Transit mode</SaPrefLabel>
                            <SaTransitRow>
                              <SaTransitOption $active={transitMode === 'drive'}>
                                🚗 Drive
                              </SaTransitOption>
                              <SaTransitOption $active={transitMode === 'transit'}>
                                🚌 Transit
                              </SaTransitOption>
                              <SaTransitOption $active={transitMode === 'walk'}>
                                🚶 Walk
                              </SaTransitOption>
                            </SaTransitRow>
                          </SaPrefRow>
                          <SaPrefRow>
                            <SaPrefLabel>Work hours</SaPrefLabel>
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
                        <SetupCardTitle>Set up your preferences</SetupCardTitle>
                        <SetupCardSubtext>
                          Choose your transit mode and set time limits in your profile.
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 4: Ready for Adaptive Scheduling (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaSchedScene>
                          <SaSchedTimeLabel>Your schedule</SaSchedTimeLabel>
                          <SaSchedRow>
                            <SaSchedBlock
                              $bg={palette.colors.gray[700]}
                              $width="88px"
                            >
                              9am meeting
                            </SaSchedBlock>
                            <SaSchedBlock
                              $bg={`${palette.colors.brand[500]}90`}
                              $shifted={schedPhase === 'settled'}
                            >
                              Run · 30m
                            </SaSchedBlock>
                          </SaSchedRow>
                          <SaSchedRow>
                            <SaSchedBlock
                              $bg={palette.colors.gray[700]}
                              $width="88px"
                              $visible={schedPhase !== 'normal'}
                            >
                              New: 10am
                            </SaSchedBlock>
                            <SaSchedBlock
                              $bg={`${palette.colors.gray[600]}`}
                              $visible={schedPhase !== 'normal'}
                            >
                              Urgent call
                            </SaSchedBlock>
                          </SaSchedRow>
                          <SaSchedStatus $phase={schedPhase}>
                            {schedPhase === 'disrupted'
                              ? 'Recalculating…'
                              : schedPhase === 'settled'
                              ? '✓ Schedule rebuilt'
                              : ''}
                          </SaSchedStatus>
                        </SaSchedScene>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>4</SetupCardStepBadge>
                        <SetupCardTitle>Ready for Adaptive Scheduling</SetupCardTitle>
                        <SetupCardSubtext>
                          Your schedule is live — Tiler adapts automatically as your day changes.
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                  </SetupGrid>

                  <SetupSupportNote>
                    Each step is an input to Tiler&rsquo;s scheduling engine — your
                    calendar tells it what&rsquo;s fixed, your preferences tell it how
                    you move, and your time limits tell it when you&rsquo;re free.
                    Together, they give Tiler the full picture it needs to run
                    Adaptive Scheduling: a schedule that adjusts itself when
                    things change.
                  </SetupSupportNote>

                </ExpandableBodyInner>
              </ExpandableBody>
            </ExpandableSection>
          </ExpandableWrapper>

          {/* ── How To Use Tiler ── */}
          <ExpandableWrapper>
            <ExpandableSection>
              <ExpandableHeader
                $open={howToOpen}
                onClick={() => setHowToOpen((o) => !o)}
              >
                <ExpandableTextSide>
                  <SectionBadge>How To Use Tiler</SectionBadge>
                  <SectionTitle>From intent to done. In seconds.</SectionTitle>
                  <SectionSummary>
                    Connect your calendar, add your tiles, and let Tiler build the rest. A
                    step-by-step guide to running your day with Tiler.
                  </SectionSummary>
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
                      <StepLabel>Add Tiles</StepLabel>
                      <StepLabel>AI Plans</StepLabel>
                      <StepLabel>Day Built</StepLabel>
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

          {/* ── Features ── */}
          <ExpandableWrapper>
            <ExpandableSection>
              <ExpandableHeader
                $open={featuresOpen}
                onClick={() => setFeaturesOpen((o) => !o)}
              >
                <ExpandableTextSide>
                  <SectionBadge>Features</SectionBadge>
                  <SectionTitle>Everything Tiler can do.</SectionTitle>
                  <SectionSummary>
                    Every feature is built around one principle: your schedule
                    should work for you, not the other way around.
                  </SectionSummary>
                </ExpandableTextSide>

                <ExpandableHeaderRight>
                  <FeaturesVisual>
                    <FeaturesVisualRow>
                      <FeaturesVisualIcon $bg="#1A2E3A">🧩</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#3D1C2A">🤖</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#1A2840">💬</FeaturesVisualIcon>
                    </FeaturesVisualRow>
                    <FeaturesVisualRow>
                      <FeaturesVisualIcon $bg="#4A1A2A">🗣️</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#1A3320">🚗</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#1A2E3A">📍</FeaturesVisualIcon>
                    </FeaturesVisualRow>
                    <FeaturesVisualRow>
                      <FeaturesVisualIcon $bg="#3D1C2A">🔄</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#1A2040">📅</FeaturesVisualIcon>
                      <FeaturesVisualIcon $bg="#1A2E3A">👥</FeaturesVisualIcon>
                    </FeaturesVisualRow>
                  </FeaturesVisual>
                  <Chevron $open={featuresOpen}>&#9660;</Chevron>
                </ExpandableHeaderRight>
              </ExpandableHeader>

              <ExpandableBody $open={featuresOpen}>
                <ExpandableBodyInner>
                  <FeaturesGrid>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2E3A">🧩</FeatureIconBox>
                      <FeatureName>Adaptive Tiles</FeatureName>
                      <FeatureDesc>
                        The core unit of Tiler. Each tile is a task, event, or
                        habit with a duration — Tiler schedules them
                        intelligently and moves them when your day changes.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">🤖</FeatureIconBox>
                      <FeatureName>AI scheduling assistant</FeatureName>
                      <FeatureDesc>
                        Tiler asks clarifying questions, proposes the best
                        available time, and builds a complete schedule including
                        dependencies — always with your approval first.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2840">💬</FeatureIconBox>
                      <FeatureName>Chat scheduling</FeatureName>
                      <FeatureDesc>
                        Tell Tiler what you need through a natural chat
                        interface. It understands your intent and proposes a
                        plan without you filling in a single form.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#4A1A2A">🗣️</FeatureIconBox>
                      <FeatureName>Natural language input</FeatureName>
                      <FeatureDesc>
                        Describe tasks in plain English — no forms, no
                        dropdowns. Tiler understands context, urgency, duration,
                        and location from how you naturally talk.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3320">🚗</FeatureIconBox>
                      <FeatureName>Auto travel buffers</FeatureName>
                      <FeatureDesc>
                        Tiler automatically inserts realistic travel time
                        between location-based tiles based on your actual
                        distance and transit options. Back-to-back never means
                        late.
                      </FeatureDesc>
                      <FeatureBadge>Unique to Tiler</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2E3A">📍</FeatureIconBox>
                      <FeatureName>Auto locations</FeatureName>
                      <FeatureDesc>
                        Link locations to tiles once and Tiler remembers. Every
                        time that task appears, travel time is calculated
                        automatically from wherever you are.
                      </FeatureDesc>
                      <FeatureBadge>Unique to Tiler</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#2A1A3A">⏰</FeatureIconBox>
                      <FeatureName>Time restrictions</FeatureName>
                      <FeatureDesc>
                        Set the hours you&rsquo;re available and Tiler only
                        schedules within those bounds. Your personal time stays
                        yours — no task bleeds into off-hours unless you allow
                        it.
                      </FeatureDesc>
                      <FeatureBadge>Preferences</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">🔄</FeatureIconBox>
                      <FeatureName>Adaptive rescheduling</FeatureName>
                      <FeatureDesc>
                        When a meeting runs long or a task gets missed, Tiler
                        detects the ripple across your whole day and proposes
                        fixes — instantly, with your approval before changing
                        anything.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2040">📅</FeatureIconBox>
                      <FeatureName>Calendar integration</FeatureName>
                      <FeatureDesc>
                        Connect Google Calendar or Outlook. Tiler reads your
                        existing events and schedules all new tiles around them
                        — no double bookings, ever. Supports multiple calendars.
                      </FeatureDesc>
                      <FeatureBadge>Integration</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3320">📱</FeatureIconBox>
                      <FeatureName>Cross-platform sync</FeatureName>
                      <FeatureDesc>
                        Web, iOS, and Android all stay in real-time sync. Start
                        a task on your laptop and check in on your phone without
                        missing a beat. One schedule, everywhere.
                      </FeatureDesc>
                      <FeatureBadge>Platform</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3A20">🎯</FeatureIconBox>
                      <FeatureName>Habit scheduling</FeatureName>
                      <FeatureDesc>
                        Add recurring habits and Tiler auto-fits them around
                        your day — keeping you consistent with your routines
                        without you having to think about it each morning.
                      </FeatureDesc>
                      <FeatureBadge>Wellness</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">↩️</FeatureIconBox>
                      <FeatureName>Defer &amp; reschedule</FeatureName>
                      <FeatureDesc>
                        Missed a tile? Tiler&rsquo;s Defer feature instantly
                        finds the next best slot and reschedules with one tap.
                        Never lose a task — just push it forward intelligently.
                      </FeatureDesc>
                      <FeatureBadge>Core feature</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2040">🔔</FeatureIconBox>
                      <FeatureName>Smart notifications</FeatureName>
                      <FeatureDesc>
                        Get alerted when it&rsquo;s time to leave for your next
                        tile — with live transit updates if your route changes.
                        Never miss a departure time because you lost track of
                        the clock.
                      </FeatureDesc>
                      <FeatureBadge>Real-time</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2E3A">👥</FeatureIconBox>
                      <FeatureName>TileShare</FeatureName>
                      <FeatureDesc>
                        Share tiles with family or teammates. Assign who handles
                        what. Track completion. Everyone&rsquo;s calendar adapts
                        around shared commitments automatically — no extra apps
                        needed.
                      </FeatureDesc>
                      <FeatureBadge>Collaboration</FeatureBadge>
                    </FeatureCard>

                  </FeaturesGrid>
                </ExpandableBodyInner>
              </ExpandableBody>
            </ExpandableSection>
          </ExpandableWrapper>

          {/* ── Standalone items ── */}
          <ExpandableWrapper>
            <Collapse items={adaptiveItem} />
          </ExpandableWrapper>

        </PageWrapper>
      </Section>
    </>
  );
};

export default Newsletter;
