import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Input from '@/core/common/components/input';
import Button from '@/core/common/components/button';
import DatePicker from '@/core/common/components/date_picker';
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
					const year = date.getUTCFullYear();
					const month = String(date.getUTCMonth() + 1).padStart(2, '0');
					const day = String(date.getUTCDate()).padStart(2, '0');
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
				EndOfDay: authenticatedUser?.endOfDay || '',
			});

			toast.success(t('settings.sections.accountInfo.saveSuccess'));
		} catch (error) {
			let toastMessage = t('settings.sections.accountInfo.saveError');
			if (error instanceof Error && error.message) {
				toastMessage = error.message;
			}
			toast.error(toastMessage);
			console.error('Failed to save changes:', error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Container>
			<Breadcrumb>
				<BreadcrumbLink onClick={() => navigate('/signin')}>
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
							readOnly
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
					<FormGroup>
						<DatePicker
							label={t('settings.sections.accountInfo.fields.dateOfBirth')}
							value={dateOfBirth}
							onChange={setDateOfBirth}
							placeholder={t('settings.sections.accountInfo.fields.dateOfBirthPlaceholder')}
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
`;

export default AccountSettings;
