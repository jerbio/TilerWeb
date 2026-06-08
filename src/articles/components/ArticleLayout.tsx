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
import palette from '@/core/theme/palette';
import type { ArticleMeta } from '../articles.config';
import Breadcrumbs from './Breadcrumbs';

interface ArticleLayoutProps {
	article: ArticleMeta;
	children: React.ReactNode;
}

const SITE_URL = 'https://tiler.app';

// ─── Styled ──────────────────────────────────────────────────────────────────

const Meta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem 1.25rem;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.8125rem;
	color: ${palette.colors.gray[500]};
	margin-top: 0.5rem;

	span {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
`;

const HeroImage = styled.img`
	width: 100%;
	max-width: 900px;
	border-radius: ${palette.borderRadius.large};
	box-shadow:
		0 4px 24px rgba(0, 0, 0, 0.4),
		0 24px 64px rgba(0, 0, 0, 0.3);
	display: block;
	margin: 0 auto;
`;

const formatDate = (iso: string): string => {
	try {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		return iso;
	}
};

// ─── Structured Data Builder ─────────────────────────────────────────────────

const buildStructuredData = (article: ArticleMeta, t: (k: string) => string): object => {
	const articleUrl = `${SITE_URL}/articles/${article.slug}`;
	const imageUrl = article.heroImage.startsWith('http')
		? article.heroImage
		: `${SITE_URL}${article.heroImage}`;

	const articleNode = {
		'@type': article.schemaType,
		headline: t(`articles.posts.${article.i18nKey}.title`),
		description: t(`articles.posts.${article.i18nKey}.seo.description`),
		image: imageUrl,
		datePublished: article.publishedAt,
		dateModified: article.updatedAt,
		author: { '@type': 'Organization', name: article.author, url: SITE_URL },
		publisher: {
			'@type': 'Organization',
			name: 'Tiler',
			logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
		},
		mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
		url: articleUrl,
	};

	const breadcrumbNode = {
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
			{ '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE_URL}/articles` },
			{
				'@type': 'ListItem',
				position: 3,
				name: t(`articles.posts.${article.i18nKey}.title`),
				item: articleUrl,
			},
		],
	};

	return {
		'@context': 'https://schema.org',
		'@graph': [articleNode, breadcrumbNode, ...(article.extraSchema ?? [])],
	};
};

// ─── Component ───────────────────────────────────────────────────────────────

const ArticleLayout: React.FC<ArticleLayoutProps> = ({ article, children }) => {
	const { t } = useTranslation();
	const base = `articles.posts.${article.i18nKey}`;

	return (
		<>
			<SEO
				title={t(`${base}.seo.title`)}
				description={t(`${base}.seo.description`)}
				keywords={t(`${base}.seo.keywords`)}
				canonicalUrl={`/articles/${article.slug}`}
				ogType="article"
				ogImage={
					article.ogImage ??
					(article.heroImage.startsWith('http')
						? article.heroImage
						: `${SITE_URL}${article.heroImage}`)
				}
				twitterCard="summary_large_image"
				publishedTime={article.publishedAt}
				modifiedTime={article.updatedAt}
				authors={[article.author]}
				articleSection={article.category}
				articleTags={t(`${base}.seo.keywords`)
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)}
				structuredData={buildStructuredData(article, t)}
			/>

			<Section>
				<BackgroundBlur />
				<PageWrapper>
					<Breadcrumbs
						items={[
							{ label: t('articles.breadcrumbs.home'), href: '/' },
							{ label: t('articles.breadcrumbs.articles'), href: '/articles' },
							{ label: t(`${base}.title`) },
						]}
					/>

					<Hero>
						<Badge>{article.category}</Badge>
						<HeroTitle>{t(`${base}.title`)}</HeroTitle>
						<HeroSubtitle>{t(`${base}.subtitle`)}</HeroSubtitle>
						<Meta>
							<span>{article.author}</span>
							<span aria-hidden="true">·</span>
							<span>
								<time dateTime={article.publishedAt}>
									{formatDate(article.publishedAt)}
								</time>
							</span>
							<span aria-hidden="true">·</span>
							<span>
								{article.readMinutes} {t('articles.minRead')}
							</span>
						</Meta>
						<HeroImage src={article.heroImage} alt={t(`${base}.title`)} />
					</Hero>

					{children}
				</PageWrapper>
			</Section>
		</>
	);
};

export default ArticleLayout;
