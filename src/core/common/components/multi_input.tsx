import React, { useState, KeyboardEvent } from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Input, { BaseInputProps } from './input';

type MultiInputProps = {
  value?: string[];
  onChange?: (tags: string[]) => void;
  searchList?: string[];
  placeholder?: string;
  inputProps?: BaseInputProps;
};

const MultiInput: React.FC<MultiInputProps> = ({
  value = [],
  onChange,
  searchList,
  placeholder,
  inputProps,
}) => {
  const [tags, setTags] = useState<string[]>(value);
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) {
      const newTags = [...tags, clean];
      setTags(newTags);
      onChange?.(newTags);
    }
    setInput('');
  };
  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    onChange?.(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]); // delete last
    }
  };

  return (
    <MultiInputContainer>
      <TagWrapper>
        {tags.length ? (
          tags.map((tag) => (
            <Tag key={tag}>
              {tag}
              <Remove onClick={() => removeTag(tag)}>×</Remove>
            </Tag>
          ))
        ) : (
          <EmptyTagWrapper>No options added</EmptyTagWrapper>
        )}
      </TagWrapper>
      <Input
        {...inputProps}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        searchList={searchList?.filter((item) => !tags.includes(item))}
      />
    </MultiInputContainer>
  );
};

const MultiInputContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
`;

const EmptyTagWrapper = styled.div`
	color: ${palette.colors.gray[500]};
	font-size: ${palette.typography.fontSize.xs};
	height: 28px;
	display: flex;
	gap: 8px;
	align-items: center;
`;

const TagWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`;

const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	height: 28px;
	gap: 4px;
	padding: 4px 8px;
	box-shadow: 0 0 0 1px ${palette.colors.gray[800]};
	background: ${palette.colors.gray[900]};
	color: ${palette.colors.gray[300]};
	border-radius: ${palette.borderRadius.medium};
	font-size: ${palette.typography.fontSize.xs};
`;

const Remove = styled.button`
	color: ${palette.colors.gray[400]};
	font-size: 14px;
	line-height: 1;
	transition: color 0.2s ease-in-out;

	&:hover {
		color: ${palette.colors.brand[400]};
	}
`;

export default MultiInput;
