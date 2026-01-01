import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import palette from '@/core/theme/palette';
import Input from '@/core/common/components/input';

interface Contact {
	id: string;
	name: string;
	email: string;
	avatar: string;
}

// Dummy data for contacts
const DUMMY_CONTACTS: Contact[] = [
	{
		id: '1',
		name: 'Oliver Smith',
		email: 'oliversmith@tiler.app',
		avatar: 'https://i.pravatar.cc/150?img=12',
	},
	{
		id: '2',
		name: 'Liam Johnson',
		email: 'liam.johnson@tiler.app',
		avatar: 'https://i.pravatar.cc/150?img=13',
	},
	{
		id: '3',
		name: 'Mason Brown',
		email: 'mason.brown@tiler.app',
		avatar: 'https://i.pravatar.cc/150?img=33',
	},
	{
		id: '4',
		name: 'Ethan Davis',
		email: 'ethan.davis@tiler.app',
		avatar: 'https://i.pravatar.cc/150?img=14',
	},
];

const ContactsSettings: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [contacts, setContacts] = useState<Contact[]>(DUMMY_CONTACTS);
	const [showAddForm, setShowAddForm] = useState(false);
	const [newContactName, setNewContactName] = useState('');
	const [newContactEmail, setNewContactEmail] = useState('');

	const handleAddContact = () => {
		if (newContactName.trim() && newContactEmail.trim()) {
			const newContact: Contact = {
				id: Date.now().toString(),
				name: newContactName.trim(),
				email: newContactEmail.trim(),
				avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
			};
			setContacts([...contacts, newContact]);
			setNewContactName('');
			setNewContactEmail('');
			setShowAddForm(false);
		}
	};

	const handleCancelAdd = () => {
		setNewContactName('');
		setNewContactEmail('');
		setShowAddForm(false);
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
				<BreadcrumbCurrent>{t('settings.sections.tilerContacts.title')}</BreadcrumbCurrent>
			</Breadcrumb>

			<Header>
				<Title>{t('settings.sections.tilerContacts.title')}</Title>
				<Description>{t('settings.sections.tilerContacts.description')}</Description>
			</Header>

			<ContactsHeader>
				<ContactCount>
					{t('settings.sections.tilerContacts.youHave')}
					<br />
					<strong>
						{contacts.length} {t('settings.sections.tilerContacts.tilerContacts')}
					</strong>
				</ContactCount>
				{!showAddForm && (
					<AddButton onClick={() => setShowAddForm(true)}>
						<Plus size={20} />
					</AddButton>
				)}
				{showAddForm && (
					<CloseButton onClick={handleCancelAdd}>
						<X size={20} />
					</CloseButton>
				)}
			</ContactsHeader>

			{showAddForm && (
				<AddContactForm>
					<Input
						placeholder={t('settings.sections.tilerContacts.enterFullName')}
						value={newContactName}
						onChange={(e) => setNewContactName(e.target.value)}
					/>
					<Input
						placeholder={t('settings.sections.tilerContacts.emailOrPhone')}
						value={newContactEmail}
						onChange={(e) => setNewContactEmail(e.target.value)}
					/>
					<AddContactButton onClick={handleAddContact}>
						<Plus size={20} />
					</AddContactButton>
				</AddContactForm>
			)}

			<ContactsList>
				{contacts.map((contact) => (
					<ContactCard key={contact.id} contact={contact} />
				))}
			</ContactsList>
		</Container>
	);
};

interface ContactCardProps {
	contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
	return (
		<ContactItem>
			<Avatar src={contact.avatar} alt={contact.name} />
			<ContactInfo>
				<ContactName>{contact.name}</ContactName>
				<ContactEmail>{contact.email}</ContactEmail>
			</ContactInfo>
		</ContactItem>
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

const ContactsHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.medium};
	margin-bottom: 1.5rem;
`;

const ContactCount = styled.div`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	line-height: 1.5;

	strong {
		color: ${palette.colors.white};
		font-weight: ${palette.typography.fontWeight.semibold};
		font-size: ${palette.typography.fontSize.base};
	}
`;

const AddButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background-color: ${palette.colors.brand[500]};
	border: none;
	border-radius: ${palette.borderRadius.medium};
	color: ${palette.colors.white};
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${palette.colors.brand[600]};
	}
`;

const CloseButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background-color: ${palette.colors.gray[800]};
	border: 1px solid ${palette.colors.gray[700]};
	border-radius: ${palette.borderRadius.medium};
	color: ${palette.colors.white};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${palette.colors.gray[700]};
	}
`;

const AddContactForm = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr auto;
	gap: 1rem;
	padding: 1.5rem;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.medium};
	margin-bottom: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const AddContactButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background-color: ${palette.colors.brand[500]};
	border: none;
	border-radius: ${palette.borderRadius.medium};
	color: ${palette.colors.white};
	cursor: pointer;
	transition: background-color 0.2s ease;
	align-self: end;

	&:hover {
		background-color: ${palette.colors.brand[600]};
	}

	@media (max-width: 768px) {
		width: 100%;
	}
`;

const ContactsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ContactItem = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background-color: ${palette.colors.gray[900]};
	border: 1px solid ${palette.colors.gray[800]};
	border-radius: ${palette.borderRadius.medium};
	transition: border-color 0.2s ease;

	&:hover {
		border-color: ${palette.colors.gray[700]};
	}
`;

const Avatar = styled.img`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
`;

const ContactInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const ContactName = styled.div`
	font-size: ${palette.typography.fontSize.base};
	color: ${palette.colors.white};
	font-weight: ${palette.typography.fontWeight.medium};
	margin-bottom: 0.25rem;
`;

const ContactEmail = styled.div`
	font-size: ${palette.typography.fontSize.sm};
	color: ${palette.colors.gray[400]};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export default ContactsSettings;
