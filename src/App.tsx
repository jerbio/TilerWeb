import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Features from './pages/Features';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route index element={<Home />} />
					<Route path="/features" element={<Features />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;

