import { Link } from 'react-router';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { Article } from '@/core/common/data/articles';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 1.5rem 0;
`;

const Breadcrumb = styled.nav`
	align-self: flex-start;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: ${palette.typography.fontSize.sm};
	color: rgba(255, 255, 255, 0.45);
`;

const BreadcrumbLink = styled(Link)`
	color: rgba(255, 255, 255, 0.45);
	text-decoration: none;

	&:hover {
		color: white;
	}
`;

const BreadcrumbSep = styled.span`
	color: rgba(255, 255, 255, 0.25);
`;

const BreadcrumbCurrent = styled.span`
	color: rgba(255, 255, 255, 0.7);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 260px;
`;

const CategoryPill = styled.span`
	display: inline-block;
	background-color: ${palette.colors.brand[500]};
	color: white;
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	letter-spacing: 0.1em;
	text-transform: uppercase;
	padding: 0.35rem 1rem;
	border-radius: 999px;
`;

const HeroTitle = styled.h1`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: clamp(2rem, 5vw, 3.25rem);
	font-weight: 800;
	color: white;
	text-align: center;
	line-height: 1.1;
	margin: 0;
`;

const Subtitle = styled.p`
	font-size: ${palette.typography.fontSize.lg};
	color: rgba(255, 255, 255, 0.65);
	text-align: center;
	margin: 0;
	max-width: 640px;
	line-height: 1.6;
`;

const Meta = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: ${palette.typography.fontSize.sm};
	color: rgba(255, 255, 255, 0.4);
`;

const MetaDot = styled.span`
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.3);
	display: inline-block;
`;

const CoverImage = styled.img`
	width: 100%;
	max-width: 860px;
	border-radius: ${palette.borderRadius.large};
	object-fit: cover;
	max-height: 480px;
	margin-top: 1rem;
`;

interface ArticleHeroProps {
	article: Article;
}

export default function ArticleHero({ article }: ArticleHeroProps) {
	return (
		<Wrapper>
			<Breadcrumb>
				<BreadcrumbLink to="/">Home</BreadcrumbLink>
				<BreadcrumbSep>/</BreadcrumbSep>
				<BreadcrumbLink to="/articles">Articles</BreadcrumbLink>
				<BreadcrumbSep>/</BreadcrumbSep>
				<BreadcrumbCurrent>{article.title}</BreadcrumbCurrent>
			</Breadcrumb>

			<CategoryPill>{article.category}</CategoryPill>
			<HeroTitle>{article.title}</HeroTitle>
			<Subtitle>{article.subtitle}</Subtitle>

			<Meta>
				<span>{article.author}</span>
				<MetaDot />
				<span>{article.date}</span>
				<MetaDot />
				<span>{article.readTime}</span>
			</Meta>

			<CoverImage src={article.coverImage} alt={article.title} />
		</Wrapper>
	);
}
