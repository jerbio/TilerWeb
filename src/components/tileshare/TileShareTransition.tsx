import { ReactNode, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { tileShareReveal } from './tileshareMotion';

/** Key the inner surface, so changing views animates without remounting page state. */
export default function TileShareTransition({
	children,
	viewKey,
	focus = false,
	fill = false,
}: {
	children: ReactNode;
	viewKey: string;
	focus?: boolean;
	fill?: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		if (!focus || !ref.current) return;
		const heading = ref.current.querySelector<HTMLElement>('h1, h2');
		const target = heading ?? ref.current;
		target.setAttribute('tabindex', '-1');
		target.focus({ preventScroll: true });
	}, [viewKey, focus]);
	return (
		<Surface key={viewKey} ref={ref} $fill={fill}>
			{children}
		</Surface>
	);
}

const Surface = styled.div<{ $fill: boolean }>`
	min-width: 0;
	min-height: 0;
	height: ${({ $fill }) => ($fill ? '100%' : 'auto')};
	${tileShareReveal}
`;
