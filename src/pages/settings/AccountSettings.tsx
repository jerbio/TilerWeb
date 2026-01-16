import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Input from '@/core/common/components/input';
import Button from '@/core/common/components/button';
import useAppStore from '@/global_state';
import { userService } from '@/services';

const AccountSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);

	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [dateOfBirth, setDateOfBirth] = useState(''); // YYYY-MM-DD format for native date picker
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (authenticatedUser) {
			setFullName(authenticatedUser.fullName || '');
			setEmail(authenticatedUser.email || '');
			setUsername(authenticatedUser.username || '');
			setPhoneNumber(authenticatedUser.phoneNumber || '');

			// Format date of birth to YYYY-MM-DD for native date picker
			if (authenticatedUser.dateOfBirth) {
				const date = new Date(authenticatedUser.dateOfBirth);
				if (!isNaN(date.getTime())) {
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					setDateOfBirth(`${year}-${month}-${day}`);
				}
			}
		}
	}, [authenticatedUser]);

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			// Parse full name into first and last name
			const nameParts = fullName.trim().split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';

			// Parse date of birth to UTC epoch in milliseconds (YYYY-MM-DD format from native picker)
			let dateOfBirthUtcEpoch = 0;
			if (dateOfBirth) {
				const [year, month, day] = dateOfBirth.split('-');
				if (year && month && day) {
					const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
					dateOfBirthUtcEpoch = date.getTime();
				}
			}

			// Extract country code and phone number
			// Assuming phone number might include country code or just the number
			const phoneNumberClean = phoneNumber.replace(/\D/g, ''); // Remove non-digits
			const countryCode = phoneNumberClean.length > 10 ? parseInt(phoneNumberClean.substring(0, phoneNumberClean.length - 10)) : 0;
			const phoneNumberOnly = phoneNumberClean.length > 10 ? phoneNumberClean.substring(phoneNumberClean.length - 10) : phoneNumberClean;

			await userService.updateUser({
				FirstName: firstName,
				LastName: lastName,
				UpdatedUserName: username || '',
				CountryCode: countryCode,
				PhoneNumber: phoneNumberOnly,
				DateOfBirthUtcEpoch: dateOfBirthUtcEpoch,
				EndOfDay: authenticatedUser?.endfOfDay || '',
			});

			toast.success(t('settings.sections.accountInfo.saveSuccess'));
		} catch (error) {
			toast.error(t('settings.sections.accountInfo.saveError'));
			console.error('Failed to save changes:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAccount = () => {
		// TODO: Implement delete account functionality
		toast.error(t('settings.sections.accountInfo.deleteNotImplemented'));
	};

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate('/')}>
					{t('settings.breadcrumb.home')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbLink onClick={() => navigate('/settings')}>
					{t('settings.breadcrumb.settings')}
				</BreadcrumbLink>
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbCurrent>{t('settings.sections.accountInfo.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.accountInfo.title')}</Title>
				<Description>{t('settings.sections.accountInfo.description')}</Description>
			</Header>

			<Form>
				<FormRow>
					<FormGroup>
						<Input
							label={t('settings.sections.accountInfo.fields.fullName')}
							placeholder="James Michael"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>
					</FormGroup>
					<FormGroup>
						<Input
							label={t('settings.sections.accountInfo.fields.username')}
							placeholder="james-michael"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							type="text"
						/>
					</FormGroup>
				</FormRow>

				<FormRow>
					<FormGroup>
						<Input
							label={t('settings.sections.accountInfo.fields.email')}
							placeholder="jamesmichael@gmail.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							type="email"
						/>
					</FormGroup>
					<FormGroup>
						<Input
							label={t('settings.sections.accountInfo.fields.phoneNumber')}
							placeholder={t('settings.sections.accountInfo.fields.phoneNumberPlaceholder')}
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							type="tel"
						/>
					</FormGroup>
				</FormRow>

				<FormRow>
					<FormGroup onClick={() => {
						const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
						if (dateInput) {
							dateInput.focus();
							dateInput.showPicker?.();
						}
					}}>
						<Input
							label={t('settings.sections.accountInfo.fields.dateOfBirth')}
							value={dateOfBirth}
							onChange={(e) => setDateOfBirth(e.target.value)}
							type="date"
						/>
					</FormGroup>
					<FormGroup $alignEnd>
						<Button variant="brand" onClick={handleSaveChanges} disabled={isSaving}>
							{isSaving
								? t('settings.sections.accountInfo.saving')
								: t('settings.sections.accountInfo.saveChanges')}
						</Button>
					</FormGroup>
				</FormRow>
			</Form>

			<DeleteButton onClick={handleDeleteAccount}>
				{t('settings.sections.accountInfo.deleteAccount')}
				<Trash2 size={16} />
			</DeleteButton>
		</Container>
	);
};

const Container = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

const Breadcrumb = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 2rem;
	font-size: ${palette.typography.fontSize.sm};
`;

const BreadcrumbLink = styled.span`
	color: ${palette.colors.gray[500]};
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.gray[400]};
	}
`;

const BreadcrumbSeparator = styled.span`
	color: ${palette.colors.gray[600]};
`;

const BreadcrumbCurrent = styled.span`
	color: ${palette.colors.white};
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: ${palette.typography.fontSize.displaySm};
	color: ${palette.colors.white};
	font-family: ${palette.typography.fontFamily.urban};
	font-weight: ${palette.typography.fontWeight.bold};
	margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[500]};
	margin: 0;
`;

const Form = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 3rem;
`;

const FormRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormGroup = styled.div<{ $alignEnd?: boolean }>`
	display: flex;
	flex-direction: column;
	${(props) => props.$alignEnd && 'justify-content: flex-end;'}

	&:has(input[type="date"]) {
		cursor: pointer;
	}
`;

const DeleteButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	border: none;
	color: ${palette.colors.brand[400]};
	font-size: ${palette.typography.fontSize.base};
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: ${palette.colors.brand[300]};
	}
`;

export default AccountSettings;
