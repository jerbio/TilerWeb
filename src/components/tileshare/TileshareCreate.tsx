import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Layers, MapPin, MessageSquare, Plus } from 'lucide-react';
import useFormHandler from '@/hooks/useFormHandler';
import Input from '@/core/common/components/input';
import DatePicker from '@/core/common/components/date_picker';
import Button from '@/core/common/components/button';

export enum TileshareMode {
	Single = 'single',
	Multi = 'multi',
}

type TileshareCreateProps = {
	mode: TileshareMode;
	onBack: () => void;
};

type TileshareFormState = {
	name: string;
	deadline: string;
	location: string;
	note: string;
	shareTo: string;
};

const initialTileshareFormState: TileshareFormState = {
	name: '',
	deadline: '',
	location: '',
	note: '',
	shareTo: '',
};

const TileshareCreate: React.FC<TileshareCreateProps> = ({ mode, onBack }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { formData, handleFormInputChange } =
		useFormHandler<TileshareFormState>(initialTileshareFormState);

	const isSingle = mode === TileshareMode.Single;
	const ModeIcon = isSingle ? MessageSquare : Layers;

	return (
		<Container>
			<HeaderBar>
				<BackButton type="button" onClick={onBack}>
					<ChevronLeft size={18} />
					{t('tilesharedemo.dashboard.create.back')}
				</BackButton>
			</HeaderBar>

			<Content>
				<IconBox>
					<ModeIcon size={20} />
				</IconBox>

				<Title>{t(`tilesharedemo.dashboard.create.${mode}.title`)}</Title>
				<Description>{t(`tilesharedemo.dashboard.create.${mode}.description`)}</Description>

				<Fields>
					<Input
						name="name"
						placeholder={t('tilesharedemo.dashboard.create.fields.name.placeholder')}
						value={formData.name}
						onChange={handleFormInputChange('name')}
					/>

					<DatePicker
						value={formData.deadline}
						onChange={handleFormInputChange('deadline', { mode: 'static' })}
						placeholder={t(
							'tilesharedemo.dashboard.create.fields.deadline.placeholder'
						)}
					/>

					<Input
						name="location"
						placeholder={t(
							'tilesharedemo.dashboard.create.fields.location.placeholder'
						)}
						value={formData.location}
						onChange={handleFormInputChange('location')}
						append={<MapPin size={16} />}
					/>

					<Input.Textarea
						name="note"
						placeholder={t('tilesharedemo.dashboard.create.fields.note.placeholder')}
						value={formData.note}
						onChange={handleFormInputChange('note')}
						height={180}
					/>

					{isSingle && (
						<ShareTo>
							<ShareToLabel>
								{t('tilesharedemo.dashboard.create.shareTo.label')}
							</ShareToLabel>
							<Input
								name="shareTo"
								placeholder={t(
									'tilesharedemo.dashboard.create.shareTo.placeholder'
								)}
								value={formData.shareTo}
								onChange={handleFormInputChange('shareTo')}
								append={
									<AddButton
										type="button"
										aria-label={t('tilesharedemo.dashboard.create.shareTo.add')}
									>
										<Plus size={16} />
									</AddButton>
								}
							/>
						</ShareTo>
					)}
				</Fields>

				<Footer>
					<Separator />
					<Actions>
						<Button
							type="button"
							variant="ghost"
							style={{
								border: `1px solid ${theme.colors.border.default}`,
							}}
							onClick={onBack}
						>
							{t('tilesharedemo.dashboard.create.buttons.cancel')}
						</Button>
						<Button type="button" variant="brand">
							{t(`tilesharedemo.dashboard.create.${mode}.submit`)}
						</Button>
					</Actions>
				</Footer>
			</Content>
		</Container>
	);
};

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
`;

const HeaderBar = styled.header`
	position: sticky;
	top: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	padding: 1rem 1.5rem;
	background-color: ${({ theme }) => theme.colors.background.page};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const BackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const Content = styled.div`
	width: 100%;
	max-width: ${({ theme }) => theme.screens.md};
	margin-inline: auto;
	padding: 2.5rem 1.5rem 2rem;
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const IconBox = styled.div`
	width: 56px;
	height: 56px;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	border: 1px solid ${({ theme }) => theme.colors.border.strong};
	color: ${({ theme }) => theme.colors.text.primary};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Title = styled.h2`
	margin-top: 1.5rem;
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
	font-size: ${({ theme }) => theme.typography.fontSize.displayXs};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.p`
	margin-top: 0.5rem;
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	font-size: ${({ theme }) => theme.typography.fontSize.base};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Fields = styled.div`
	margin-top: 2rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ShareTo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const ShareToLabel = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily.urban};
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const AddButton = styled.button`
	height: 28px;
	width: 28px;
	color: ${({ theme }) => theme.colors.button.brand.text};
	background-color: ${({ theme }) => theme.colors.button.brand.bg};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${({ theme }) => theme.colors.button.brand.bgHover};
	}
`;

const Footer = styled.div`
	margin-top: 2rem;
	display: flex;
	flex-direction: column;
`;

const Separator = styled.hr`
	border: none;
	height: 0.5px;
	background-color: ${({ theme }) => theme.colors.border.subtle};
`;

const Actions = styled.div`
	margin-top: 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

export default TileshareCreate;
