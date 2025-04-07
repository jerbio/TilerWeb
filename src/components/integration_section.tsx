import React from 'react';
import styled from 'styled-components';
import SectionHeaders from './section_headers';
import MicrosoftLogo from '../assets/image_assets/microsoft_logo.png';
import GoogleLogo from '../assets/image_assets/google_logo.png';
import CalendarIcon from '../assets/image_assets/calendar_icon.png';

const Section = styled.section`
	background-color: #000;
	color: white;
	padding: 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 1200px;
	margin: 0 auto;
`;

const TextContent = styled.div`
	max-width: 50%;
	//   border: 1px solid #ccc;
`;

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

const CalendarIntegrationSection: React.FC = () => {
	return (
		<Section>
			<TextContent>
				<SectionHeaders
					headerText="Integrate with your favorite"
					spanText="calendar"
					image={CalendarIcon}
					imageAlt="Calendar Icon"
					subHeaderText="These apps are available to integrate seamlessly with Tiler."
					align="left"
				/>
			</TextContent>
			<LogoContainer>
				<LogoWrapper>
					<Logo src={MicrosoftLogo} alt="Microsoft Logo" />
				</LogoWrapper>
				<LogoWrapper>
					<Logo src={GoogleLogo} alt="Google Logo" />
				</LogoWrapper>
			</LogoContainer>
		</Section>
	);
};

export default CalendarIntegrationSection;
