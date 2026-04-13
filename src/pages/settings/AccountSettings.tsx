import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import useAuthNavigate from '@/hooks/useNavigateHome';
import { toast } from 'sonner';
import palette from '@/core/theme/palette';
import Input from '@/core/common/components/input';
import Button from '@/core/common/components/button';
import DatePicker from '@/core/common/components/date_picker';
import useAppStore from '@/global_state';
import { userService } from '@/services';
import { COUNTRY_CODES, type CountryCode } from '@/core/constants/countryCodes';

const AccountSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useAuthNavigate();
	const authenticatedUser = useAppStore((state) => state.authenticatedUser);

	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [countryCode, setCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
	const [countryCodeOpen, setCountryCodeOpen] = useState(false);
	const [countrySearch, setCountrySearch] = useState('');
	const countryTriggerRef = useRef<HTMLButtonElement>(null);
	const countryListRef = useRef<HTMLDivElement>(null);
	const countrySearchRef = useRef<HTMLInputElement>(null);
	const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
	const [dateOfBirth, setDateOfBirth] = useState(''); // YYYY-MM-DD format for native date picker
	const [isSaving, setIsSaving] = useState(false);

	const filteredCountryCodes = countrySearch
		? COUNTRY_CODES.filter(
				(c) =>
					c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
					c.iso.toLowerCase().includes(countrySearch.toLowerCase()) ||
					String(c.code).includes(countrySearch)
			)
		: COUNTRY_CODES;

	const openCountryDropdown = useCallback(() => {
		const rect = countryTriggerRef.current?.getBoundingClientRect();
		if (rect) {
			setDropdownPos({
				top: rect.bottom + 4,
				left: rect.left,
				width: Math.max(rect.width, 260),
			});
		}
		setCountryCodeOpen(true);
		setCountrySearch('');
	}, []);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (countryCodeOpen) {
			setTimeout(() => countrySearchRef.current?.focus(), 0);
		}
	}, [countryCodeOpen]);

	// Close country dropdown on outside click
	useEffect(() => {
		if (!countryCodeOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (
				countryTriggerRef.current?.contains(e.target as Node) ||
				countryListRef.current?.contains(e.target as Node)
			)
				return;
			setCountryCodeOpen(false);
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [countryCodeOpen]);

	// Close on Escape
	useEffect(() => {
		if (!countryCodeOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setCountryCodeOpen(false);
		};
		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, [countryCodeOpen]);

	useEffect(() => {
		if (authenticatedUser) {
			setFullName(authenticatedUser.fullName || '');
			setEmail(authenticatedUser.email || '');
			setUsername(authenticatedUser.username || '');
			setPhoneNumber(authenticatedUser.phoneNumber || '');

			// Initialize country code from user data
			if (authenticatedUser.countryCode) {
				const code = parseInt(authenticatedUser.countryCode, 10);
				const match = COUNTRY_CODES.find((c) => c.code === code);
				if (match) {
					setCountryCode(match);
				}
			}

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
					const date = new Date(
						Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
					);
					dateOfBirthUtcEpoch = date.getTime();
				}
			}

			// Extract country code and phone number
			const phoneNumberClean = phoneNumber.replace(/\D/g, '');

			await userService.updateUser({
				FirstName: firstName,
				LastName: lastName,
				UpdatedUserName: username || '',
				CountryCode: countryCode.code,
				PhoneNumber: phoneNumberClean,
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
				<BreadcrumbLink onClick={() => navigate('home')}>
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
						<PhoneFieldLabel>
							{t('settings.sections.accountInfo.fields.phoneNumber')}
						</PhoneFieldLabel>
						<PhoneRow>
							<CountryCodeWrapper>
								<CountryCodeTrigger
									ref={countryTriggerRef}
									onClick={openCountryDropdown}
									type="button"
								>
									<span>{countryCode.flag}</span>
									<span>+{countryCode.code}</span>
									<ChevronSvg width="10" height="10" viewBox="0 0 12 12">
										<path fill="currentColor" d="M6 9L1 4h10z" />
									</ChevronSvg>
								</CountryCodeTrigger>
								{countryCodeOpen &&
									createPortal(
										<CountryDropdown
											ref={countryListRef}
											style={{
												top: dropdownPos.top,
												left: dropdownPos.left,
												width: dropdownPos.width,
											}}
										>
											<CountrySearchInput
												ref={countrySearchRef}
												placeholder={t(
													'settings.sections.accountInfo.fields.countryCodeSearch'
												)}
												value={countrySearch}
												onChange={(e) => setCountrySearch(e.target.value)}
											/>
											{filteredCountryCodes.map((c) => (
												<CountryDropdownItem
													key={`${c.iso}-${c.code}`}
													$selected={
														c.iso === countryCode.iso &&
														c.code === countryCode.code
													}
													onClick={() => {
														setCountryCode(c);
														setCountryCodeOpen(false);
													}}
												>
													<span>{c.flag}</span>
													<CountryName>{c.name}</CountryName>
													<CountryDial>+{c.code}</CountryDial>
												</CountryDropdownItem>
											))}
											{filteredCountryCodes.length === 0 && (
												<CountryNoResults>
													{t(
														'settings.sections.accountInfo.fields.countryCodeNoResults'
													)}
												</CountryNoResults>
											)}
										</CountryDropdown>,
										document.body
									)}
							</CountryCodeWrapper>
							<PhoneInputWrapper>
								<Input
									placeholder={t(
										'settings.sections.accountInfo.fields.phoneNumberPlaceholder'
									)}
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									type="tel"
								/>
							</PhoneInputWrapper>
						</PhoneRow>
					</FormGroup>
				</FormRow>

				<FormRow>
					<FormGroup>
						<DatePicker
							label={t('settings.sections.accountInfo.fields.dateOfBirth')}
							value={dateOfBirth}
							onChange={setDateOfBirth}
							placeholder={t(
								'settings.sections.accountInfo.fields.dateOfBirthPlaceholder'
							)}
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

const PhoneFieldLabel = styled.label`
	display: flex;
	gap: 0.25rem;
	margin-bottom: 6px;
	font-size: ${palette.typography.fontSize.xs};
	font-weight: ${palette.typography.fontWeight.medium};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const PhoneRow = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: stretch;
`;

const CountryCodeWrapper = styled.div`
	position: relative;
	flex-shrink: 0;
`;

const CountryCodeTrigger = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	appearance: none;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${palette.borderRadius.little};
	color: ${({ theme }) => theme.colors.text.primary};
	padding: 0 0.75rem;
	padding-right: 1.75rem;
	height: 100%;
	font-size: 13px;
	font-weight: ${palette.typography.fontWeight.medium};
	cursor: pointer;
	position: relative;
	transition: border-color 0.2s ease;
	white-space: nowrap;

	&:hover {
		border-color: ${({ theme }) => theme.colors.gray[500]};
	}

	&:focus {
		outline: none;
		border-color: ${palette.colors.brand[400]};
		box-shadow: 0 0 0 2px ${palette.colors.brand[400]}33;
	}
`;

const ChevronSvg = styled.svg`
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);
	opacity: 0.5;
`;

const PhoneInputWrapper = styled.div`
	flex: 1;
	min-width: 0;
`;

const CountryDropdown = styled.div`
	position: fixed;
	z-index: 10000;
	max-height: 280px;
	overflow-y: auto;
	background-color: ${({ theme }) => theme.colors.background.card};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${palette.borderRadius.medium};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	padding: 4px 0;

	scrollbar-width: thin;
	scrollbar-color: ${({ theme }) => theme.colors.gray[600]} transparent;
`;

const CountrySearchInput = styled.input`
	width: calc(100% - 16px);
	margin: 4px 8px 6px;
	padding: 6px 10px;
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-radius: ${palette.borderRadius.small};
	background-color: ${({ theme }) => theme.colors.input.bg};
	color: ${({ theme }) => theme.colors.input.text};
	font-size: ${palette.typography.fontSize.sm};
	outline: none;

	&:focus {
		border-color: ${palette.colors.brand[400]};
	}

	&::placeholder {
		color: ${({ theme }) => theme.colors.input.placeholder};
	}
`;

const CountryDropdownItem = styled.div<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 12px;
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	color: ${({ $selected }) => ($selected ? palette.colors.brand[400] : 'inherit')};
	background-color: ${({ $selected, theme }) =>
		$selected ? theme.colors.gray[800] : 'transparent'};
	cursor: pointer;
	transition: background-color 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.gray[700]};
	}
`;

const CountryName = styled.span`
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const CountryDial = styled.span`
	flex-shrink: 0;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${palette.typography.fontSize.xs};
`;

const CountryNoResults = styled.div`
	padding: 12px;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${palette.typography.fontSize.sm};
`;

export default AccountSettings;
