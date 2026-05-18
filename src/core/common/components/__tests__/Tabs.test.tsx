import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import Tabs from '@/core/common/components/Tabs';

const tabs = [
	{ id: 'overview', label: 'Overview' },
	{ id: 'settings', label: 'Settings' },
];

const renderWithTheme = (ui: React.ReactElement) => {
	return render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);
};

describe('Tabs', () => {
	describe('Rendering', () => {
		it('should render all tab labels', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} />);

			expect(screen.getByText('Overview')).toBeInTheDocument();
			expect(screen.getByText('Settings')).toBeInTheDocument();
		});

		it('should mark the active tab with aria-selected', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} />);

			expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
				'aria-selected',
				'true'
			);
			expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
				'aria-selected',
				'false'
			);
		});

		it('should render tablist with optional aria-label', () => {
			const onChange = vi.fn();
			renderWithTheme(
				<Tabs
					tabs={tabs}
					value="overview"
					onChange={onChange}
					aria-label="Section navigation"
				/>
			);

			expect(screen.getByRole('tablist', { name: 'Section navigation' })).toBeInTheDocument();
		});
	});

	describe('Interactions', () => {
		it('should call onChange with the clicked tab id', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} />);

			fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));

			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange).toHaveBeenCalledWith('settings');
		});

		it('should not call onChange when clicking the already active tab', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} />);

			fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));

			expect(onChange).not.toHaveBeenCalled();
		});

		it('should update aria-selected when value prop changes', () => {
			const onChange = vi.fn();
			const { rerender } = renderWithTheme(
				<Tabs tabs={tabs} value="overview" onChange={onChange} />
			);

			rerender(
				<ThemeProvider defaultTheme="dark">
					<Tabs tabs={tabs} value="settings" onChange={onChange} />
				</ThemeProvider>
			);

			expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
				'aria-selected',
				'true'
			);
			expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
				'aria-selected',
				'false'
			);
		});
	});

	describe('Disabled State', () => {
		it('should not call onChange when disabled', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} disabled />);

			fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));

			expect(onChange).not.toHaveBeenCalled();
		});

		it('should have reduced opacity when disabled', () => {
			const onChange = vi.fn();
			renderWithTheme(<Tabs tabs={tabs} value="overview" onChange={onChange} disabled />);

			expect(screen.getByRole('tab', { name: 'Overview' })).toHaveStyle({ opacity: '0.5' });
		});
	});
});
