import React from 'react';
import Navigation from '../components/navigation';
import FooterSection from '../components/footer_section';
import { Outlet } from 'react-router';

function Layout() {
	return (
		<React.Fragment>
			<Navigation />
			<main>
				<Outlet />
			</main>
			<FooterSection />
		</React.Fragment>
	);
}

export default Layout;
