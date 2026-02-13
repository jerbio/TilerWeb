import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import palette from '@/core/theme/palette';
import AddSquare from '@/core/common/components/icons/add_square';
import CloseSquare from '@/core/common/components/icons/close_square';
import { a } from '@react-spring/web';

type CollapseSize = 'default' | 'small';
type IconPosition = 'left' | 'right';

type CollapseProps = {
  items: Array<{
    title: string;
    content: React.ReactNode;
  }>;
  openAll?: boolean;
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  size?: CollapseSize;
  iconPosition?: IconPosition;
  seperatorColor?: string;
};

const sizeStyles = {
  default: {
    headerPadding: '1rem 0',
    headerFont: palette.typography.fontSize.lg,
    headerFontMd: palette.typography.fontSize.xl,
    contentFont: palette.typography.fontSize.base,
    iconSize: 25,
    iconPaddingMd: '3px',
    iconPadding: '1.5px',
  },
  small: {
    headerPadding: '0.625rem 0',
    headerFont: palette.typography.fontSize.base,
    headerFontMd: palette.typography.fontSize.lg,
    contentFont: palette.typography.fontSize.sm,
    iconSize: 20,
    iconPaddingMd: '2px',
    iconPadding: '1px',
  },
};

const StyledCollapse = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
`;

const StyledCollapseItem = styled(a.li)<{
  $seperatorColor: string;
  $last: boolean;
}>`
  border-bottom: 1px solid
    ${({ $seperatorColor, $last }) =>
      $last ? 'transparent' : $seperatorColor};
`;

const StyledCollapseHeader = styled.button<{
  $active: boolean;
  $size: CollapseSize;
  $iconPosition: IconPosition;
	$openall: boolean;
}>`
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: ${({ $size }) => sizeStyles[$size].headerPadding};
  color: ${(props) =>
    props.$active && !props.$openall
      ? props.theme.colors.brand[400]
      : props.theme.colors.text.primary};
  font-weight: ${palette.typography.fontWeight.semibold};
  font-size: ${({ $size }) => sizeStyles[$size].headerFont};
  transition: color 0.3s ease;

  &:disabled {
    cursor: default;
  }

  h3 {
    font-family: ${palette.typography.fontFamily.urban};
    font-weight: ${palette.typography.fontWeight.bold};
    text-align: left;
    ${({ $iconPosition }) =>
      $iconPosition === 'right' &&
      css`
        order: -1;
      `}
  }

  .icon-wrapper {
    height: ${({ $size }) => sizeStyles[$size].iconSize}px;
    width: ${({ $size }) => sizeStyles[$size].iconSize}px;
    position: relative;
    padding-block: ${({ $size }) => sizeStyles[$size].iconPadding};
    color: ${(props) =>
      props.$active
        ? palette.colors.brand[400]
        : palette.colors.gray[500]};
    transition: color 0.3s ease;

    ${({ $iconPosition }) =>
      $iconPosition === 'right' &&
      css`
        margin-left: auto;
      `}
  }

  &:hover .icon-wrapper {
    ${(props) =>
      props.$active ? '' : `color: ${palette.colors.gray[400]};`}
  }

  @media (min-width: ${palette.screens.md}) {
    font-size: ${({ $size }) => sizeStyles[$size].headerFontMd};

    .icon-wrapper {
      padding-block: ${({ $size }) => sizeStyles[$size].iconPaddingMd};
    }
  }
`;

const StyledCollapseContent = styled.div<{
  $active: boolean;
  $size: CollapseSize;
  $iconPosition: IconPosition;
  $iconsHidden: boolean;
}>`
  padding-left: ${({ $iconsHidden, $size, $iconPosition }) =>
    $iconsHidden
      ? '0'
      : $iconPosition === 'left'
      ? `calc(${sizeStyles[$size].iconSize}px + 0.75rem)`
      : '0'};
  padding-right: ${({ $iconsHidden, $size, $iconPosition }) =>
    $iconsHidden
      ? '0'
      : $iconPosition === 'right'
      ? `calc(${sizeStyles[$size].iconSize}px + 0.75rem)`
      : '0'};

  color: ${palette.colors.gray[500]};
  font-size: ${({ $size }) => sizeStyles[$size].contentFont};
  line-height: 1.5;
  padding-bottom: ${(props) => (props.$active ? '1rem' : '0')};

  display: grid;
  grid-template-rows: ${(props) => (props.$active ? '1fr' : '0fr')};
  transition:
    grid-template-rows 0.3s ease-in-out,
    padding-bottom 0.3s ease-in-out;

  p {
    overflow: hidden;
  }
`;

const StyledCollapseHeaderIcon = styled.span<{
  mode: 'add' | 'close';
  $active: boolean;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
    rotate(${(props) => (props.$active ? '0deg' : '90deg')});
  opacity: ${(props) =>
    props.$active
      ? props.mode === 'add'
        ? 0
        : 1
      : props.mode === 'add'
      ? 1
      : 0};

  transition:
    transform 0.3s ease-in-out,
    opacity 0.2s ease-in-out;
`;

const Collapse: React.FC<CollapseProps> = ({
  items,
  openAll = false,
  openIcon = <AddSquare />,
  closeIcon = <CloseSquare />,
  size = 'default',
  iconPosition = 'left',
  seperatorColor = palette.colors.gray[800],
}) => {
  const keyedItems = items.map((item, index) => ({
    ...item,
    key: item.title + index,
  }));

  const [currentKey, setCurrentKey] = useState<string | null>(null);

  return (
    <StyledCollapse>
      {keyedItems.map((item, index) => {
        const active = openAll || item.key === currentKey;

        return (
          <StyledCollapseItem
            key={item.key}
            $seperatorColor={seperatorColor}
            $last={index === items.length - 1}
          >
            <StyledCollapseHeader
							$openall={openAll}
              $active={active}
              $size={size}
              $iconPosition={iconPosition}
              disabled={openAll}
              onClick={() => {
                if (openAll) return;
                setCurrentKey(active ? null : item.key);
              }}
            >
              {!openAll && (
                <div className="icon-wrapper">
                  <StyledCollapseHeaderIcon mode="add" $active={active}>
                    {openIcon}
                  </StyledCollapseHeaderIcon>
                  <StyledCollapseHeaderIcon mode="close" $active={active}>
                    {closeIcon}
                  </StyledCollapseHeaderIcon>
                </div>
              )}

              <h3>{item.title}</h3>
            </StyledCollapseHeader>

            <StyledCollapseContent
              $active={active}
              $size={size}
              $iconPosition={iconPosition}
              $iconsHidden={openAll}
            >
              <p>{item.content}</p>
            </StyledCollapseContent>
          </StyledCollapseItem>
        );
      })}
    </StyledCollapse>
  );
};

export default Collapse;
