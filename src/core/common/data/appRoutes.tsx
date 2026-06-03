import { Calendar, ListTodo } from 'lucide-react';
import ROUTES from '@/core/constants/routes';

const appRoutes: Array<{
	path: string;
	name: string;
	icon: React.ReactNode;
}> = [
	{
		path: ROUTES.timeline,
		name: 'Home',
		icon: <Calendar size={20} />,
	},
	{
		path: ROUTES.tileshare.root,
		name: 'Tileshare',
		icon: <ListTodo size={20} />,
	},
];

export default appRoutes;
