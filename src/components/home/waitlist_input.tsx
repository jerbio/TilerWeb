import React, { useState } from 'react';
import styled from 'styled-components';
import { WaitlistApi } from '../../api/waitlistApi';
import styles from '../../util/styles';
import { toast } from 'sonner';
import Section from '../layout/section';

const Form = styled.form`
	display: flex;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4rem;
  overflow: hidden;
  width: 100%;
  background-color: ${styles.colors.gray[800]};
`;

const Input = styled.input`
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	border: none;
	outline: none;
  width: 100%;
	flex: 1;
  
	color: ${styles.colors.gray[300]};
`;

const Button = styled.button`
	background: linear-gradient(
		90deg,
		${styles.colors.brand[500]},
		${styles.colors.brand[600]}
	);
	border-radius: 0;
	color: ${styles.colors.brand[50]};
	border: none;
	padding: 0 1.5rem;
	cursor: pointer;
	transition: 0.35s ease;

	&:hover {
		background: linear-gradient(
			90deg,
			${styles.colors.brand[600]},
			${styles.colors.brand[500]}
		);
	}
`;

const Waitlist: React.FC = () => {
	const [email, setEmail] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const waitlistApi = new WaitlistApi();
			await waitlistApi.joinWaitlist(email);
			toast('Signed up successfully!', {
				duration: 2000,
			});
			setEmail('');
		} catch (error) {
			setEmail('');
			toast('Failed to sign up.');
		}
	};

	return (
		<Section width={1024} noPaddingBlock>
			<Form onSubmit={handleSubmit}>
				<Input
					type="email"
					placeholder="Your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<Button type="submit">Join Waitlist</Button>
			</Form>
		</Section>
	);
};

export default Waitlist;

