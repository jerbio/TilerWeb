import React, { useState } from 'react';
import styled from 'styled-components';
import { WaitlistApi } from '../../api/waitlistApi';
import styles from '../../util/styles';
import { toast } from 'sonner';

const Wrapper = styled.form`
  margin: 4rem auto;
	display: flex;
  overflow: hidden;
  border-radius: 4rem;
	width: 100%;
	max-width: 1024px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	border: none;
	outline: none;
	flex: 1;
  color: ${styles.colors.gray[300]};
`;

const Button = styled.button`
	background: linear-gradient(90deg, ${styles.colors.brand[500]}, ${styles.colors.brand[600]});
  border-radius: 0;
	color: ${styles.colors.brand[50]};
	border: none;
	padding: 0 1.5rem;
	cursor: pointer;
	transition: 0.35s ease;

	&:hover {
		background: linear-gradient(90deg, ${styles.colors.brand[600]}, ${styles.colors.brand[500]});
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
				duration: 2000,});
			setEmail('');
		} catch (error) {
			setEmail('');
			toast('Failed to sign up.');
		}
	};

	return (
		<Wrapper onSubmit={handleSubmit}>
			<Input
				type="email"
				placeholder="Your email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			<Button type="submit">Join Waitlist</Button>
		</Wrapper>
	);
};

export default Waitlist;
