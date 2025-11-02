import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Features from './pages/Features';
import { Toaster } from 'sonner';
import Waitlist from './pages/Waitlist';
import UserAuthentication from './pages/UserAuthentication';
import FooterSection from './components/footer_section';
import { ConsentProvider } from './core/common/components/consent';
import { HelmetProvider } from 'react-helmet-async';
// import useAppStore from './global_state';

const App: React.FC = () => {
  // TO USE WHEN WE ARE READY TO FETCH USER INFO
  // const setUserInfo = useAppStore((state) => state.setUserInfo);

  // useEffect(() => {
  // 	const fetchUserInfo = async () => {
  // 		try {
  // 			// Get sessionId or userId from localStorage or login flow
  // 			const sessionId = localStorage.getItem('sessionId') || 'default-session-id';

  // 			// Call the endpoint to fetch user info
  // 			const response = await fetch(`/api/user-info?sessionId=${sessionId}`);
  // 			if (!response.ok) throw new Error('Failed to fetch user info');
  // 			const data = await response.json();

  // 			// Update global state with user info
  // 			setUserInfo({
  // 				userId: data.userId,
  // 				name: data.name,
  // 				email: data.email,
  // 				scheduleId: data.scheduleId,
  // 			});
  // 		} catch (error) {
  // 			console.error('Error fetching user info:', error);
  // 		}
  // 	};

  // 	fetchUserInfo();
  // }, [setUserInfo]);

  return (
    <HelmetProvider>
      <ConsentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/features" element={<Features />} />
            </Route>
            <Route
              path="/waitlist"
              element={
                <>
                  <Waitlist />
                  <FooterSection />
                </>
              }
            />
            <Route
            path="/signup"
            element={
              <>
                <UserAuthentication />
                <FooterSection />
              </>
            }
          />
          <Route
            path="/signin"
            element={
              <>
                <UserAuthentication />
                <FooterSection />
              </>
            }
          />
        </Routes>
          <Toaster position="bottom-left" theme="system" />
        </BrowserRouter>
      </ConsentProvider>
    </HelmetProvider>
  );
};

export default App;
