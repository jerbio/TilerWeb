import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import styled from 'styled-components';

export type TabItem = {
	id: string;
	label: string;
	icon?: React.ReactNode;
};

export type TabsProps = {
	tabs: TabItem[];
	value: string;
	onChange: (id: string) => void;
	disabled?: boolean;
	stretch?: boolean;
	className?: string;
	'aria-label'?: string;
};

type IndicatorRect = {
	left: number;
	width: number;
	height: number;
};

const CONTAINER_PADDING = 4;

const Tabs: React.FC<TabsProps> = ({
	tabs,
	value,
	onChange,
	disabled = false,
	stretch = false,
	className,
	'aria-label': ariaLabel,
}) => {
	const tabListRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
	const [immediate, setImmediate] = useState(true);
	const [indicatorRect, setIndicatorRect] = useState<IndicatorRect>({
		left: 0,
		width: 0,
		height: 0,
	});

	const measureIndicator = useCallback(() => {
		const activeTab = tabRefs.current.get(value);
		const tabList = tabListRef.current;
		if (!activeTab || !tabList) return;

		const listRect = tabList.getBoundingClientRect();
		const tabRect = activeTab.getBoundingClientRect();

		setIndicatorRect({
			left: tabRect.left - listRect.left,
			width: tabRect.width,
			height: tabRect.height,
		});
	}, [value]);

	useLayoutEffect(() => {
		measureIndicator();
		setImmediate(false);
	}, [measureIndicator, tabs]);

	useLayoutEffect(() => {
		const handleResize = () => measureIndicator();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [measureIndicator]);

	const indicatorSpring = useSpring({
		left: indicatorRect.left + CONTAINER_PADDING,
		width: indicatorRect.width,
		height: indicatorRect.height,
		config: { tension: 300, friction: 30 },
		immediate,
	});

	const setTabRef = (id: string) => (el: HTMLButtonElement | null) => {
		if (el) {
			tabRefs.current.set(id, el);
		} else {
			tabRefs.current.delete(id);
		}
	};

	const handleTabClick = (id: string) => {
		if (!disabled && id !== value) {
			onChange(id);
		}
	};

	return (
		<TabsContainer
			$stretch={stretch}
			className={className}
			role="tablist"
			aria-label={ariaLabel}
		>
			<AnimatedIndicator style={indicatorSpring} />
			<TabList $stretch={stretch} ref={tabListRef}>
				{tabs.map((tab) => {
					const isActive = tab.id === value;
					return (
						<TabButton
							key={tab.id}
							ref={setTabRef(tab.id)}
							type="button"
							role="tab"
							aria-selected={isActive}
							tabIndex={isActive ? 0 : -1}
							$active={isActive}
							$disabled={disabled}
							$stretch={stretch}
							disabled={disabled}
							onClick={() => handleTabClick(tab.id)}
						>
							{tab.label}
							{tab.icon && <TabIcon>{tab.icon}</TabIcon>}
						</TabButton>
					);
				})}
			</TabList>
		</TabsContainer>
	);
};

const TabsContainer = styled.div<{ $stretch: boolean }>`
	position: relative;
	display: ${({ $stretch }) => ($stretch ? 'flex' : 'inline-flex')};
	width: ${({ $stretch }) => ($stretch ? '100%' : 'auto')};
	padding: ${CONTAINER_PADDING}px;
	border: 1px solid ${({ theme }) => theme.colors.tabs.border};
	background: ${({ theme }) => theme.colors.tabs.bg};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const AnimatedIndicator = styled(animated.div)`
	position: absolute;
	top: ${CONTAINER_PADDING}px;
	left: 0;
	z-index: 0;
	background: ${({ theme }) => theme.colors.tabs.indicator};
	border-radius: ${({ theme }) => theme.borderRadius.little};
	pointer-events: none;
`;

const TabList = styled.div<{ $stretch: boolean }>`
	position: relative;
	z-index: 1;
	display: flex;
	gap: 2px;
	width: ${({ $stretch }) => ($stretch ? '100%' : 'auto')};
`;

const TabIcon = styled.span`
	display: inline-flex;
	align-items: center;
	margin-left: 6px;
`;

const TabButton = styled.button<{ $active: boolean; $disabled: boolean; $stretch: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: ${({ $stretch }) => ($stretch ? 1 : 'none')};
	border: none;
	background: transparent;
	padding: 8px 12px;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
	font-size: ${({ theme }) => theme.typography.fontSize.sm};
	font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
	line-height: 1;
	color: ${({ $active, theme }) =>
		$active ? theme.colors.tabs.textActive : theme.colors.tabs.text};
	white-space: nowrap;
	transition: color 0.15s ease;

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.border.strong};
		outline-offset: 2px;
		border-radius: ${({ theme }) => theme.borderRadius.little};
	}
`;

export default Tabs;
