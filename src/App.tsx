import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Features from './pages/Features';
import { Toaster } from 'sonner';
import useAppStore from './global_state';

const App: React.FC = () => {
	const setUserInfo = useAppStore((state) => state.setUserInfo);

	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				// Get sessionId or userId from localStorage or login flow
				const sessionId = localStorage.getItem('sessionId') || 'default-session-id';

				// Call the endpoint to fetch user info
				const response = await fetch(`/api/user-info?sessionId=${sessionId}`);
				if (!response.ok) throw new Error('Failed to fetch user info');
				const data = await response.json();

				// Update global state with user info
				setUserInfo({
					userId: data.userId,
					name: data.name,
					email: data.email,
					scheduleId: data.scheduleId,
				});
			} catch (error) {
				console.error('Error fetching user info:', error);
			}
		};

		fetchUserInfo();
	}, [setUserInfo]);

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
