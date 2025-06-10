import React from 'react';
import styled from 'styled-components';
import SectionHeaders from './section_headers';
import MicrosoftLogo from '../../assets/image_assets/microsoft_logo.png';
import GoogleLogo from '../../assets/image_assets/google_logo.png';
import CalendarIcon from '../../assets/image_assets/calendar_icon.png';
import styles from '../../util/styles';

const TextContent = styled.div`
	max-width: 50%;
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

const Section = styled.section`
	background-color: #000;
	color: ${styles.colors.gray[500]};
	padding: 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin: 0 auto;
  max-width: ${styles.container.sizes.xLarge};

	@media (max-width: 768px) {
		flex-direction: column;
		text-align: center;

		${TextContent} {
			max-width: 100%;
			margin-bottom: 20px;
		}

		${LogoContainer} {
			justify-content: center;
		}

		${LogoWrapper} {
			margin-left: 10px;
		}
	}
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
