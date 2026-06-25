import { Calendar, ListTodo } from 'lucide-react';
import { Routes } from '@/core/constants/routes';

const appRoutes: Array<{
	path: string;
	name: string;
	icon: React.ReactNode;
}> = [
	{
		path: Routes.Timeline,
		name: 'Home',
		icon: <Calendar size={20} />,
	},
	{
		path: Routes.Tileshare.root,
		name: 'Tileshare',
		icon: <ListTodo size={20} />,
	},
];

export default appRoutes;
