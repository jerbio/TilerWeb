import { useEffect, useState } from 'react';

function useIsMobile(breakpoint = 768) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < breakpoint);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);

	return isMobile;
}

export default useIsMobile;
// This hook can be used to determine if the current viewport is below a specified breakpoint, defaulting to 768px.
