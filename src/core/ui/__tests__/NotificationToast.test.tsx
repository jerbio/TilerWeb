import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@/test/test-utils';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@/core/theme/light';
import NotificationToast from '../NotificationToast';
import useUiStore from '../uiStore';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

describe('NotificationToast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		act(() => {
			useUiStore.getState().notification.clear();
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders nothing when there are no notifications', () => {
		renderWithTheme(<NotificationToast />);
		expect(screen.queryByTestId('notification-toast-container')).not.toBeInTheDocument();
	});

	it('renders a notification when one is shown', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Updating schedule...', 'loading');
		});

		renderWithTheme(<NotificationToast />);

		expect(screen.getByTestId('notification-toast-container')).toBeInTheDocument();
		expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
		expect(screen.getByText('Updating schedule...')).toBeInTheDocument();
		expect(screen.getByTestId('notification-icon-loading')).toBeInTheDocument();
	});

	it('renders multiple notifications stacked', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Loading...', 'loading');
			useUiStore.getState().notification.show('t2', 'Done!', 'success');
		});

		renderWithTheme(<NotificationToast />);

		const toasts = screen.getAllByTestId('notification-toast');
		expect(toasts).toHaveLength(2);
	});

	it('shows correct icon for each type', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'msg', 'loading');
		});
		const { unmount: u1 } = renderWithTheme(<NotificationToast />);
		expect(screen.getByTestId('notification-icon-loading')).toBeInTheDocument();
		u1();

		act(() => {
			useUiStore.getState().notification.clear();
			useUiStore.getState().notification.show('t2', 'msg', 'success');
		});
		const { unmount: u2 } = renderWithTheme(<NotificationToast />);
		expect(screen.getByTestId('notification-icon-success')).toBeInTheDocument();
		u2();

		act(() => {
			useUiStore.getState().notification.clear();
			useUiStore.getState().notification.show('t3', 'msg', 'error');
		});
		const { unmount: u3 } = renderWithTheme(<NotificationToast />);
		expect(screen.getByTestId('notification-icon-error')).toBeInTheDocument();
		u3();

		act(() => {
			useUiStore.getState().notification.clear();
			useUiStore.getState().notification.show('t4', 'msg', 'info');
		});
		renderWithTheme(<NotificationToast />);
		expect(screen.getByTestId('notification-icon-info')).toBeInTheDocument();
	});

	it('dismisses notification when close button is clicked', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Hello', 'info', null);
		});

		renderWithTheme(<NotificationToast />);
		expect(screen.getByText('Hello')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('notification-dismiss'));

		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
	});

	it('auto-dismisses success notifications after autoDismissMs', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Done!', 'success');
		});

		renderWithTheme(<NotificationToast />);
		expect(screen.getByText('Done!')).toBeInTheDocument();

		// Advance past auto-dismiss
		act(() => {
			vi.advanceTimersByTime(3100);
		});

		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
	});

	it('does not auto-dismiss loading notifications', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Processing...', 'loading');
		});

		renderWithTheme(<NotificationToast />);

		act(() => {
			vi.advanceTimersByTime(10000);
		});

		// Should still be present
		expect(screen.getByText('Processing...')).toBeInTheDocument();
	});

	it('transitions from loading to success and auto-dismisses', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'Processing...', 'loading');
		});

		renderWithTheme(<NotificationToast />);
		expect(screen.getByText('Processing...')).toBeInTheDocument();
		expect(screen.getByTestId('notification-icon-loading')).toBeInTheDocument();

		// Transition to success
		act(() => {
			useUiStore.getState().notification.update('t1', 'Complete!', 'success');
		});

		expect(screen.getByText('Complete!')).toBeInTheDocument();
		expect(screen.getByTestId('notification-icon-success')).toBeInTheDocument();

		// Auto-dismiss after 3s
		act(() => {
			vi.advanceTimersByTime(3100);
		});

		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
	});

	it('renders dismiss button with accessible label', () => {
		act(() => {
			useUiStore.getState().notification.show('t1', 'msg', 'info', null);
		});

		renderWithTheme(<NotificationToast />);

		const btn = screen.getByTestId('notification-dismiss');
		expect(btn).toHaveAttribute('aria-label', 'Dismiss notification');
	});
});
