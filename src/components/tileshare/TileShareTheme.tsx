import { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { tileShareTheme } from './tileshareVisuals';

export default function TileShareTheme({ children }: { children: ReactNode }) {
	return <ThemeProvider theme={tileShareTheme}>{children}</ThemeProvider>;
}
