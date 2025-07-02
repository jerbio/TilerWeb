import React, { useState } from 'react';
import AddSquare from '../icons/add_square';
import styled from 'styled-components';
import styles from '../../util/styles';
import { a } from '@react-spring/web';
import CloseSquare from '../icons/close_square';

type CollapseProps = {
	items: Array<{
		title: string;
		content: React.ReactNode;
	}>;
};

const StyledCollapse = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
`;

const StyledCollapseItem = styled(a.li)`
	border-bottom: 1px solid ${styles.colors.gray[800]};
`;

const StyledCollapseHeader = styled.button<{ $active: boolean }>`
	width: 100%;
	cursor: pointer;
	display: flex;
	padding: 1rem 0;
	gap: 0.75rem;
	color: ${(props) => (props.$active ? styles.colors.brand[400] : styles.colors.gray[300])};
	font-weight: ${styles.typography.fontWeight.semibold};
	font-size: ${styles.typography.fontSize.lg};
	transition: color 0.3s ease;

	h3 {
		text-align: left;
	}

	div {
		height: 25px;
		width: 25px;
		position: relative;
		padding-block: 1.5px;
		color: ${(props) => (props.$active ? styles.colors.brand[400] : styles.colors.gray[500])};
		transition: color 0.3s ease;
	}

	&:hover div {
		${(props) => (props.$active ? '' : `color: ${styles.colors.gray[400]};`)}
	}

	@media (min-width: ${styles.screens.md}) {
		font-size: ${styles.typography.fontSize.xl};

		div {
			padding-block: 3px;
		}
	}
`;

const StyledCollapseContent = styled.div<{ $active: boolean }>`
	padding-left: calc(25px + 0.75rem);
	color: ${styles.colors.gray[500]};
	font-size: ${styles.typography.fontSize.base};
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
	transform: translate(-50%, -50%) rotate(${(props) => (props.$active ? '0deg' : '90deg')});
	opacity: ${(props) =>
		props.$active ? (props.mode === 'add' ? 0 : 1) : props.mode === 'add' ? 1 : 0};

	transition: transform 0.3s ease-in-out;
`;

const Collapse: React.FC<CollapseProps> = ({ items }) => {
	const keyedItems = items.map((item, index) => ({
		...item,
		key: item.title + index, // Ensure each item has a unique key
	}));

	const [currentKey, setCurrentKey] = useState<string | null>(null);

	return (
		<StyledCollapse>
			{keyedItems.map((item) => (
				<StyledCollapseItem key={item.key}>
					<StyledCollapseHeader
						$active={item.key === currentKey}
						onClick={() => setCurrentKey(currentKey === item.key ? null : item.key)}
					>
						<div>
							<StyledCollapseHeaderIcon mode="add" $active={item.key === currentKey}>
								<AddSquare />
							</StyledCollapseHeaderIcon>
							<StyledCollapseHeaderIcon
								mode="close"
								$active={item.key === currentKey}
							>
								<CloseSquare />
							</StyledCollapseHeaderIcon>
						</div>
						<h3>{item.title}</h3>
					</StyledCollapseHeader>
					<StyledCollapseContent $active={item.key === currentKey}>
						<p>{item.content}</p>
					</StyledCollapseContent>
				</StyledCollapseItem>
			))}
		</StyledCollapse>
	);
};

export default Collapse;
