import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import SEO from '@/core/common/components/SEO';
import Section from '@/components/layout/section';
import {
	PageWrapper,
	Hero,
	Badge,
	HeroTitle,
	HeroSubtitle,
	BackgroundBlur,
} from '@/components/discover/shared';
import { ARTICLES } from '@/articles/articles.config';
import ArticleCard from '@/articles/components/ArticleCard';

const SITE_URL = 'https://tiler.app';

const Grid = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
	margin-top: 1rem;
`;

const buildStructuredData = (t: (k: string) => string): object => ({
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
			itemListElement: ARTICLES.map((a, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${SITE_URL}/articles/${a.slug}`,
				name: t(`articles.posts.${a.i18nKey}.title`),
			})),
		},
		{
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Articles',
					item: `${SITE_URL}/articles`,
				},
			],
		},
	],
});

const Articles: React.FC = () => {
	const { t } = useTranslation();

	return (
		<>
			<SEO
				title={t('articles.index.seo.title')}
				description={t('articles.index.seo.description')}
				keywords={t('articles.index.seo.keywords')}
				canonicalUrl="/articles"
				ogType="website"
				twitterCard="summary_large_image"
				structuredData={buildStructuredData(t)}
			/>

			<Section>
				<BackgroundBlur />
				<PageWrapper>
					<Hero>
						<Badge>{t('articles.index.hero.badge')}</Badge>
						<HeroTitle>{t('articles.index.hero.title')}</HeroTitle>
						<HeroSubtitle>{t('articles.index.hero.subtitle')}</HeroSubtitle>
					</Hero>

					<Grid>
						{ARTICLES.map((a) => (
							<ArticleCard key={a.slug} article={a} />
						))}
					</Grid>
				</PageWrapper>
			</Section>
		</>
	);
};

export default Articles;
