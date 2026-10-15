import { ReactNode } from 'react';
import TileShareDialog from './TileShareDialog';

/** Keep detail actions on the same accessible, animated dialog as creation and notes. */
export default function TileShareModal({
	show,
	setShow,
	headerText,
	children,
	footer,
	size = 'compact',
	subtitle,
}: {
	show: boolean;
	setShow?: (show: boolean) => void;
	headerText: string;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'compact' | 'standard' | 'wide';
	subtitle?: string;
}) {
	return (
		<TileShareDialog
			size={size}
			subtitle={subtitle}
			open={show}
			title={headerText}
			dismissible={!!setShow}
			onClose={() => setShow?.(false)}
			footer={footer}
		>
			{children}
		</TileShareDialog>
	);
}
