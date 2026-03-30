import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import Button from '@/core/common/components/button';
import { feedbackService } from '@/services';

interface FeedbackPopupProps {
	isOpen: boolean;
	onClose: () => void;
}

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'] as const;

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ isOpen, onClose }) => {
	const { t } = useTranslation();
	const [category, setCategory] = useState<string>(CATEGORIES[0]);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !description.trim()) return;

		setIsLoading(true);
		try {
			await feedbackService.submitFeedback({
				Category: category,
				Title: title.trim(),
				Description: description.trim(),
			});
			toast.success(t('feedback.submitSuccess'));
			setTitle('');
			setDescription('');
			setCategory(CATEGORIES[0]);
			onClose();
		} catch {
			toast.error(t('feedback.submitError'));
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<Overlay onClick={onClose}>
			<PopupContainer onClick={(e) => e.stopPropagation()}>
				<Header>
					<HeaderTitle>{t('feedback.title')}</HeaderTitle>
					<CloseButton onClick={onClose}>
						<X size={20} />
					</CloseButton>
				</Header>
				<Form onSubmit={handleSubmit}>
					<FormGroup>
						<Label>{t('feedback.category')}</Label>
						<Select value={category} onChange={(e) => setCategory(e.target.value)}>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{t(`feedback.categories.${cat}`)}
								</option>
							))}
						</Select>
					</FormGroup>
					<FormGroup>
						<Label>{t('feedback.titleLabel')}</Label>
						<Input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('feedback.titlePlaceholder')}
							maxLength={200}
						/>
					</FormGroup>
					<FormGroup>
						<Label>{t('feedback.descriptionLabel')}</Label>
						<TextArea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t('feedback.descriptionPlaceholder')}
							rows={4}
							maxLength={2000}
						/>
					</FormGroup>
					<SubmitButton
						type="submit"
						variant="primary"
						disabled={isLoading || !title.trim() || !description.trim()}
					>
						{isLoading ? t('feedback.submitting') : t('feedback.submit')}
					</SubmitButton>
				</Form>
			</PopupContainer>
		</Overlay>,
		document.body
	);
};

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

const PopupContainer = styled.div`
	background-color: ${(props) => props.theme.colors.background.card};
	border-radius: ${(props) => props.theme.borderRadius.large};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
	width: 90%;
	max-width: 480px;
	padding: 1.5rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
`;

const HeaderTitle = styled.h2`
	font-size: ${(props) => props.theme.typography.fontSize.lg};
	font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
	color: ${(props) => props.theme.colors.text.primary};
	margin: 0;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${(props) => props.theme.colors.text.secondary};
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: ${(props) => props.theme.colors.text.primary};
	}
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const Label = styled.label`
	font-size: ${(props) => props.theme.typography.fontSize.sm};
	font-weight: ${(props) => props.theme.typography.fontWeight.medium};
	color: ${(props) => props.theme.colors.text.secondary};
`;

const inputStyles = `
	width: 100%;
	border-radius: 0.5rem;
	font-size: inherit;
	box-sizing: border-box;
`;

const Input = styled.input`
	${inputStyles}
	padding: 0.625rem 0.75rem;
	background-color: ${(props) => props.theme.colors.background.default};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.brand[500]};
	}
`;

const Select = styled.select`
	${inputStyles}
	padding: 0.625rem 0.75rem;
	background-color: ${(props) => props.theme.colors.background.default};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.brand[500]};
	}
`;

const TextArea = styled.textarea`
	${inputStyles}
	padding: 0.625rem 0.75rem;
	background-color: ${(props) => props.theme.colors.background.default};
	border: 1px solid ${(props) => props.theme.colors.border.default};
	color: ${(props) => props.theme.colors.text.primary};
	resize: vertical;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.brand[500]};
	}
`;

const SubmitButton = styled(Button)`
	margin-top: 0.5rem;
`;

export default FeedbackPopup;
