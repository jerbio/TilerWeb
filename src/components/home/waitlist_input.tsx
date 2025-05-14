import React, { useState } from 'react';
import styled from 'styled-components';
import { WaitlistApi } from '../../api/waitlistApi';

const Wrapper = styled.form`
	margin: 5rem auto;
	display: flex;
	border-radius: 9999px;
	overflow: hidden;
	width: 90%;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
	padding: 0.75rem 1rem;
	font-size: 1rem;
	border: none;
	outline: none;
	flex: 1;
	font-weight: 600;
`;

const Button = styled.button`
	background: linear-gradient(90deg, #e60073, #cc0066);
	color: white;
	border: none;
	padding: 0 1.5rem;
	font-weight: 700;
	cursor: pointer;
	transition: background 0.3s ease;

	&:hover {
		background: linear-gradient(90deg, #cc0066, #e60073);
	}
`;

const Waitlist: React.FC = () => {
	const [email, setEmail] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const waitlistApi = new WaitlistApi();
			await waitlistApi.joinWaitlist(email);
			alert('Signed up successfully!');
			setEmail('');
		} catch (error) {
			setEmail('');
			alert('Failed to sign up.');
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
