import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import Input from '../input';

const renderInput = (ui: React.ReactElement) =>
	render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);

/** The wrapper div that carries the field's height rules. */
const wrapperOf = (field: HTMLElement) => field.parentElement as HTMLElement;

describe('Input', () => {
	it('binds a label to its control', () => {
		renderInput(<Input label="Name" placeholder="type here" />);
		expect(screen.getByLabelText('Name')).toBe(screen.getByPlaceholderText('type here'));
	});

	it('holds a single-line field at the sized height, so flex cannot collapse it', () => {
		renderInput(<Input placeholder="name" />);
		const styles = getComputedStyle(wrapperOf(screen.getByPlaceholderText('name')));
		// 40px is inputHeights.medium, the default size.
		expect(styles.height).toBe('40px');
		expect(styles.minHeight).toBe('40px');
	});

	it('respects an explicit height', () => {
		renderInput(<Input placeholder="name" height={50} />);
		expect(getComputedStyle(wrapperOf(screen.getByPlaceholderText('name'))).height).toBe(
			'50px'
		);
	});
});

describe('Input.Textarea', () => {
	it('binds a label to its control', () => {
		renderInput(<Input.Textarea label="Note" placeholder="type here" />);
		expect(screen.getByLabelText('Note')).toBe(screen.getByPlaceholderText('type here'));
	});

	// A multi-row textarea must grow with `rows` rather than being clipped to the
	// single-line input height.
	it('lets rows drive the height instead of the single-line height', () => {
		renderInput(<Input.Textarea placeholder="note" rows={6} />);
		const field = screen.getByPlaceholderText('note');
		const styles = getComputedStyle(wrapperOf(field));

		expect(styles.height).toBe('auto');
		expect(field).toHaveAttribute('rows', '6');
		// Still at least as tall as a single-line field.
		expect(styles.minHeight).toBe('40px');
	});

	it('respects an explicit height over rows', () => {
		renderInput(<Input.Textarea placeholder="note" height={50} rows={6} />);
		expect(getComputedStyle(wrapperOf(screen.getByPlaceholderText('note'))).height).toBe(
			'50px'
		);
	});
});
