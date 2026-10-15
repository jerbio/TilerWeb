import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@/core/theme/ThemeProvider';
import { RGB } from '@/core/util/colors';
import { iconSurface } from '@/core/util/colorSurface';

type DetailHeaderCardProps = {
	/** Glyph rendered inside the accent icon box. */
	icon: React.ReactNode;
	/** Base colour the icon box's background + glyph are derived from. */
	accent: RGB;
	title: string;
	subtitle: string;
	/** Right-aligned slot in the title row (actions / due pill). */
	headerRight?: React.ReactNode;
	/** Body rendered below the title-row divider (description, progress, …). */
	children?: React.ReactNode;
};

/**
 * Shared chrome for the tileshare detail headers: an outlined (no-fill) card
 * with an accent icon box, title + subtitle, a right-hand action slot, and a
 * body area below a full-bleed divider. The icon box's background and glyph are
 * derived from a single `accent` colour so light and dark render differently.
 *
 * `MultiTileshareHeader` and `SingleTileshareHeader` compose this, using the
 * exported {@link HeaderSection} / {@link HeaderDivider} for their body content.
 */
const DetailHeaderCard: React.FC<DetailHeaderCardProps> = ({
	icon,
	accent,
	title,
	subtitle,
	headerRight,
	children,
}) => {
	const { isDarkMode } = useTheme();
	const surface = iconSurface(accent, isDarkMode);

	return (
		<Card $darkmode={isDarkMode}>
			<TopRow>
				<Left>
					<IconBox $bg={surface.background} $fg={surface.foreground}>
						{icon}
					</IconBox>
					<TitleBlock>
						<Title>{title}</Title>
						<Subtitle>{subtitle}</Subtitle>
					</TitleBlock>
				</Left>
				{headerRight && <Right>{headerRight}</Right>}
			</TopRow>
			<HeaderDivider />
			{children}
		</Card>
	);
};

const Card = styled.div<{ $darkmode: boolean }>`
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.xLarge};
	overflow: hidden;
	background-color: ${({ theme }) => theme.colors.background.card};
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.025);
`;

/** Padded body section. Full-bleed dividers sit between sections, not inside. */
export const HeaderSection = styled.div`
	padding: 1.25rem 1.5rem;
	@media (max-width: 600px) {
		padding: 20px;
	}
`;

/** Edge-to-edge divider connecting to the card outline. */
export const HeaderDivider = styled.hr`
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border.default};
	margin: 0;
`;

const TopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 24px;
	flex-wrap: wrap;
	@media (max-width: 600px) {
		padding: 20px;
	}
`;

const Left = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	flex: 1;
	min-width: 0;
`;

const Right = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-shrink: 0;
	flex-wrap: wrap;
	max-width: 100%;
`;

const IconBox = styled.div<{ $bg: string; $fg: string }>`
	width: 48px;
	height: 48px;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	background-color: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`;

const TitleBlock = styled.div`
	min-width: 0;
`;

const Title = styled.h1`
	margin: 0;
	font-size: clamp(22px, 2vw, 28px);
	font-weight: 650;
	letter-spacing: -0.8px;
	line-height: 1.25;
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	color: ${({ theme }) => theme.colors.text.primary};
	overflow-wrap: anywhere;
`;

const Subtitle = styled.p`
	margin: 6px 0 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

export default DetailHeaderCard;
