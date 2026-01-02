import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import SectionHeaders from '../layout/section_headers';
import Section from '../layout/section';
import { Quote } from 'lucide-react';

const TestimonialsGrid = styled.div`
	display: grid;
	gap: 1.5rem;
	max-width: 1200px;
	margin: 0 auto;

	@media (min-width: ${palette.screens.md}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: ${palette.screens.lg}) {
		grid-template-columns: repeat(3, 1fr);
	}
`;

const TestimonialCard = styled.div`
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.xLarge};
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, ${palette.colors.brand[500]}, ${palette.colors.brand[600]});
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	&:hover {
		border-color: ${palette.colors.brand[500]}40;
		transform: translateY(-4px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);

		&::before {
			opacity: 1;
		}
	}
`;

const QuoteIcon = styled(Quote)`
	color: ${palette.colors.brand[400]}40;
	position: absolute;
	top: 1rem;
	right: 1rem;
	opacity: 0.3;
`;

const TestimonialText = styled.p`
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.gray[200]};
	line-height: 1.6;
	margin: 0;
	font-family: ${palette.typography.fontFamily.inter};
	font-style: italic;
	position: relative;
	z-index: 1;
`;

const TestimonialFooter = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: auto;
`;

const Avatar = styled.div<{ $color: string }>`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.white};
	font-size: ${palette.typography.fontSize.lg};
	flex-shrink: 0;
`;

const AuthorInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
`;

const AuthorName = styled.div`
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.semibold};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.inter};
`;

const AuthorRole = styled.div`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	font-family: ${palette.typography.fontFamily.inter};
`;

const Metric = styled.div`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	background: ${palette.colors.brand[500]}20;
	border: 1px solid ${palette.colors.brand[500]}40;
	border-radius: 9999px;
	color: ${palette.colors.brand[300]};
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.semibold};
	margin-top: 0.5rem;
	width: fit-content;
`;

interface Testimonial {
	quote: string;
	author: string;
	role: string;
	metric?: string;
	avatarColor: string;
}

const TestimonialsSection: React.FC = () => {
	const testimonials: Testimonial[] = [
		{
			quote: "Tiler completely changed how I manage my day. Instead of manually blocking time, I just tell it what I need to do and it figures out the rest—including travel time between job sites.",
			author: "Marcus Chen",
			role: "Contractor",
			metric: "Saved 4+ hours/week",
			avatarColor: palette.colors.brand[500],
		},
		{
			quote: "As a parent juggling work, school pickups, and activities, Tiler is a lifesaver. It adapts when things run late and automatically reschedules everything. I'm never stressed about being late anymore.",
			author: "Sarah Williams",
			role: "Parent & Designer",
			metric: "Never late to pickup",
			avatarColor: palette.colors.brand[600],
		},
		{
			quote: "The AI assistant approach is brilliant. I used to spend 20 minutes every morning rearranging my calendar. Now Tiler does it in seconds, and it learns my preferences over time.",
			author: "David Park",
			role: "Software Engineer",
			metric: "20min → 30sec daily",
			avatarColor: palette.colors.brand[400],
		},
		{
			quote: "I love that Tiler asks clarifying questions instead of guessing. It feels like having a personal assistant who actually understands my schedule constraints and preferences.",
			author: "Priya Sharma",
			role: "Consultant",
			metric: "100% scheduling accuracy",
			avatarColor: palette.colors.brand[700],
		},
		{
			quote: "The travel-time calculation is a game-changer for field service. Tiler accounts for realistic drive times, so I'm not constantly running behind or showing up way too early.",
			author: "James Rodriguez",
			role: "HVAC Technician",
			metric: "Eliminated late arrivals",
			avatarColor: palette.colors.brand[500],
		},
		{
			quote: "I was skeptical about AI scheduling, but the confirmation-first approach won me over. I stay in control while Tiler handles the tedious parts. It's the perfect balance.",
			author: "Emily Thompson",
			role: "Attorney",
			metric: "Saved 3+ hours/week",
			avatarColor: palette.colors.brand[600],
		},
	];

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
	};

	return (
		<Section>
			<SectionHeaders
				headerText="Loved by Busy People"
				subHeaderText="See how Tiler helps professionals, parents, and field workers take back their time."
				align="center"
			/>
			<TestimonialsGrid>
				{testimonials.map((testimonial, index) => (
					<TestimonialCard key={index}>
						<QuoteIcon size={48} />
						<TestimonialText>&ldquo;{testimonial.quote}&rdquo;</TestimonialText>
						{testimonial.metric && <Metric>{testimonial.metric}</Metric>}
						<TestimonialFooter>
							<Avatar $color={testimonial.avatarColor}>
								{getInitials(testimonial.author)}
							</Avatar>
							<AuthorInfo>
								<AuthorName>{testimonial.author}</AuthorName>
								<AuthorRole>{testimonial.role}</AuthorRole>
							</AuthorInfo>
						</TestimonialFooter>
					</TestimonialCard>
				))}
			</TestimonialsGrid>
		</Section>
	);
};

export default TestimonialsSection;
