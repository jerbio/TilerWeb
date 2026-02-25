import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import userEvent from '@testing-library/user-event';

// Wrap components with providers for testing
function AllTheProviders({ children }: { children: ReactNode }) {
	return (
		<BrowserRouter>
			{children}
			<Toaster />
		</BrowserRouter>
	);
}

// Custom render with providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	render(ui, { wrapper: AllTheProviders, ...options });

// Setup userEvent instance (preferred over fireEvent)
export const setupUser = () => userEvent.setup();

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
