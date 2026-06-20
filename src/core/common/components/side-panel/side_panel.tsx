import React from 'react';
import { SidePanelEntry } from './side_panel_types';

interface SidePanelProps {
	stack: SidePanelEntry[];
}

const SidePanel: React.FC<SidePanelProps> = ({ stack }) => {
	if (stack.length === 0) {
		return null;
	}

	const top = stack[stack.length - 1];
	return <>{top.content}</>;
};

export default SidePanel;
