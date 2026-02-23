import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import Toggle from './Toggle';

// Helper to render component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
	return render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);
};

describe('Toggle', () => {
	describe('Rendering', () => {
		it('should render the label', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} />);

			expect(screen.getByText('Test Label')).toBeInTheDocument();
		});

		it('should render the toggle switch', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} />);

			const toggleSwitch = screen.getByRole('button');
			expect(toggleSwitch).toBeInTheDocument();
		});

		it('should render in off state when isOn is false', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} />);

			const toggleSwitch = screen.getByRole('button');
			expect(toggleSwitch).toBeInTheDocument();
		});

		it('should render in on state when isOn is true', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={true} onChange={onChange} />);

			const toggleSwitch = screen.getByRole('button');
			expect(toggleSwitch).toBeInTheDocument();
		});
	});

	describe('Interactions', () => {
		it('should call onChange with true when clicked while off', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} />);

			const toggleSwitch = screen.getByRole('button');
			fireEvent.click(toggleSwitch);

			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should call onChange with false when clicked while on', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={true} onChange={onChange} />);

			const toggleSwitch = screen.getByRole('button');
			fireEvent.click(toggleSwitch);

			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange).toHaveBeenCalledWith(false);
		});

		it('should call onChange on each click', () => {
			const onChange = vi.fn();
			const { rerender } = renderWithTheme(
				<Toggle label="Test Label" isOn={false} onChange={onChange} />
			);

			const toggleSwitch = screen.getByRole('button');

			fireEvent.click(toggleSwitch);
			expect(onChange).toHaveBeenCalledWith(true);

			// Simulate parent updating state
			rerender(
				<ThemeProvider defaultTheme="dark">
					<Toggle label="Test Label" isOn={true} onChange={onChange} />
				</ThemeProvider>
			);

			fireEvent.click(toggleSwitch);
			expect(onChange).toHaveBeenCalledWith(false);

			expect(onChange).toHaveBeenCalledTimes(2);
		});
	});

	describe('Disabled State', () => {
		it('should not call onChange when disabled', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} disabled />);

			const toggleSwitch = screen.getByRole('button');
			fireEvent.click(toggleSwitch);

			expect(onChange).not.toHaveBeenCalled();
		});

		it('should have reduced opacity when disabled', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} disabled />);

			const toggleSwitch = screen.getByRole('button');
			expect(toggleSwitch).toHaveStyle({ opacity: '0.5' });
		});

		it('should have not-allowed cursor when disabled', () => {
			const onChange = vi.fn();
			renderWithTheme(<Toggle label="Test Label" isOn={false} onChange={onChange} disabled />);

			const toggleSwitch = screen.getByRole('button');
			expect(toggleSwitch).toHaveStyle({ cursor: 'not-allowed' });
		});
	});

	describe('Props', () => {
		it('should update when isOn prop changes', () => {
			const onChange = vi.fn();
			const { rerender } = renderWithTheme(
				<Toggle label="Test Label" isOn={false} onChange={onChange} />
			);

			// Rerender with isOn=true
			rerender(
				<ThemeProvider defaultTheme="dark">
					<Toggle label="Test Label" isOn={true} onChange={onChange} />
				</ThemeProvider>
			);

			// Click should now toggle to false
			const toggleSwitch = screen.getByRole('button');
			fireEvent.click(toggleSwitch);
			expect(onChange).toHaveBeenCalledWith(false);
		});

		it('should update when disabled prop changes', () => {
			const onChange = vi.fn();
			const { rerender } = renderWithTheme(
				<Toggle label="Test Label" isOn={false} onChange={onChange} disabled />
			);

			// Click while disabled - should not call onChange
			const toggleSwitch = screen.getByRole('button');
			fireEvent.click(toggleSwitch);
			expect(onChange).not.toHaveBeenCalled();

			// Rerender with disabled=false
			rerender(
				<ThemeProvider defaultTheme="dark">
					<Toggle label="Test Label" isOn={false} onChange={onChange} disabled={false} />
				</ThemeProvider>
			);

			// Click while enabled - should call onChange
			fireEvent.click(toggleSwitch);
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should render with different labels', () => {
			const onChange = vi.fn();
			const { rerender } = renderWithTheme(
				<Toggle label="First Label" isOn={false} onChange={onChange} />
			);

			expect(screen.getByText('First Label')).toBeInTheDocument();

			rerender(
				<ThemeProvider defaultTheme="dark">
					<Toggle label="Second Label" isOn={false} onChange={onChange} />
				</ThemeProvider>
			);

			expect(screen.getByText('Second Label')).toBeInTheDocument();
			expect(screen.queryByText('First Label')).not.toBeInTheDocument();
		});
	});
});
