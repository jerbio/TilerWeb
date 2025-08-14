import React, { useState } from 'react';
import styled from 'styled-components';
import pallette from '@/core/theme/pallete';
import AddSquare from '@/core/common/components/icons/add_square';
import CloseSquare from '@/core/common/components/icons/close_square';
import { a } from '@react-spring/web';

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
	border-bottom: 1px solid ${pallette.colors.gray[800]};
`;

const StyledCollapseHeader = styled.button<{ $active: boolean }>`
	width: 100%;
	cursor: pointer;
	display: flex;
	padding: 1rem 0;
	gap: 0.75rem;
	color: ${(props) => (props.$active ? pallette.colors.brand[400] : pallette.colors.gray[300])};
	font-weight: ${pallette.typography.fontWeight.semibold};
	font-size: ${pallette.typography.fontSize.lg};
	transition: color 0.3s ease;

	h3 {
		text-align: left;
	}

	div {
		height: 25px;
		width: 25px;
		position: relative;
		padding-block: 1.5px;
		color: ${(props) => (props.$active ? pallette.colors.brand[400] : pallette.colors.gray[500])};
		transition: color 0.3s ease;
	}

	&:hover div {
		${(props) => (props.$active ? '' : `color: ${pallette.colors.gray[400]};`)}
	}

	@media (min-width: ${pallette.screens.md}) {
		font-size: ${pallette.typography.fontSize.xl};

		div {
			padding-block: 3px;
		}
	}
`;

const StyledCollapseContent = styled.div<{ $active: boolean }>`
	padding-left: calc(25px + 0.75rem);
	color: ${pallette.colors.gray[500]};
	font-size: ${pallette.typography.fontSize.base};
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
