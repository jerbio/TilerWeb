import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';

// ─── Page Layout ─────────────────────────────────────────────────────────────

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 4rem 1.5rem 6rem;
  gap: 3rem;
`;

export const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 680px;
`;

export const Badge = styled.span`
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

export const HeroTitle = styled.h1`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: ${palette.typography.fontWeight.bold};
  color: ${palette.colors.gray[100]};
  margin: 0;
  line-height: 1.15;
`;

export const HeroSubtitle = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[400]};
  margin: 0;
  line-height: 1.7;
`;

export const BackgroundBlur = styled.div`
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

// ─── Content Row (media + text) ──────────────────────────────────────────────

export const ContentRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: flex-start;
  padding-bottom: 0.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const MediaPlaceholder = styled.div`
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

export const MediaImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${palette.borderRadius.medium};
`;

export const MediaPlaceholderText = styled.span`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.xs};
  color: ${palette.colors.gray[600]};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const BodyText = styled.span`
  flex: 1;
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.base};
  color: ${palette.colors.gray[500]};
  line-height: 1.6;
`;

// ─── Expandable Section ──────────────────────────────────────────────────────

export const ExpandableWrapper = styled.div`
  width: 100%;
  max-width: 860px;
`;

export const ExpandableSection = styled.div`
  border: 1px solid ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.large};
  background: ${palette.colors.gray[900]}80;
  overflow: hidden;
`;

export const ExpandableHeader = styled.button<{ $open: boolean }>`
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

export const ExpandableTextSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SectionBadge = styled.span`
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

export const SectionTitle = styled.h2`
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

export const SectionSummary = styled.p`
  font-family: ${palette.typography.fontFamily.inter};
  font-size: ${palette.typography.fontSize.sm};
  color: ${palette.colors.gray[500]};
  line-height: 1.65;
  margin: 0;
`;

export const ExpandableHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 0.75rem;
  }
`;

export const chevronBounce = css`
  @keyframes chevronBounce {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    50%       { transform: rotate(0deg) translateY(4px); }
  }
`;

export const Chevron = styled.span<{ $open: boolean }>`
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

export const ExpandableBody = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.35s ease-in-out;
`;

export const ExpandableBodyInner = styled.div`
  overflow: hidden;
`;

export const SubCollapseWrapper = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid ${palette.colors.gray[800]};
`;
