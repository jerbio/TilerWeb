import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'sonner';
import Section from '../layout/section';
import Input from '@/core/common/components/input';
import Button from '@/core/common/components/button';
import palette from '@/core/theme/palette';
import { waitlistService } from '@/services';

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	margin: 0 auto;

	@media screen and (min-width: ${palette.screens.sm}) {
		flex-direction: row;
		max-width: 600px;
	}
`;

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await waitlistService.joinWaitlist(email);
      toast('Signed up successfully!', {
        duration: 2000,
      });
      setEmail('');
    } catch (error) {
      console.error('Error signing up for waitlist:', error);
      toast('Failed to sign up.');
      setEmail('');
    } finally {
      setIsSubmitting(false);
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
          disabled={isSubmitting}
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
