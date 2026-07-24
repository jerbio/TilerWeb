import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import ArticleLayout from '@/articles/components/ArticleLayout';
import { getArticle } from '@/articles/articles.config';
import StepsSection from '@/components/onboard/StepsSection';
import PillarsSection from '@/components/onboard/PillarsSection';
import CtaBanner from '@/components/onboard/CtaBanner';

const IntroBlock = styled.div`
	width: 100%;
	max-width: 760px;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const Lede = styled.p`
	font-size: clamp(1.0625rem, 2.5vw, 1.1875rem);
	line-height: 1.72;
	color: ${palette.colors.gray[400]};
	margin: 0;
`;

const BodyText = styled.p`
	font-size: 1rem;
	line-height: 1.72;
	color: ${palette.colors.gray[500]};
	margin: 0;
`;

const GettingStartedArticle: React.FC = () => {
	const { t } = useTranslation();
	const article = getArticle('getting-started-with-tiler');

	if (!article) return null;

	return (
		<ArticleLayout article={article}>
			<IntroBlock>
				<Lede>{t('articles.posts.gettingStarted.intro.lede')}</Lede>
				<BodyText>{t('articles.posts.gettingStarted.intro.body')}</BodyText>
			</IntroBlock>

			<PillarsSection />
			<StepsSection />
			<CtaBanner />
		</ArticleLayout>
	);
};

export default GettingStartedArticle;
