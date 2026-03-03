import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import SEO from '@/core/common/components/SEO';
import Section from '../components/layout/section';

const HeroWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 1.5rem;
	padding: 4rem 1rem;
`;

const Title = styled.h1`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: clamp(2rem, 5vw, 3.5rem);
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.gray[100]};
	line-height: 1.15;
	margin: 0;
`;

const Subtitle = styled.p`
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.lg};
	color: ${palette.colors.gray[400]};
	max-width: 560px;
	margin: 0;
	line-height: 1.6;
`;

const Form = styled.form`
	display: flex;
	gap: 0.75rem;
	width: 100%;
	max-width: 480px;

	@media (max-width: 480px) {
		flex-direction: column;
	}
`;

const EmailInput = styled.input`
	flex: 1;
	height: 48px;
	padding: 0 1rem;
	border-radius: ${palette.borderRadius.large};
	border: 1px solid ${palette.colors.gray[700]};
	background-color: ${palette.colors.gray[900]};
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	outline: none;
	transition: border-color 0.2s;

	&::placeholder {
		color: ${palette.colors.gray[600]};
	}

	&:focus {
		border-color: ${palette.colors.brand[400]};
	}
`;

const SubscribeButton = styled.button`
	height: 48px;
	padding: 0 1.5rem;
	border-radius: ${palette.borderRadius.large};
	border: none;
	background: linear-gradient(135deg, ${palette.colors.brand[500]}, ${palette.colors.brand[400]});
	color: #fff;
	font-family: ${palette.typography.fontFamily.inter};
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	white-space: nowrap;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.88;
	}
`;

const BackgroundBlur = styled.div`
	position: absolute;
	top: 40%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: -10;
	width: 900px;
	height: 900px;
	background: radial-gradient(
		circle,
		${palette.colors.brand[500]}18,
		transparent 70%
	);
	border-radius: 50%;
	filter: blur(80px);
	pointer-events: none;
`;

const Newsletter: React.FC = () => {
	const [email, setEmail] = React.useState('');
	const [submitted, setSubmitted] = React.useState(false);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (email.trim()) {
			setSubmitted(true);
		}
	}

	return (
		<>
			<SEO
				title="Newsletter - Tiler"
				description="Subscribe to the Tiler newsletter and stay up to date with the latest features, tips, and productivity insights."
				canonicalUrl="/newsletter"
			/>
			<Section>
				<BackgroundBlur />
				<HeroWrapper>
					<Title>Stay in the Loop</Title>
					<Subtitle>
						Get the latest Tiler updates, productivity tips, and feature announcements delivered
						straight to your inbox.
					</Subtitle>
					{submitted ? (
						<Subtitle style={{ color: palette.colors.brand[400] }}>
							Thanks for subscribing! We'll be in touch soon.
						</Subtitle>
					) : (
						<Form onSubmit={handleSubmit}>
							<EmailInput
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
							<SubscribeButton type="submit">Subscribe</SubscribeButton>
						</Form>
					)}
				</HeroWrapper>
			</Section>
		</>
	);
};

export default Newsletter;
