import React, { useState, KeyboardEvent, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Input, { BaseInputProps } from './input';
import { X } from 'lucide-react';

type MultiInputOption = {
  label: string;
  value: string;
};

type MultiInputProps = {
  value?: MultiInputOption[];
  onChange?: (tags: MultiInputOption[]) => void;
  options?: MultiInputOption[];
  placeholder?: string;
  inputProps?: BaseInputProps;
};

const MultiInput: React.FC<MultiInputProps> = ({
  value = [],
  onChange,
  options,
  placeholder,
  inputProps,
}) => {
  const [selectedOptions, setSelectedOptions] = useState(value);
  const [input, setInput] = useState('');
  const searchList = useMemo<string[]>(() => {
    if (!options) return [];
    const selectedValues = new Set(selectedOptions.map((opt) => opt.value));
    const newOpts = options
      .filter((opt) => !selectedValues.has(opt.value))
      .map((opt) => opt.label);
    return newOpts;
  }, [selectedOptions, options]);

  useEffect(() => {
    setSelectedOptions(value);
  }, [value]);

  const addOption = (label: string) => {
    const clean = label.trim();
    const isAlreadySelected = selectedOptions.some(
      (t) => t.label.toLowerCase() === clean.toLowerCase()
    );
    if (clean && !isAlreadySelected) {
      const existingOption = options?.find(
        (opt) => opt.label.toLowerCase() === clean.toLowerCase()
      );
      let newOption: MultiInputOption;
      if (existingOption) {
        newOption = existingOption;
      } else {
        newOption = {
          label: clean,
          value: 'custom:' + clean.toLowerCase().replace(/\s+/g, '-'),
        };
      }

      const newOptions = [...selectedOptions, newOption];
      setSelectedOptions(newOptions);
      onChange?.(newOptions);
    }
    setTimeout(() => setInput(''), 0);
  };
  const removeOption = (option: MultiInputOption) => {
    const newOptions = selectedOptions.filter((t) => t.value !== option.value);
    setSelectedOptions(newOptions);
    onChange?.(newOptions);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addOption(input);
    } else if (e.key === 'Backspace' && !input && selectedOptions.length) {
      removeOption(selectedOptions[selectedOptions.length - 1]); // delete last
    }
  };

  return (
    <MultiInputContainer>
      <TagWrapper>
        {selectedOptions.length ? (
          selectedOptions.map((option) => (
            <Tag key={option.value}>
              {option.label}
              <Remove
                aria-label={`Remove ${option.label}`}
                onClick={() => removeOption(option)}
              >
								<X size={12} />
              </Remove>
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
        searchList={searchList}
        onSearchSelect={(val) => addOption(val)}
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
	gap: 0.75rem;
`;

const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	overflow: hidden;
	height: 28px;
	padding: 4px 8px;
	padding-right: 0px;
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
	height: 28px;
	width: 28px;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: color 0.2s ease-in-out;

	&:hover {
		color: ${palette.colors.brand[400]};
	}
`;

export default MultiInput;
