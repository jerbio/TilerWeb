import React from 'react';
import Section from '../layout/section';
import SectionHeaders from '../layout/section_headers';
import styled from 'styled-components';
import ArrowRight from '../../assets/image_assets/icons/arrow_right.svg';
import Button from '../shared/button';
import Input from '../shared/input';
import styles from '../../util/styles';

const Form = styled.form`
	display: flex;
	gap: 0.5rem;
  width: 100%;
  max-width: 625px;
  margin: 0 auto;
`;

const ButtonText = styled.span`
  display: none;

  @media (min-width: ${styles.screens.sm}) {
    display: inline;
  }
`;

const UpdatesSection = () => {
	return (
		<Section>
			<SectionHeaders
				headerText="Get the Latest Tiler News & Updates"
				subHeaderText="Want to get more out of your schedule? Subscribe for tips, tricks, and updates delivered straight to your inbox."
				align="center"
			/>
			<Form action=''>
				<Input
					type="email"
					placeholder="Your Email Address..."
					variant="brand"
				/>
				<Button type="submit" variant="brand" height={40}>
					<ButtonText>Subscribe</ButtonText>
					<img src={ArrowRight} alt="Arrow Right" />
				</Button>
			</Form>
		</Section>
	);
};

export default UpdatesSection;

