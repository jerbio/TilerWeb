import React from 'react';
import WaitlistProgressBar from './WaitlistProgressBar';
import { ArrowRight, Link2, ListCheck, Mail, Wrench } from 'lucide-react';
import Input from '@/core/common/components/input';
import styled from 'styled-components';
import Button from '@/core/common/components/button';
import { animated, useTransition } from '@react-spring/web';
import { betaUserService } from '@/services';
import { toast } from 'sonner';
import MultiInput from '@/core/common/components/multi_input';

const steps = [
  { id: 1, name: 'Email', icon: () => <Mail size={16} />, key: 'email' },
  { id: 2, name: 'Profession', icon: () => <Wrench size={16} />, key: 'profession' },
  { id: 3, name: 'Integrations', icon: () => <Link2 size={16} />, key: 'integrations' },
  { id: 4, name: 'Use Case', icon: () => <ListCheck size={16} />, key: 'useCase' },
];

const WaitlistForm: React.FC = () => {
  // get email from url params
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formValues, setFormValues] = React.useState<{
    email: string;
    profession: string;
    integrations: string[];
    useCase: string;
  }>({
    email: emailParam || '',
    profession: '',
    integrations: [],
    useCase: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const inputTransition = useTransition([steps[currentStep - 1]], {
    from: { opacity: 0, x: 32 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: -32 },
    config: { duration: 250 },
    exitBeforeEnter: true,
    deps: [currentStep],
  });

  function resetForm() {
		setFormValues({
			email: '',
			profession: '',
			integrations: [],
			useCase: '',
		});
    setCurrentStep(1);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

		if (formValues.integrations.length === 0 && currentStep === 3) {
			toast.error('Please add at least one integration');
			return;
		}

		console.log(formValues);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      return;
    }


    try {
      setIsSubmitting(true);
      await betaUserService.signUp({
        email: formValues.email,
        profession: formValues.profession,
        integrations: formValues.integrations,
        useCases: formValues.useCase,
      });
      toast('Signed up successfully!', {
        duration: 2000,
      });
      resetForm();
    } catch (error) {
      console.error('Error signing up for waitlist:', error);
      toast.error('Failed to sign up.');
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputs = [
    <Input
			key="email"
      type="email"
      prepend={steps[0].icon()}
      label="Email Address"
      variant="brand"
      placeholder="Email Address"
      value={formValues.email}
      onChange={(e) => (setFormValues({ ...formValues, email: e.target.value }))}
      required
    />,
    <Input
			key="profession"
      type="string"
      prepend={steps[1].icon()}
      label="What is your profession?"
      variant="brand"
      placeholder="Profession"
      value={formValues.profession}
			onChange={(e) => (setFormValues({ ...formValues, profession: e.target.value }))}
      required
    />,
    <MultiInput
			key="integrations"
      placeholder="e.g. Google Calendar, Slack"
      searchList={[
        'Google Calendar',
        'Microsoft Outlook Calendar',
        'Apple Calendar',
        'Slack',
        'Monday.com',
        'Reclaim',
        'Usemotion',
        'Notion',
        'TickTick',
        'Evernote',
        'OneNote',
      ]}
      inputProps={{
        type: 'string',
        prepend: steps[2].icon(),
        label: 'What integrations do you use?',
        variant: 'brand',
      }}
      value={formValues.integrations}
			onChange={(integrations) => setFormValues({ ...formValues, integrations })}
    />,
    <Input
			key="useCase"
      type="string"
      prepend={steps[3].icon()}
      label="What do you want to use Tiler Chat for?"
      variant="brand"
      placeholder="Scheduling, Task Management, etc."
			value={formValues.useCase}
			onChange={(e) => (setFormValues({ ...formValues, useCase: e.target.value }))}
      required
    />,
  ];

  return (
    <WaitlistFormContainer>
      <WaitlistProgressBar steps={steps} currentStep={currentStep} />
      <StyledWaitlistForm onSubmit={handleSubmit}>
        {inputTransition((style, item) => (
          <animated.div style={style} key={item.id}>
            {inputs[item.id - 1]}
          </animated.div>
        ))}
        <Button disabled={isSubmitting} type="submit" variant="brand" height={40}>
          <span>{currentStep === steps.length ? 'Join Waitlist' : 'Next'}</span>
          <ArrowRight size={16} />
        </Button>
      </StyledWaitlistForm>
    </WaitlistFormContainer>
  );
};

const StyledWaitlistForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const WaitlistFormContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	width: 100%;
	max-width: 400px;
`;

export default WaitlistForm;
