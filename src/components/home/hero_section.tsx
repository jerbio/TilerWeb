import React from 'react';
import styled from 'styled-components';
import SectionHeaders from '../layout/section_headers';
import Button from '../shared/button';
import Section from '../layout/section';
import ArrowRight from '../icons/arrow_right';
import { useTranslation } from 'react-i18next';

const ButtonContainer = styled.div`
	display: flex;
  flex-wrap: wrap;
  justify-content: center;
	gap: 10px;
	margin-top: 20px;
`;

const HeroSection: React.FC = () => {
	const { t } = useTranslation();
	
	return (
		<Section>
			<SectionHeaders
				headerText={t('home.hero.title')}
				subHeaderText={t('home.hero.subtitle')}
				align="center"
				size="large"
			/>
			<ButtonContainer>
				<Button
					onClick={() =>
						window.open('https://tiler.app/account/login', '_blank')
					}
					borderGradient={[
						'#FC278780',
						'#2C90FC80',
						'#B8FD3380',
						'#FEC83780',
					]}
				>
					<span>{t('common.buttons.getStarted')}</span>
					<ArrowRight />
				</Button>
				<Button variant="brand">{t('common.buttons.learnMore')}</Button>
			</ButtonContainer>
		</Section>
	);
};

export default HeroSection;

