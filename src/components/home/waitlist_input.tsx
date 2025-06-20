import React, { useState } from 'react';
import styled from 'styled-components';
import { WaitlistApi } from '../../api/waitlistApi';
import { toast } from 'sonner';
import Section from '../layout/section';
import Input from '../shared/input';
import Button from '../shared/button';

const Form = styled.form`
	display: flex;
	gap: 0.5rem;
  width: 100%;
  margin: 0 auto;
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
		<Section width={1024} paddingBlock={0}>
			<Form onSubmit={handleSubmit}>
				<Input
					sized="large"
					type="email"
					placeholder="Your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<Button
					type="submit"
					size="large"
					height={44}
					variant="brand"
				>
					Join Waitlist
				</Button>
			</Form>
		</Section>
	);
};

export default Waitlist;

