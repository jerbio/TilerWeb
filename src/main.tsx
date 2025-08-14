import React from 'react';
import './index.css';
import App from './App.tsx';
import { createRoot } from 'react-dom/client';
import './i18n/config.ts';

createRoot(document.getElementById('root')!).render(<App />);
