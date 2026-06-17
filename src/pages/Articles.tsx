import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { articles } from '@/core/common/data/articles';
import ArticleCard from '@/components/articles/ArticleCard';

const PageWrapper = styled.div`
	background-color: black;
	min-height: 100vh;
	padding-bottom: 5rem;
`;

const Hero = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.25rem;
	padding: 4rem 1.5rem 3rem;
	text-align: center;
`;

const CategoryPill = styled.span`
	display: inline-block;
	background-color: ${palette.colors.brand[500]};
	color: white;
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.1em;
	text-transform: uppercase;
	padding: 0.35rem 1.1rem;
	border-radius: 999px;
`;

const HeroTitle = styled.h1`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: clamp(2.25rem, 5vw, 3.5rem);
	font-weight: 800;
	color: white;
	margin: 0;
	line-height: 1.1;
	max-width: 640px;
`;

const HeroSubtitle = styled.p`
	font-size: ${palette.typography.fontSize.base};
	color: rgba(255, 255, 255, 0.55);
	margin: 0;
	max-width: 560px;
	line-height: 1.7;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.75rem;
	max-width: 1080px;
	margin: 0 auto;
	padding: 0 1.5rem;

	@media (min-width: ${palette.screens.md}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: ${palette.screens.lg}) {
		grid-template-columns: repeat(3, 1fr);
	}
`;

export default function Articles() {
	return (
		<PageWrapper>
			<Hero>
				<CategoryPill>ARTICLES</CategoryPill>
				<HeroTitle>Insights for a Better Schedule</HeroTitle>
				<HeroSubtitle>
					Guides, product updates, and ideas on how AI can reshape the way you plan your day.
				</HeroSubtitle>
			</Hero>

			<Grid>
				{articles.map((article) => (
					<ArticleCard key={article.slug} article={article} />
				))}
			</Grid>
		</PageWrapper>
	);
}
