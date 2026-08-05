import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import Modal from '@/core/common/components/modals';
import Button from '@/core/common/components/button';

type DeleteClusterDialogProps = {
	show: boolean;
	setShow: (show: boolean) => void;
	/** Named in the prompt so the user can see what they're about to remove. */
	name: string;
	deleting?: boolean;
	onConfirm: () => void;
};

/**
 * Confirmation for deleting a tileshare. Deletion removes it for every
 * assignee, not just the caller, so it is always confirmed and never undone
 * from the client.
 */
const DeleteClusterDialog: React.FC<DeleteClusterDialogProps> = ({
	show,
	setShow,
	name,
	deleting = false,
	onConfirm,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<Modal
			show={show}
			setShow={deleting ? undefined : setShow}
			headerText={t('tilesharedemo.detail.delete.title')}
			footer={
				<Actions>
					<Button
						type="button"
						variant="ghost"
						size="medium"
						style={{ border: `1px solid ${theme.colors.border.default}` }}
						onClick={() => setShow(false)}
					>
						{t('tilesharedemo.detail.delete.cancel')}
					</Button>
					<Button
						type="button"
						variant="brand"
						size="medium"
						onClick={onConfirm}
						disabled={deleting}
					>
						{deleting
							? t('tilesharedemo.detail.delete.deleting')
							: t('tilesharedemo.detail.delete.confirm')}
					</Button>
				</Actions>
			}
		>
			<Body>
				{t('tilesharedemo.detail.delete.body', { name })}
				<Warning>{t('tilesharedemo.detail.delete.warning')}</Warning>
			</Body>
		</Modal>
	);
};

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.5;
	/* Tileshare names are user-supplied and can be long and unbroken. */
	overflow-wrap: anywhere;
`;

const Warning = styled.span`
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
	width: 100%;
`;

export default DeleteClusterDialog;
