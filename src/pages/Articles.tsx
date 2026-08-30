import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { getArticles } from '@/core/common/data/articles';
import ArticleCard from '@/components/articles/ArticleCard';
import SEO from '@/core/common/components/SEO';
import { useTranslation } from 'react-i18next';

const SITE_URL = 'https://tiler.app';

const buildStructuredData = (
	articles: ReturnType<typeof getArticles>,
	t: (key: string) => string
) => ({
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'CollectionPage',
			'@id': `${SITE_URL}/articles`,
			url: `${SITE_URL}/articles`,
			name: t('articles.index.seo.title'),
			description: t('articles.index.seo.description'),
			isPartOf: { '@type': 'WebSite', name: 'Tiler', url: SITE_URL },
		},
		{
			'@type': 'ItemList',
			itemListElement: articles.map((a, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${SITE_URL}/articles/${a.slug}`,
				name: a.title,
			})),
		},
		{
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: t('articles.breadcrumbs.home'),
					item: SITE_URL,
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: t('articles.breadcrumbs.articles'),
					item: `${SITE_URL}/articles`,
				},
			],
		},
	],
});

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
	const { t } = useTranslation();
	const articles = getArticles(t);

	return (
		<PageWrapper>
			<SEO
				title={t('articles.index.seo.title')}
				description={t('articles.index.seo.description')}
				keywords={t('articles.index.seo.keywords')}
				canonicalUrl="/articles"
				ogType="website"
				twitterCard="summary_large_image"
				structuredData={buildStructuredData(articles, t)}
			/>
			<Hero>
				<CategoryPill>{t('articles.index.hero.badge')}</CategoryPill>
				<HeroTitle>{t('articles.index.hero.title')}</HeroTitle>
				<HeroSubtitle>{t('articles.index.hero.subtitle')}</HeroSubtitle>
			</Hero>

			<Grid>
				{articles.map((article) => (
					<ArticleCard key={article.slug} article={article} />
				))}
			</Grid>
		</PageWrapper>
	);
}
