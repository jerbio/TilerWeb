import { useParams, Navigate } from 'react-router';
import styled from 'styled-components';
import { getArticleBySlug, type Article } from '@/core/common/data/articles';
import ArticleHero from '@/components/articles/ArticleHero';
import ArticleBody from '@/components/articles/ArticleBody';
import ArticleCTA from '@/components/articles/ArticleCTA';
import SEO from '@/core/common/components/SEO';
import { useTranslation } from 'react-i18next';

const SITE_URL = 'https://tiler.app';

/** Convert a human date like "May 8, 2026" to ISO "2026-05-08" (schema.org Date, no TZ shift). */
const toIsoDate = (human: string): string => {
	const d = new Date(human);
	if (Number.isNaN(d.getTime())) return human;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};

/** Turn a build-time asset path (e.g. "/assets/hero-abc.png") into an absolute URL. */
const toAbsoluteUrl = (path?: string): string | undefined =>
	path ? (path.startsWith('http') ? path : `${SITE_URL}${path}`) : undefined;

/** Article (BlogPosting) + BreadcrumbList JSON-LD for rich results and crawler signals. */
const buildArticleStructuredData = (article: Article, t: (key: string) => string) => {
	const url = `${SITE_URL}/articles/${article.slug}`;
	const image = toAbsoluteUrl(article.heroImage ?? article.coverImage);
	const published = toIsoDate(article.date);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BlogPosting',
				'@id': url,
				mainEntityOfPage: { '@type': 'WebPage', '@id': url },
				url,
				headline: article.title,
				description: article.excerpt,
				...(image ? { image } : {}),
				articleSection: article.category,
				datePublished: published,
				dateModified: published,
				author: { '@type': 'Organization', name: article.author, url: SITE_URL },
				publisher: {
					'@type': 'Organization',
					name: 'Tiler',
					url: SITE_URL,
					logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
				},
				isPartOf: { '@type': 'WebSite', name: 'Tiler', url: SITE_URL },
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
					{ '@type': 'ListItem', position: 3, name: article.title, item: url },
				],
			},
		],
	};
};

const PageWrapper = styled.div`
	background-color: black;
	min-height: 100vh;
`;

export default function ArticlePage() {
	const { t } = useTranslation();
	const { slug } = useParams<{ slug: string }>();
	const article = slug ? getArticleBySlug(slug, t) : undefined;

	if (!article) {
		return <Navigate to="/articles" replace />;
	}

	const ogImage = toAbsoluteUrl(article.heroImage ?? article.coverImage);

	return (
		<PageWrapper>
			<SEO
				title={`${article.title} | Tiler`}
				description={article.excerpt}
				canonicalUrl={`/articles/${article.slug}`}
				ogType="article"
				ogImage={ogImage}
				twitterCard="summary_large_image"
				publishedTime={toIsoDate(article.date)}
				authors={[article.author]}
				articleSection={article.category}
				structuredData={buildArticleStructuredData(article, t)}
			/>
			<ArticleHero article={article} />
			<ArticleBody sections={article.sections} />
			<ArticleCTA />
		</PageWrapper>
	);
}
