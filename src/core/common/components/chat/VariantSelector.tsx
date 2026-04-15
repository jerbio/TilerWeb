import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services';
import { VariantPreview } from '@/core/common/types/chat';
import Button from '@/core/common/components/button';

interface VariantSelectorProps {
	vibeRequestId: string;
	onResolved: () => void;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 0.5rem 0;
`;

const CardsRow = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const Card = styled.div<{ $selected?: boolean }>`
	flex: 1;
	min-width: 200px;
	border: 1px solid ${({ theme, $selected }) =>
		$selected ? theme.colors.brand[400] : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	padding: 1rem;
	background: ${({ theme }) => theme.colors.background.card2};
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const CardTitle = styled.h4`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const CardDescription = styled.p`
	margin: 0;
	font-size: ${({ theme }) => theme.typography.fontSize.xs};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.muted};
	line-height: 1.4;
`;

const ActionsRow = styled.div`
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
	margin-top: 0.25rem;
`;

const ResolvedMessage = styled.div`
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	color: ${({ theme }) => theme.colors.text.muted};
	padding: 0.5rem;
	font-style: italic;
`;

type SelectorState = 'loading' | 'ready' | 'applying' | 'resolved' | 'dismissed' | 'error';

const VariantSelector: React.FC<VariantSelectorProps> = ({ vibeRequestId, onResolved }) => {
	const { t } = useTranslation();
	const [previews, setPreviews] = useState<VariantPreview[]>([]);
	const [state, setState] = useState<SelectorState>('loading');
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const data = await chatService.getVariantPreviews(vibeRequestId);
				if (!cancelled) {
					setPreviews(data);
					setState('ready');
				}
			} catch {
				if (!cancelled) setState('error');
			}
		};
		load();
		return () => { cancelled = true; };
	}, [vibeRequestId]);

	const handleApply = async (preview: VariantPreview) => {
		setState('applying');
		setSelectedId(preview.id);
		try {
			await chatService.selectVariant(vibeRequestId, preview.id);
			setState('resolved');
			onResolved();
		} catch {
			setState('ready');
			setSelectedId(null);
		}
	};

	const handleDismiss = () => {
		setState('dismissed');
		onResolved();
	};

	if (state === 'resolved') {
		return <ResolvedMessage>{t('home.expanded.chat.variantSelector.applied')}</ResolvedMessage>;
	}

	if (state === 'dismissed') {
		return <ResolvedMessage>{t('home.expanded.chat.variantSelector.dismissed')}</ResolvedMessage>;
	}

	if (state === 'loading') {
		return <ResolvedMessage>{t('home.expanded.chat.variantSelector.loading')}</ResolvedMessage>;
	}

	if (state === 'error') {
		return <ResolvedMessage>{t('home.expanded.chat.variantSelector.error')}</ResolvedMessage>;
	}

	return (
		<Container>
			<CardsRow>
				{previews.map((preview, index) => {
					const label = `Variant ${index + 1}`;
					const actionDescriptions = preview.previewActions
						?.map(pa => pa.action?.descriptions)
						.filter(Boolean)
						.join('; ');

					return (
						<Card key={preview.id} $selected={selectedId === preview.id}>
							<CardTitle>{label}</CardTitle>
							{actionDescriptions && <CardDescription>{actionDescriptions}</CardDescription>}
							<Button
								variant="primary"
								onClick={() => handleApply(preview)}
								disabled={state === 'applying'}
							>
								{state === 'applying' && selectedId === preview.id
									? t('home.expanded.chat.variantSelector.applying')
									: t('home.expanded.chat.variantSelector.apply')}
							</Button>
						</Card>
					);
				})}
			</CardsRow>
			<ActionsRow>
				<Button variant="secondary" onClick={handleDismiss} disabled={state === 'applying'}>
					{t('home.expanded.chat.variantSelector.dismissAll')}
				</Button>
			</ActionsRow>
		</Container>
	);
};

export default VariantSelector;
