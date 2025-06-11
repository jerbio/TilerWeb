import React from 'react';
import styled from 'styled-components';
import SectionHeaders from '../layout/section_headers';
import MicrosoftLogo from '../../assets/image_assets/microsoft_logo.png';
import GoogleLogo from '../../assets/image_assets/google_logo.png';
import CalendarIcon from '../../assets/image_assets/calendar_icon.png';
import styles from '../../util/styles';
import Section from '../layout/section';

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

  @media (min-width: ${styles.screens.md}) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const CalendarIntegrationSection: React.FC = () => {
	return (
		<Section>
			<FlexWrapper>
				<SectionHeaders
					headerText="Integrate with your favorite"
					spanText="calendars"
					image={CalendarIcon}
					imageAlt="Calendar Icon"
					subHeaderText="These apps are available to integrate seamlessly with Tiler."
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

