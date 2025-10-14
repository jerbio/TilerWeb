import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import VoiceInput from '@/core/common/components/VoiceInput';
import Spinner from '@/core/common/components/loader';

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
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(4px);
	border-radius: ${palette.borderRadius.xxLarge};
	z-index: 10;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
	transition: opacity 0.3s ease-in-out;
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
			try {
				// Keep modal open with spinner until API completes
				await onSubmit(description, audioBlob);
				
				// Only clear form after successful submission
				// Modal will be closed by parent component (navigation.tsx)
				setDescription('');
				setAudioBlob(undefined);
			} catch (error) {
				console.error('Submission error:', error);
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
		
		// Revoke audio blob URL if it exists to free memory
		if (audioBlob) {
			URL.revokeObjectURL(URL.createObjectURL(audioBlob));
			setAudioBlob(undefined);
		}
		
		onClose();
	};

	// Clean up audio blob when modal closes (from parent)
	useEffect(() => {
		if (!isOpen && audioBlob) {
			// When modal closes, clean up any remaining audio blobs
			URL.revokeObjectURL(URL.createObjectURL(audioBlob));
			setAudioBlob(undefined);
			setDescription('');
			setIsRecording(false);
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
				<LoadingOverlay $visible={isSubmitting}>
					<Spinner />
				</LoadingOverlay>
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
						onRecordingStart={() => setIsRecording(true)}
						onRecordingStop={() => setIsRecording(false)}
						onAudioRecorded={setAudioBlob}
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
			</ModalContent>
		</ModalOverlay>
	);
};

export default CustomPersonaModal;
