import React, { useState, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';
import Collapse from '@/core/common/components/collapse';

// ─── Data arrays moved inside component for i18n (see useMemo blocks) ────────

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
`;

const FeaturesVisualIcon = styled.div<{ $bg: string }>`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
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
  const { t } = useTranslation();
  const [whatIsOpen, setWhatIsOpen] = useState(false);
  const [setUpOpen, setSetUpOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // ── Set Up Tiler animation state ──────────────────────────────────────────
  const [signupPhase, setSignupPhase] = useState<'idle' | 'creating' | 'done'>('idle');
  const [calStatus, setCalStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [transitMode, setTransitMode] = useState<'drive' | 'transit' | 'walk'>('drive');
  const [schedPhase, setSchedPhase] = useState<'normal' | 'disrupted' | 'settled'>('normal');

  // ─── How-To Data (i18n) ──────────────────────────────────────────────────
  const items = useMemo(() => [
    {
      title: t('discover.howToUseTiler.items.setUpTiler.title'),
      media: "/gifs/set-up-tiler.gif",
      body: t('discover.howToUseTiler.items.setUpTiler.body'),
    },
    {
      title: t('discover.howToUseTiler.items.createBlock.title'),
      media: "/gifs/how-to-create-a-block.gif",
      body: t('discover.howToUseTiler.items.createBlock.body'),
    },
    {
      title: t('discover.howToUseTiler.items.flexibleTiles.title'),
      media: "/gifs/creating-flexible-tiles.gif",
      body: t('discover.howToUseTiler.items.flexibleTiles.body'),
    },
    {
      title: t('discover.howToUseTiler.items.adaptiveScheduling.title'),
      body: t('discover.howToUseTiler.items.adaptiveScheduling.body'),
    },
    {
      title: t('discover.howToUseTiler.items.updateTile.title'),
      media: "/gifs/how-to-update-a-tile.gif",
      body: t('discover.howToUseTiler.items.updateTile.body'),
    },
    {
      title: t('discover.howToUseTiler.items.connectCalendar.title'),
      media: "/gifs/connect-a-calendar.gif",
      body: t('discover.howToUseTiler.items.connectCalendar.body'),
    },
    {
      title: t('discover.howToUseTiler.items.showRoute.title'),
      body: t('discover.howToUseTiler.items.showRoute.body'),
    },
    {
      title: t('discover.howToUseTiler.items.tileShare.title'),
      body: t('discover.howToUseTiler.items.tileShare.body'),
    },
    {
      title: t('discover.howToUseTiler.items.travelTime.title'),
      media: "/gifs/travel-time-and-route.gif",
      body: t('discover.howToUseTiler.items.travelTime.body'),
    },
    {
      title: t('discover.howToUseTiler.items.navigation.title'),
      body: t('discover.howToUseTiler.items.navigation.body'),
    },
  ], [t]);

  // ─── What Is Tiler — Sub-item data (i18n) ─────────────────────────────────
  const coreBlocks = useMemo(() => [
    {
      emoji: "\uD83E\uDDE9",
      label: t('discover.whatIsTiler.subItems.coreBlocks.tiles.label'),
      title: t('discover.whatIsTiler.subItems.coreBlocks.tiles.title'),
      desc: t('discover.whatIsTiler.subItems.coreBlocks.tiles.desc'),
    },
    {
      emoji: "\uD83D\uDCCC",
      label: t('discover.whatIsTiler.subItems.coreBlocks.blocks.label'),
      title: t('discover.whatIsTiler.subItems.coreBlocks.blocks.title'),
      desc: t('discover.whatIsTiler.subItems.coreBlocks.blocks.desc'),
    },
    {
      emoji: "\uD83D\uDDFA\uFE0F",
      label: t('discover.whatIsTiler.subItems.coreBlocks.route.label'),
      title: t('discover.whatIsTiler.subItems.coreBlocks.route.title'),
      desc: t('discover.whatIsTiler.subItems.coreBlocks.route.desc'),
    },
    {
      emoji: "\uD83D\uDC65",
      label: t('discover.whatIsTiler.subItems.coreBlocks.tileShare.label'),
      title: t('discover.whatIsTiler.subItems.coreBlocks.tileShare.title'),
      desc: t('discover.whatIsTiler.subItems.coreBlocks.tileShare.desc'),
    },
  ], [t]);

  const comparisonRows = useMemo(() => [
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row1.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row1.right') },
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row2.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row2.right') },
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row3.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row3.right') },
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row4.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row4.right') },
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row5.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row5.right') },
    { left: t('discover.whatIsTiler.subItems.comparison.rows.row6.left'), right: t('discover.whatIsTiler.subItems.comparison.rows.row6.right') },
  ], [t]);

  useEffect(() => {
    if (!setUpOpen) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Card 1: account creation button states (6s loop)
    const signupCycle = () => {
      setSignupPhase('idle');
      timers.push(setTimeout(() => setSignupPhase('creating'), 2000));
      timers.push(setTimeout(() => setSignupPhase('done'), 3200));
      timers.push(setTimeout(signupCycle, 6000));
    };
    signupCycle();

    // Card 2: calendar connect sequence (6.5s loop)
    const calCycle = () => {
      setCalStatus('idle');
      timers.push(setTimeout(() => setCalStatus('connecting'), 2000));
      timers.push(setTimeout(() => setCalStatus('connected'), 3200));
      timers.push(setTimeout(calCycle, 6500));
    };
    calCycle();

    // Card 3: transit mode cycling (6s loop)
    const transitCycle = () => {
      setTransitMode('drive');
      timers.push(setTimeout(() => setTransitMode('transit'), 2000));
      timers.push(setTimeout(() => setTransitMode('walk'), 3800));
      timers.push(setTimeout(transitCycle, 6000));
    };
    transitCycle();

    // Card 4: adaptive schedule rearrange (7s loop)
    const schedCycle = () => {
      setSchedPhase('normal');
      timers.push(setTimeout(() => setSchedPhase('disrupted'), 2000));
      timers.push(setTimeout(() => setSchedPhase('settled'), 3500));
      timers.push(setTimeout(schedCycle, 7000));
    };
    schedCycle();

    return () => timers.forEach(clearTimeout);
  }, [setUpOpen]);

  // ── What Is Tiler sub-items ──────────────────────────────────────────────
  const whatIsSubItems = [
    {
      title: t('discover.whatIsTiler.subItems.intro.title'),
      content: (
        <SubBodyText>
          {t('discover.whatIsTiler.subItems.intro.body')}
        </SubBodyText>
      ),
    },
    {
      title: t('discover.whatIsTiler.subItems.coreBlocks.title'),
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
      title: t('discover.whatIsTiler.subItems.comparison.title'),
      content: (
        <ComparisonTable>
          <ComparisonHeader>
            <ComparisonHeaderCell $side="left">{t('discover.whatIsTiler.subItems.comparison.headerLeft')}</ComparisonHeaderCell>
            <ComparisonHeaderCell $side="right">{t('discover.whatIsTiler.subItems.comparison.headerRight')}</ComparisonHeaderCell>
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
    t('discover.howToUseTiler.items.connectCalendar.title'),
    t('discover.howToUseTiler.items.createBlock.title'),
    t('discover.howToUseTiler.items.flexibleTiles.title'),
    t('discover.howToUseTiler.items.updateTile.title'),
    t('discover.howToUseTiler.items.travelTime.title'),
  ];

  const adaptiveItem = (() => {
    const item = items.find((i) => i.title === t('discover.howToUseTiler.items.adaptiveScheduling.title'))!;
    return [{
      title: item.title,
      content: (
        <ContentRow>
          <MediaPlaceholder>
            {item.media ? (
              <MediaImage src={item.media} alt={item.title} />
            ) : (
              <MediaPlaceholderText>{t('discover.howToUseTiler.mediaPlaceholder')}</MediaPlaceholderText>
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
            <MediaPlaceholderText>{t('discover.howToUseTiler.mediaPlaceholder')}</MediaPlaceholderText>
          )}
        </MediaPlaceholder>
        <BodyText>{item.body}</BodyText>
      </ContentRow>
    ),
  }));

  return (
    <>
      <SEO
        title={t('discover.seo.title')}
        description={t('discover.seo.description')}
        canonicalUrl="/newsletter"
      />
      <Section>
        <BackgroundBlur />
        <PageWrapper>
          <Hero>
            <Badge>{t('discover.hero.badge')}</Badge>
            <HeroTitle>{t('discover.hero.title')}</HeroTitle>
            <HeroSubtitle>
              {t('discover.hero.subtitle')}
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
                  <SectionBadge>{t('discover.whatIsTiler.badge')}</SectionBadge>
                  <SectionTitle>{t('discover.whatIsTiler.title')}</SectionTitle>
                  <SectionSummary>
                    {t('discover.whatIsTiler.summary')}
                  </SectionSummary>
                </ExpandableTextSide>

                <ExpandableHeaderRight>
                  <WhatIsTilerVisual>
                    <MockTile $color="brand">
                      <MockTileDot $color="brand" />
                      {t('discover.whatIsTiler.mockTiles.gym')}
                    </MockTile>
                    <MockTile $color="orange">
                      <MockTileDot $color="orange" />
                      {t('discover.whatIsTiler.mockTiles.travel')}
                    </MockTile>
                    <MockTile $color="teal">
                      <MockTileDot $color="teal" />
                      {t('discover.whatIsTiler.mockTiles.clientCall')}
                    </MockTile>
                    <MockTile $color="brand">
                      <MockTileDot $color="brand" />
                      {t('discover.whatIsTiler.mockTiles.groceries')}
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
                  <SectionBadge>{t('discover.setUpTiler.badge')}</SectionBadge>
                  <SectionTitle>{t('discover.setUpTiler.title')}</SectionTitle>
                  <SectionSummary>
                    {t('discover.setUpTiler.summary')}
                  </SectionSummary>
                </ExpandableTextSide>

                <ExpandableHeaderRight>
                  <SetUpVisual>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>{t('discover.setUpTiler.heroLabels.createAccount')}</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>{t('discover.setUpTiler.heroLabels.connectCalendar')}</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $done>✓</SetupDot>
                      <SetupRowLabel $done>{t('discover.setUpTiler.heroLabels.setUpPreferences')}</SetupRowLabel>
                    </SetupRow>
                    <SetupRow>
                      <SetupDot $active>◎</SetupDot>
                      <SetupRowLabel>{t('discover.setUpTiler.heroLabels.adaptiveScheduling')}</SetupRowLabel>
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
                          <SaSignupInput>{t('discover.setUpTiler.cards.card1.animation.emailPlaceholder')}</SaSignupInput>
                          <SaSignupBtn $phase={signupPhase}>
                            {signupPhase === 'idle'
                              ? t('discover.setUpTiler.cards.card1.animation.btnIdle')
                              : signupPhase === 'creating'
                              ? t('discover.setUpTiler.cards.card1.animation.btnCreating')
                              : t('discover.setUpTiler.cards.card1.animation.btnDone')}
                          </SaSignupBtn>
                        </SaSignupScene>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>1</SetupCardStepBadge>
                        <SetupCardTitle>{t('discover.setUpTiler.cards.card1.title')}</SetupCardTitle>
                        <SetupCardSubtext>
                          {t('discover.setUpTiler.cards.card1.subtext')}
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 2: Connect your calendar (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaCalRow>
                          <SaCalIcon $connected={calStatus !== 'idle'}>
                            <SaCalIconTop />
                            <SaCalIconDate>{t('discover.setUpTiler.cards.card2.animation.calendarDate')}</SaCalIconDate>
                          </SaCalIcon>
                          <SaCalInfo>
                            <SaCalName>{t('discover.setUpTiler.cards.card2.animation.calendarName')}</SaCalName>
                            <SaCalStatus $ok={calStatus !== 'idle'}>
                              {calStatus === 'idle'
                                ? t('discover.setUpTiler.cards.card2.animation.tapToConnect')
                                : calStatus === 'connecting'
                                ? t('discover.setUpTiler.cards.card2.animation.connecting')
                                : t('discover.setUpTiler.cards.card2.animation.connected')}
                            </SaCalStatus>
                          </SaCalInfo>
                          <SaCalCheck $show={calStatus === 'connected'}>✓</SaCalCheck>
                        </SaCalRow>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>2</SetupCardStepBadge>
                        <SetupCardTitle>{t('discover.setUpTiler.cards.card2.title')}</SetupCardTitle>
                        <SetupCardSubtext>
                          {t('discover.setUpTiler.cards.card2.subtext')}
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 3: Set up your preferences (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaPrefsScene>
                          <SaPrefRow>
                            <SaPrefLabel>{t('discover.setUpTiler.cards.card3.animation.transitModeLabel')}</SaPrefLabel>
                            <SaTransitRow>
                              <SaTransitOption $active={transitMode === 'drive'}>
                                {t('discover.setUpTiler.cards.card3.animation.drive')}
                              </SaTransitOption>
                              <SaTransitOption $active={transitMode === 'transit'}>
                                {t('discover.setUpTiler.cards.card3.animation.transit')}
                              </SaTransitOption>
                              <SaTransitOption $active={transitMode === 'walk'}>
                                {t('discover.setUpTiler.cards.card3.animation.walk')}
                              </SaTransitOption>
                            </SaTransitRow>
                          </SaPrefRow>
                          <SaPrefRow>
                            <SaPrefLabel>{t('discover.setUpTiler.cards.card3.animation.workHoursLabel')}</SaPrefLabel>
                            <SaTimeRange>
                              <span>{t('discover.setUpTiler.cards.card3.animation.workStart')}</span>
                              <span>→</span>
                              <span>{t('discover.setUpTiler.cards.card3.animation.workEnd')}</span>
                            </SaTimeRange>
                          </SaPrefRow>
                        </SaPrefsScene>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>3</SetupCardStepBadge>
                        <SetupCardTitle>{t('discover.setUpTiler.cards.card3.title')}</SetupCardTitle>
                        <SetupCardSubtext>
                          {t('discover.setUpTiler.cards.card3.subtext')}
                        </SetupCardSubtext>
                      </SetupBody>
                    </SetupCard>

                    {/* ── Card 4: Ready for Adaptive Scheduling (JS animation) ── */}
                    <SetupCard>
                      <SetupAnim>
                        <SaSchedScene>
                          <SaSchedTimeLabel>{t('discover.setUpTiler.cards.card4.animation.scheduleLabel')}</SaSchedTimeLabel>
                          <SaSchedRow>
                            <SaSchedBlock
                              $bg={palette.colors.gray[700]}
                              $width="88px"
                            >
                              {t('discover.setUpTiler.cards.card4.animation.meeting')}
                            </SaSchedBlock>
                            <SaSchedBlock
                              $bg={`${palette.colors.brand[500]}90`}
                              $shifted={schedPhase === 'settled'}
                            >
                              {t('discover.setUpTiler.cards.card4.animation.run')}
                            </SaSchedBlock>
                          </SaSchedRow>
                          <SaSchedRow>
                            <SaSchedBlock
                              $bg={palette.colors.gray[700]}
                              $width="88px"
                              $visible={schedPhase !== 'normal'}
                            >
                              {t('discover.setUpTiler.cards.card4.animation.newTime')}
                            </SaSchedBlock>
                            <SaSchedBlock
                              $bg={`${palette.colors.gray[600]}`}
                              $visible={schedPhase !== 'normal'}
                            >
                              {t('discover.setUpTiler.cards.card4.animation.urgentCall')}
                            </SaSchedBlock>
                          </SaSchedRow>
                          <SaSchedStatus $phase={schedPhase}>
                            {schedPhase === 'disrupted'
                              ? t('discover.setUpTiler.cards.card4.animation.recalculating')
                              : schedPhase === 'settled'
                              ? t('discover.setUpTiler.cards.card4.animation.rebuilt')
                              : ''}
                          </SaSchedStatus>
                        </SaSchedScene>
                      </SetupAnim>
                      <SetupBody>
                        <SetupCardStepBadge>4</SetupCardStepBadge>
                        <SetupCardTitle>{t('discover.setUpTiler.cards.card4.title')}</SetupCardTitle>
                        <SetupCardSubtext>
                          {t('discover.setUpTiler.cards.card4.subtext')}
                        </SetupCardSubtext>
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

          {/* ── How To Use Tiler ── */}
          <ExpandableWrapper>
            <ExpandableSection>
              <ExpandableHeader
                $open={howToOpen}
                onClick={() => setHowToOpen((o) => !o)}
              >
                <ExpandableTextSide>
                  <SectionBadge>{t('discover.howToUseTiler.badge')}</SectionBadge>
                  <SectionTitle>{t('discover.howToUseTiler.title')}</SectionTitle>
                  <SectionSummary>
                    {t('discover.howToUseTiler.summary')}
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
                      <StepLabel>{t('discover.howToUseTiler.heroLabels.addTiles')}</StepLabel>
                      <StepLabel>{t('discover.howToUseTiler.heroLabels.aiPlans')}</StepLabel>
                      <StepLabel>{t('discover.howToUseTiler.heroLabels.dayBuilt')}</StepLabel>
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
                  <SectionBadge>{t('discover.features.badge')}</SectionBadge>
                  <SectionTitle>{t('discover.features.title')}</SectionTitle>
                  <SectionSummary>
                    {t('discover.features.summary')}
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
                      <FeatureName>{t('discover.features.cards.adaptiveTiles.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.adaptiveTiles.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.adaptiveTiles.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">🤖</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.aiAssistant.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.aiAssistant.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.aiAssistant.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2840">💬</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.chatScheduling.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.chatScheduling.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.chatScheduling.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#4A1A2A">🗣️</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.naturalLanguage.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.naturalLanguage.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.naturalLanguage.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3320">🚗</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.autoTravel.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.autoTravel.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.autoTravel.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2E3A">📍</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.autoLocations.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.autoLocations.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.autoLocations.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#2A1A3A">⏰</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.timeRestrictions.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.timeRestrictions.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.timeRestrictions.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">🔄</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.adaptiveRescheduling.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.adaptiveRescheduling.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.adaptiveRescheduling.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2040">📅</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.calendarIntegration.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.calendarIntegration.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.calendarIntegration.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3320">📱</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.crossPlatform.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.crossPlatform.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.crossPlatform.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A3A20">🎯</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.habitScheduling.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.habitScheduling.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.habitScheduling.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#3D1C2A">↩️</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.deferReschedule.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.deferReschedule.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.deferReschedule.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2040">🔔</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.smartNotifications.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.smartNotifications.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.smartNotifications.badge')}</FeatureBadge>
                    </FeatureCard>

                    <FeatureCard>
                      <FeatureIconBox $bg="#1A2E3A">👥</FeatureIconBox>
                      <FeatureName>{t('discover.features.cards.tileShareFeature.name')}</FeatureName>
                      <FeatureDesc>{t('discover.features.cards.tileShareFeature.desc')}</FeatureDesc>
                      <FeatureBadge>{t('discover.features.cards.tileShareFeature.badge')}</FeatureBadge>
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
