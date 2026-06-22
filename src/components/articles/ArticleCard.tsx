import { Link } from 'react-router';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { Article } from '@/core/common/data/articles';

const Card = styled(Link)`
	display: flex;
	flex-direction: column;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.large};
	overflow: hidden;
	text-decoration: none;
	color: inherit;
	transition:
		transform 0.2s ease,
		border-color 0.2s ease;

	&:hover {
		transform: translateY(-3px);
		border-color: ${palette.colors.gray[700]};
	}
`;

const CoverImage = styled.img`
	width: 100%;
	height: 220px;
	object-fit: cover;
	display: block;
`;

const CardBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1.5rem;
	flex: 1;
`;

const Category = styled.span`
	font-size: ${palette.typography.fontSize.xxs};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.brand[400]};
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const Title = styled.h3`
	font-family: ${palette.typography.fontFamily.urban};
	font-size: ${palette.typography.fontSize.lg};
	font-weight: 700;
	color: white;
	margin: 0;
	line-height: 1.3;
`;

const Excerpt = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: rgba(255, 255, 255, 0.65);
	margin: 0;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const Footer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: auto;
	padding-top: 0.75rem;
`;

const ReadTime = styled.span`
	font-size: ${palette.typography.fontSize.xs};
	color: rgba(255, 255, 255, 0.4);
`;

const ReadLink = styled.span`
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.brand[400]};
`;

interface ArticleCardProps {
	article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
	return (
		<Card to={`/articles/${article.slug}`}>
			<CoverImage src={article.coverImage} alt={article.title} />
			<CardBody>
				<Category>{article.category}</Category>
				<Title>{article.title}</Title>
				<Excerpt>{article.excerpt}</Excerpt>
				<Footer>
					<ReadTime>{article.readTime}</ReadTime>
					<ReadLink>Read article →</ReadLink>
				</Footer>
			</CardBody>
		</Card>
	);
}
