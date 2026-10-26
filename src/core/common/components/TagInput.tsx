import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, X } from 'lucide-react';
import Input, { BaseInputProps } from './input';

type TagInputProps = {
	/** The committed tags — the single source of truth. */
	value: string[];
	/** Called with the next tag list on add or remove. */
	onChange: (next: string[]) => void;
	placeholder?: string;
	/** Accessible label for the add (+) button. */
	addLabel?: string;
	/** Builds the accessible label for a chip's remove (x) button. */
	removeLabel?: (value: string) => string;
	disabled?: boolean;
	sized?: 'small' | 'medium' | 'large';
	/** Extra props forwarded to the underlying Input (e.g. name, aria attributes). */
	inputProps?: Omit<
		BaseInputProps,
		'value' | 'onChange' | 'onKeyDown' | 'append' | 'disabled' | 'sized' | 'placeholder'
	>;
};

/**
 * A theme-aware tag/chip input. The caller owns the committed list via
 * `value`/`onChange`; only the in-progress text draft is internal. A tag is
 * committed on Enter, comma, or the add button, and removed via its chip.
 * Empty and duplicate values are ignored.
 */
const TagInput: React.FC<TagInputProps> = ({
	value,
	onChange,
	placeholder,
	addLabel,
	removeLabel,
	disabled = false,
	sized = 'medium',
	inputProps,
}) => {
	const [draft, setDraft] = useState('');

	const commit = (raw: string) => {
		if (disabled) return;
		const trimmed = raw.trim();
		if (trimmed && !value.includes(trimmed)) {
			onChange([...value, trimmed]);
		}
		setDraft('');
	};

	const remove = (tag: string) => {
		if (disabled) return;
		onChange(value.filter((t) => t !== tag));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commit(draft);
		} else if (e.key === 'Backspace' && !draft && value.length) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<Container>
			<Input
				{...inputProps}
				sized={sized}
				disabled={disabled}
				value={draft}
				placeholder={placeholder}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKeyDown}
				append={
					<AddButton
						type="button"
						aria-label={addLabel}
						disabled={disabled}
						onClick={() => commit(draft)}
					>
						<Plus size={16} />
					</AddButton>
				}
			/>
			{value.length > 0 && (
				<TagList>
					{value.map((tag) => (
						<Tag key={tag}>
							<span>{tag}</span>
							<Remove
								type="button"
								aria-label={removeLabel?.(tag)}
								disabled={disabled}
								onClick={() => remove(tag)}
							>
								<X size={14} />
							</Remove>
						</Tag>
					))}
				</TagList>
			)}
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
`;

const AddButton = styled.button`
	height: 28px;
	width: 28px;
	color: ${({ theme }) => theme.colors.tagInput.addText};
	background-color: ${({ theme }) => theme.colors.tagInput.addBg};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${({ theme }) => theme.colors.tagInput.addBgHover};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const TagList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.375rem 0.25rem 0.625rem;
	border-radius: ${({ theme }) => theme.borderRadius.large};
	border: 1px solid ${({ theme }) => theme.colors.tagInput.chipBorder};
	background-color: ${({ theme }) => theme.colors.tagInput.chipBg};
	color: ${({ theme }) => theme.colors.tagInput.chipText};
	font-family: ${({ theme }) => theme.typography.fontFamily.inter};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Remove = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.tagInput.remove};
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.tagInput.removeHover};
	}

	&:disabled {
		cursor: not-allowed;
	}
`;

export default TagInput;
