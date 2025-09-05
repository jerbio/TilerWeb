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
import { useTranslation } from 'react-i18next';

const WaitlistForm: React.FC = () => {
  const { t } = useTranslation();

  const refSteps = React.useRef([
    {
      id: 1,
      name: t('waitlist.form.steps.email.name'),
      icon: () => <Mail size={16} />,
      key: t('waitlist.form.steps.email.key'),
    },
    {
      id: 2,
      name: t('waitlist.form.steps.profession.name'),
      icon: () => <Wrench size={16} />,
      key: t('waitlist.form.steps.profession.key'),
    },
    {
      id: 3,
      name: t('waitlist.form.steps.integrations.name'),
      icon: () => <Link2 size={16} />,
      key: t('waitlist.form.steps.integrations.key'),
    },
    {
      id: 4,
      name: t('waitlist.form.steps.useCase.name'),
      icon: () => <ListCheck size={16} />,
      key: t('waitlist.form.steps.useCase.key'),
    },
  ]);
  const steps = refSteps.current;

  // get email from url params
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formValues, setFormValues] = React.useState<{
    email: string;
    profession: string;
    integrations: { label: string; value: string }[];
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
      toast.error(t('waitlist.form.errors.integrations'));
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      setIsSubmitting(true);
      await betaUserService.signUp({
        email: formValues.email,
        profession: formValues.profession,
        integrations: formValues.integrations.map((i) => i.value),
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

  const integrationOptions = t('waitlist.form.steps.integrations.options', {
    returnObjects: true,
  }) as { value: string; label: string }[];

  const inputs = [
    <Input
      key={t('waitlist.form.steps.email.key')}
      type="email"
      prepend={steps[0].icon()}
      label={t('waitlist.form.steps.email.name')}
      variant="brand"
      placeholder={t('waitlist.form.steps.email.placeholder')}
      value={formValues.email}
      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
      required
    />,
    <Input
      key={t('waitlist.form.steps.profession.key')}
      type="string"
      prepend={steps[1].icon()}
      label={t('waitlist.form.steps.profession.name')}
      variant="brand"
      placeholder={t('waitlist.form.steps.profession.placeholder')}
      value={formValues.profession}
      onChange={(e) => setFormValues({ ...formValues, profession: e.target.value })}
      required
    />,
    <MultiInput
      key={t('waitlist.form.steps.integrations.key')}
      placeholder={t('waitlist.form.steps.integrations.placeholder')}
      options={integrationOptions}
      inputProps={{
        type: 'string',
        prepend: steps[2].icon(),
        label: t('waitlist.form.steps.integrations.label'),
        variant: 'brand',
      }}
      value={formValues.integrations}
      onChange={(integrations) => setFormValues({ ...formValues, integrations })}
    />,
    <Input
      key={t('waitlist.form.steps.useCase.key')}
      type="string"
      prepend={steps[3].icon()}
      label={t('waitlist.form.steps.useCase.label')}
      variant="brand"
      placeholder={t('waitlist.form.steps.useCase.placeholder')}
      value={formValues.useCase}
      onChange={(e) => setFormValues({ ...formValues, useCase: e.target.value })}
      required
    />,
  ];

  return (
    <WaitlistFormContainer>
      <WaitlistProgressBar
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      <StyledWaitlistForm onSubmit={handleSubmit}>
        {inputTransition((style, item) => (
          <animated.div style={style} key={item.id}>
            {inputs[item.id - 1]}
          </animated.div>
        ))}
        <Button disabled={isSubmitting} type="submit" variant="brand" height={40}>
          <span>
            {currentStep === steps.length
              ? t('waitlist.form.joinWaitlist')
              : t('waitlist.form.nextStep')}
          </span>
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
