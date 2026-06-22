import { useParams, Navigate } from 'react-router';
import styled from 'styled-components';
import { getArticleBySlug } from '@/core/common/data/articles';
import ArticleHero from '@/components/articles/ArticleHero';
import ArticleBody from '@/components/articles/ArticleBody';
import ArticleCTA from '@/components/articles/ArticleCTA';

const PageWrapper = styled.div`
	background-color: black;
	min-height: 100vh;
`;

export default function ArticlePage() {
	const { slug } = useParams<{ slug: string }>();
	const article = slug ? getArticleBySlug(slug) : undefined;

	if (!article) {
		return <Navigate to="/articles" replace />;
	}

	return (
		<PageWrapper>
			<ArticleHero article={article} />
			<ArticleBody sections={article.sections} />
			<ArticleCTA />
		</PageWrapper>
	);
}
