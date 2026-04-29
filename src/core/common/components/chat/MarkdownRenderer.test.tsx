import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { MarkdownRenderer } from './MarkdownRenderer';

const renderWithTheme = (ui: React.ReactElement) => {
	return render(<ThemeProvider defaultTheme="dark">{ui}</ThemeProvider>);
};

describe('MarkdownRenderer', () => {
	it('renders GitHub-flavored markdown tables as table elements', () => {
		const content = [
			'| Name | Value |',
			'| --- | --- |',
			'| Alpha | One |',
			'| Beta | Two |',
		].join('\n');

		renderWithTheme(<MarkdownRenderer content={content} />);

		expect(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();
		expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
		expect(screen.getByRole('cell', { name: 'Two' })).toBeInTheDocument();
	});
});
