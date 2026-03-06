import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import VoiceInput from '@/core/common/components/VoiceInput';
import Loader from '@/core/common/components/loader';

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.8);
	backdrop-filter: blur(8px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
	pointer-events: ${({ $isOpen }) => ($isOpen ? 'all' : 'none')};
	transition: opacity 0.3s ease-in-out;
`;

const ModalContent = styled.div<{ $isOpen: boolean }>`
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.xxLarge};
	padding: 2rem;
	max-width: 600px;
	width: calc(100% - 2rem);
	position: relative;
	transform: ${({ $isOpen }) => ($isOpen ? 'scale(1)' : 'scale(0.9)')};
	transition: transform 0.3s ease-in-out;

	@media (max-width: 768px) {
		padding: 1.5rem;
	}
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
	font-size: ${palette.typography.fontSize.displayXs};
	font-weight: ${palette.typography.fontWeight.bold};
	color: ${palette.colors.gray[100]};
	margin: 0;
	font-family: ${palette.typography.fontFamily.inter};

	@media (max-width: 768px) {
		font-size: ${palette.typography.fontSize.xl};
	}
`;

const CloseButton = styled.button`
	background: transparent;
	border: none;
	cursor: pointer;
	color: ${palette.colors.gray[400]};
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover:not(:disabled) {
		color: ${palette.colors.gray[200]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ModalDescription = styled.p`
	color: ${palette.colors.gray[400]};
	font-size: ${palette.typography.fontSize.sm};
	line-height: 1.6;
	margin-bottom: 1.5rem;
	font-family: ${palette.typography.fontFamily.inter};
`;

const TextArea = styled.textarea`
	width: 100%;
	min-height: 120px;
	padding: 1rem;
	background: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.large};
	color: ${palette.colors.gray[100]};
	font-size: ${palette.typography.fontSize.base};
	font-family: ${palette.typography.fontFamily.inter};
	resize: vertical;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${palette.colors.brand[500]};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		background: ${palette.colors.gray[800]};
	}

	&::placeholder {
		color: ${palette.colors.gray[600]};
	}
`;

const TextAreaWrapper = styled.div`
	position: relative;
	width: 100%;
`;

const PlaceholderOverlay = styled.div<{ $visible: boolean }>`
	position: absolute;
	top: 1rem;
	left: 1rem;
	right: 1rem;
	pointer-events: none;
	color: ${palette.colors.gray[600]};
	font-size: ${palette.typography.fontSize.base};
	font-family: ${palette.typography.fontFamily.inter};
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transition: opacity 0.2s ease;
	line-height: 1.5;

	&::after {
		content: '|';
		animation: blink 1s infinite;
		margin-left: 2px;
		color: ${palette.colors.brand[400]};
	}

	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}
`;

const ButtonWrapper = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const LoadingOverlay = styled.div<{ $visible: boolean }>`
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 1.5rem;
	background-color: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(4px);
	border-radius: ${palette.borderRadius.xxLarge};
	z-index: 10;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
	transition: opacity 0.3s ease-in-out;
`;

const LoadingContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	max-width: 400px;
	padding: 0 2rem;
`;

const LoadingMessage = styled.div`
	text-align: center;
	color: ${palette.colors.gray[100]};
	font-family: ${palette.typography.fontFamily.inter};
`;

const LoadingTitle = styled.h3`
	font-size: ${palette.typography.fontSize.lg};
	font-weight: ${palette.typography.fontWeight.semibold};
	margin: 0 0 0.5rem 0;
	color: ${palette.colors.white};
`;

const LoadingDescription = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	margin: 0;
	line-height: 1.5;
`;

const ProgressSteps = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	margin-top: 0.5rem;
`;

const ProgressStep = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 0.75rem;
	background: ${({ $isActive, $isComplete }) =>
		$isComplete
			? palette.colors.brand[900] + '40'
			: $isActive
				? palette.colors.gray[800]
				: 'transparent'};
	border-radius: ${palette.borderRadius.medium};
	transition: all 0.3s ease;
`;

const StepIndicator = styled.div<{ $isActive: boolean; $isComplete: boolean }>`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.bold};
	flex-shrink: 0;
	
	${({ $isComplete, $isActive }) =>
		$isComplete
			? `
		background: ${palette.colors.brand[500]};
		color: ${palette.colors.white};
	`
			: $isActive
				? `
		background: ${palette.colors.gray[700]};
		color: ${palette.colors.gray[300]};
		border: 2px solid ${palette.colors.brand[500]};
	`
				: `
		background: ${palette.colors.gray[800]};
		color: ${palette.colors.gray[600]};
		border: 2px solid ${palette.colors.gray[700]};
	`}
`;

const StepText = styled.span<{ $isActive: boolean; $isComplete: boolean }>`
	font-size: ${palette.typography.fontSize.sm};
	color: ${({ $isComplete, $isActive }) =>
		$isComplete || $isActive ? palette.colors.gray[200] : palette.colors.gray[500]};
	font-weight: ${({ $isActive }) =>
		$isActive ? palette.typography.fontWeight.medium : palette.typography.fontWeight.normal};
	transition: all 0.3s ease;
`;

interface CustomPersonaModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (description: string, audioFile?: Blob) => Promise<void>;
}

const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
}) => {
	const { t } = useTranslation();
	const [description, setDescription] = useState('');
	const [placeholder, setPlaceholder] = useState('');
	const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
	const [isTyping, setIsTyping] = useState(true);
	const [isRecording, setIsRecording] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | undefined>(undefined);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isTranscribed, setIsTranscribed] = useState(false); // Track if audio was transcribed
	const [processingStep, setProcessingStep] = useState(0); // Track backend processing stage (0-4)

	// Get localized placeholder suggestions
	const PLACEHOLDER_SUGGESTIONS = [
		t('common.customPersonaModal.placeholders.healthcare'),
		t('common.customPersonaModal.placeholders.student'),
		t('common.customPersonaModal.placeholders.engineer'),
		t('common.customPersonaModal.placeholders.parent'),
		t('common.customPersonaModal.placeholders.freelancer'),
		t('common.customPersonaModal.placeholders.fitness'),
		t('common.customPersonaModal.placeholders.remote'),
		t('common.customPersonaModal.placeholders.business'),
	];

	// Backend processing steps
	const PROCESSING_STEPS = [
		{
			title: t('common.customPersonaModal.processing.creatingUser'),
			description: t('common.customPersonaModal.processing.creatingUserDesc'),
		},
		{
			title: t('common.customPersonaModal.processing.generatingProfile'),
			description: t('common.customPersonaModal.processing.generatingProfileDesc'),
		},
		{
			title: t('common.customPersonaModal.processing.generatingTiles'),
			description: t('common.customPersonaModal.processing.generatingTilesDesc'),
		},
		{
			title: t('common.customPersonaModal.processing.optimizing'),
			description: t('common.customPersonaModal.processing.optimizingDesc'),
		},
	];

	// Typewriter effect for placeholder
	useEffect(() => {
		if (!isOpen) {
			setPlaceholder('');
			setCurrentSuggestionIndex(0);
			setIsTyping(true);
			return;
		}

		const currentSuggestion = PLACEHOLDER_SUGGESTIONS[currentSuggestionIndex];
		let currentIndex = 0;
		let timeoutId: ReturnType<typeof setTimeout>;

		if (isTyping) {
			// Typing effect
			const typeNextChar = () => {
				if (currentIndex < currentSuggestion.length) {
					setPlaceholder(currentSuggestion.slice(0, currentIndex + 1));
					currentIndex++;
					timeoutId = setTimeout(typeNextChar, 50); // Typing speed
				} else {
					// Pause at the end before deleting
					timeoutId = setTimeout(() => {
						setIsTyping(false);
					}, 2000);
				}
			};
			timeoutId = setTimeout(typeNextChar, 100);
		} else {
			// Deleting effect
			const deleteNextChar = () => {
				if (currentIndex < currentSuggestion.length) {
					setPlaceholder(currentSuggestion.slice(0, currentSuggestion.length - currentIndex - 1));
					currentIndex++;
					timeoutId = setTimeout(deleteNextChar, 30); // Deletion speed (faster)
				} else {
					// Move to next suggestion
					setCurrentSuggestionIndex((prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
					setIsTyping(true);
				}
			};
			timeoutId = setTimeout(deleteNextChar, 100);
		}

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isOpen, currentSuggestionIndex, isTyping]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	const handleSubmit = async () => {
		if (description.trim() || audioBlob) {
			setIsSubmitting(true);
			setProcessingStep(0);
			
			// Simulate progressive steps with intervals
			const stepInterval = setInterval(() => {
				setProcessingStep(prev => {
					if (prev < PROCESSING_STEPS.length - 1) {
						return prev + 1;
					}
					return prev;
				});
			}, 2000); // Progress every 2 seconds
			
			try {
				// Keep modal open with spinner until API completes
				// Only send audio if it wasn't transcribed (i.e., user didn't use auto-transcribe)
				const audioToSend = isTranscribed ? undefined : audioBlob;
				await onSubmit(description, audioToSend);
				
				clearInterval(stepInterval);
				
				// Show all steps as complete (all checkmarks)
				setProcessingStep(PROCESSING_STEPS.length);

				const personaCarousel = document.getElementById('persona-carousel');
				if (personaCarousel) {
					personaCarousel.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
				
				// Wait 1 second to show all checkmarks before closing
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Only clear form after successful submission
				// Modal will be closed by parent component (navigation.tsx)
				setDescription('');
				setAudioBlob(undefined);
				setIsTranscribed(false);
				setProcessingStep(0);
			} catch (error) {
				clearInterval(stepInterval);
				console.error('Submission error:', error);
				setProcessingStep(0);
				// On error, keep form data so user can retry
				// TODO: Show error message to user
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const handleClose = () => {
		if (isSubmitting) return; // Prevent closing during submission
		
		// Clean up state
		setDescription('');
		setIsRecording(false);
		setAudioBlob(undefined);
		setIsTranscribed(false);
		setProcessingStep(0);
		
		onClose();
	};

	// Clean up state when modal closes (from parent)
	useEffect(() => {
		if (!isOpen) {
			// When modal closes, clean up state
			// VoiceInput component will handle its own blob URL cleanup on unmount
			setAudioBlob(undefined);
			setDescription('');
			setIsRecording(false);
			setIsTranscribed(false);
			setProcessingStep(0);
		}
	}, [isOpen]);

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget && !isSubmitting) {
			handleClose();
		}
	};

	return (
		<ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
			<ModalContent $isOpen={isOpen}>
				<ModalHeader>
					<ModalTitle>{t('common.customPersonaModal.title')}</ModalTitle>
					<CloseButton onClick={handleClose} disabled={isSubmitting}>
						<X size={24} />
					</CloseButton>
				</ModalHeader>
				<ModalDescription>
					{t('common.customPersonaModal.description')}
				</ModalDescription>
				<TextAreaWrapper>
					<PlaceholderOverlay $visible={!description && placeholder.length > 0 && !isRecording && !isSubmitting}>
						{placeholder}
					</PlaceholderOverlay>
					<TextArea
						placeholder=""
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
								handleSubmit();
							}
						}}
						disabled={isRecording || isSubmitting}
					/>
					<VoiceInput
						key={`voice-input-${isOpen}`}
						onRecordingStart={() => setIsRecording(true)}
						onRecordingStop={() => setIsRecording(false)}
						onAudioRecorded={(blob) => {
							setAudioBlob(blob);
							// Reset transcription flag when new recording is made
							setIsTranscribed(false);
						}}
						onTranscriptionComplete={(transcription) => {
							// Append transcription to existing description
							setDescription(prev => prev ? `${prev}\n${transcription}` : transcription);
							// Mark that this audio was transcribed, so we don't send the blob
							setIsTranscribed(true);
						}}
						autoTranscribe={true}
						disabled={isSubmitting}
					/>
				</TextAreaWrapper>
				<ButtonWrapper>
					<Button
						variant="brand"
						onClick={handleSubmit}
						disabled={(!description.trim() && !audioBlob) || isSubmitting}
						style={{ flex: 1 }}
					>
						{isSubmitting ? t('common.buttons.creating') : t('common.buttons.createSchedule')}
					</Button>
					<Button 
						variant="secondary" 
						onClick={handleClose} 
						style={{ flex: 1 }}
						disabled={isSubmitting}
					>
						{t('common.buttons.cancel')}
					</Button>
				</ButtonWrapper>
				
				{/* Loading overlay - positioned last to appear on top */}
				<LoadingOverlay $visible={isSubmitting}>
					<LoadingContent>
						<Loader />
						<LoadingMessage>
							<LoadingTitle>{PROCESSING_STEPS[processingStep]?.title}</LoadingTitle>
							<LoadingDescription>{PROCESSING_STEPS[processingStep]?.description}</LoadingDescription>
						</LoadingMessage>
						<ProgressSteps>
							{PROCESSING_STEPS.map((step, index) => (
								<ProgressStep
									key={index}
									$isActive={index === processingStep}
									$isComplete={index < processingStep}
								>
									<StepIndicator
										$isActive={index === processingStep}
										$isComplete={index < processingStep}
									>
										{index < processingStep ? '✓' : index + 1}
									</StepIndicator>
									<StepText
										$isActive={index === processingStep}
										$isComplete={index < processingStep}
									>
										{step.title}
									</StepText>
								</ProgressStep>
							))}
						</ProgressSteps>
					</LoadingContent>
				</LoadingOverlay>
			</ModalContent>
		</ModalOverlay>
	);
};

export default CustomPersonaModal;
