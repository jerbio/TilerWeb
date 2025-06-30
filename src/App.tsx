import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Features from './pages/Features';
import { Toaster } from 'sonner';

const App: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route index element={<Home />} />
					<Route path="/features" element={<Features />} />
				</Route>
			</Routes>
			<Toaster position="bottom-left" theme="system" />
		</BrowserRouter>
	);
};

export default App;
