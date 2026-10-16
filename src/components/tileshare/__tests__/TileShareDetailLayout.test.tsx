import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@/test/test-utils';
import TileShareDetailLayout from '../TileShareDetailLayout';

vi.mock('../TileShareActivityTimeline', () => ({ default: () => null }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
afterEach(() => vi.unstubAllGlobals());

function setupObserver() {
	let callback: IntersectionObserverCallback;
	let options: IntersectionObserverInit | undefined;
	const observe = vi.fn(),
		disconnect = vi.fn();
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(cb: IntersectionObserverCallback, opts: IntersectionObserverInit) {
				callback = cb;
				options = opts;
			}
			observe = observe;
			disconnect = disconnect;
		}
	);
	return {
		observe,
		disconnect,
		root: () => options?.root as HTMLElement,
		notify: () => act(() => callback([], {} as IntersectionObserver)),
	};
}
function page(id = 'c', title: string | undefined = 'EOM goal') {
	return (
		<TileShareDetailLayout ClusterId={id} stickyTitle={title}>
			<div data-tileshare-header>
				<h1>{title}</h1>
				<p>Full share details</p>
			</div>
			<div>Tilettes</div>
		</TileShareDetailLayout>
	);
}

describe('collapsed share title', () => {
	it('pins the title only when the complete header has passed above the scroll viewport, and restores it on return', () => {
		const observer = setupObserver();
		render(page());
		const header = screen.getByRole('heading').parentElement!;
		const bar = screen.getByTitle('EOM goal').parentElement!;
		let bottom = 200;
		vi.spyOn(header, 'getBoundingClientRect').mockImplementation(
			() => ({ height: 150, bottom }) as DOMRect
		);
		vi.spyOn(observer.root(), 'getBoundingClientRect').mockReturnValue({ top: 60 } as DOMRect);
		expect(observer.observe).toHaveBeenCalledWith(header);
		observer.notify();
		expect(bar).toHaveAttribute('aria-hidden', 'true');
		bottom = 60;
		observer.notify();
		expect(bar).toHaveAttribute('aria-hidden', 'false');
		expect(screen.getByText('Full share details')).toBeInTheDocument();
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
		bottom = 100;
		observer.notify();
		expect(bar).toHaveAttribute('aria-hidden', 'true');
		bottom = 900;
		observer.notify();
		expect(bar).toHaveAttribute('aria-hidden', 'true');
	});
	it('disconnects observation when the share changes and on unmount', () => {
		const observer = setupObserver();
		const view = render(page());
		view.rerender(page('next', 'Next share'));
		expect(observer.disconnect).toHaveBeenCalledOnce();
		expect(screen.queryByTitle('EOM goal')).not.toBeInTheDocument();
		expect(screen.getByTitle('Next share').parentElement).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		view.unmount();
		expect(observer.disconnect).toHaveBeenCalledTimes(2);
	});
	it('leaves other detail pages unchanged when no sticky share title is provided', () => {
		const observer = setupObserver();
		render(
			<TileShareDetailLayout ClusterId="c">
				<div data-tileshare-header>Details</div>
			</TileShareDetailLayout>
		);
		expect(observer.observe).not.toHaveBeenCalled();
	});
});
