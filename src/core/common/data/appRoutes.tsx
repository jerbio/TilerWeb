import { Calendar, ListTodo } from 'lucide-react';

const appRoutes: Array<{
	path: string;
	name: string;
	icon: React.ReactNode;
}> = [
	{
		path: '/timeline',
		name: 'Home',
		icon: <Calendar size={20} />,
	},
	{
		path: '/tileshare',
		name: 'Tileshare',
		icon: <ListTodo size={20} />,
	},
];

export default appRoutes;
