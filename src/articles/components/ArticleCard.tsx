import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import type { ArticleMeta } from '../articles.config';

interface ArticleCardProps {
	article: ArticleMeta;
}

const Card = styled(Link)`
	display: flex;
	flex-direction: column;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.large};
	overflow: hidden;
	text-decoration: none;
	color: inherit;
	transition:
		transform 0.2s ease,
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:hover,
	&:focus-visible {
		transform: translateY(-4px);
		border-color: ${palette.colors.brand[500]};
		box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
		outline: none;
	}
`;

const Thumb = styled.div<{ $src: string }>`
	width: 100%;
	aspect-ratio: 16 / 9;
	background-image: url(${(p) => p.$src});
	background-size: cover;
	background-position: center;
	background-color: ${palette.colors.gray[800]};
`;

const Body = styled.div`
	padding: 1.25rem 1.25rem 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.625rem;
	flex: 1;
`;

const CategoryBadge = styled.span`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.6875rem;
	font-weight: ${palette.typography.fontWeight.semibold};
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: ${palette.colors.brand[300]};
	align-self: flex-start;
`;

const Title = styled.h3`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 1.125rem;
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.gray[100]};
	margin: 0;
	line-height: 1.35;
`;

const Excerpt = styled.p`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.875rem;
	line-height: 1.55;
	color: ${palette.colors.gray[400]};
	margin: 0;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const Footer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: auto;
	padding-top: 0.5rem;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: 0.75rem;
	color: ${palette.colors.gray[500]};
`;

const ReadMore = styled.span`
	color: ${palette.colors.brand[400]};
	font-weight: ${palette.typography.fontWeight.semibold};
`;

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
	const { t } = useTranslation();
	const base = `articles.posts.${article.i18nKey}`;
	const title = t(`${base}.title`);

	return (
		<Card to={`/articles/${article.slug}`} aria-label={title}>
			<Thumb $src={article.heroImage} role="img" aria-label={title} />
			<Body>
				<CategoryBadge>{article.category}</CategoryBadge>
				<Title>{title}</Title>
				<Excerpt>{t(`${base}.excerpt`)}</Excerpt>
				<Footer>
					<span>
						{article.readMinutes} {t('articles.minRead')}
					</span>
					<ReadMore>{t('articles.readArticle')} →</ReadMore>
				</Footer>
			</Body>
		</Card>
	);
};

export default ArticleCard;
