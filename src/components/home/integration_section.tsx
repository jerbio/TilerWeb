import React from 'react';
import styled from 'styled-components';
import SectionHeaders from '../layout/section_headers';
import pallette from '@/core/theme/pallete';
import Section from '../layout/section';
import { useTranslation } from 'react-i18next';
import MicrosoftLogo from '@/assets/microsoft_logo.png';
import GoogleLogo from '@/assets/google_logo.png';
import CalendarIcon from '@/assets/calendar_icon.png';

const LogoContainer = styled.div`
	display: flex;
	align-items: center;
`;

const LogoWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-left: 20px;
`;

const Logo = styled.img`
  width: 50px
  height: auto;
  margin-bottom: 5px;
`;

const FlexWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	@media (min-width: ${pallette.screens.md}) {
		flex-direction: row;
		justify-content: space-between;
	}
`;

const CalendarIntegrationSection: React.FC = () => {
	const { t } = useTranslation();

	return (
		<Section>
			<FlexWrapper>
				<SectionHeaders
					headerText={t('home.integration.title')}
					spanText={t('home.integration.spanText')}
					image={CalendarIcon}
					imageAlt={t('home.integration.title')}
					subHeaderText={t('home.integration.subtitle')}
					align="left"
				/>

				<LogoContainer>
					<LogoWrapper>
						<Logo src={MicrosoftLogo} alt="Microsoft Logo" />
					</LogoWrapper>
					<LogoWrapper>
						<Logo src={GoogleLogo} alt="Google Logo" />
					</LogoWrapper>
				</LogoContainer>
			</FlexWrapper>
		</Section>
	);
};

export default CalendarIntegrationSection;
