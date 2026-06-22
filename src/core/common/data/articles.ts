import TilesBackground from '@/assets/highlights/tiles.jpg';
import MountainBackground from '@/assets/highlights/mountain.jpg';
import FitnessBackground from '@/assets/highlights/fitness.jpg';
import LocationBackground from '@/assets/highlights/location.jpg';
import ScheduleUndoStep1 from '@/assets/articles/schedule-undo-step1.svg';
import ScheduleUndoStep2 from '@/assets/articles/schedule-undo-step2.svg';
import ScheduleUndoStep3 from '@/assets/articles/schedule-undo-step3.svg';

export interface ArticleSection {
	type: 'prose' | 'heading' | 'step' | 'callout' | 'image';
	// prose
	text?: string;
	lead?: boolean;
	// heading
	title?: string;
	// step
	stepNumber?: number;
	stepTitle?: string;
	stepImage?: string;
	stepBody?: string;
	callout?: { label: string; text: string };
	// callout (standalone)
	label?: string;
	// image
	src?: string;
	caption?: string;
}

export interface Article {
	slug: string;
	category: string;
	title: string;
	subtitle: string;
	excerpt: string;
	readTime: string;
	author: string;
	date: string;
	coverImage: string;
	sections: ArticleSection[];
}

export const articles: Article[] = [
	{
		slug: 'natural-language-scheduling',
		category: 'FEATURES',
		title: 'Natural-Language Scheduling',
		subtitle:
			'Stop wrestling with drag-and-drop. Just tell Tiler what you need to do — in plain English — and watch a smart schedule appear.',
		excerpt:
			'Stop wrestling with drag-and-drop. Just tell Tiler what you need to do — in plain English — and watch a smart schedule appear.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 1, 2026',
		coverImage: TilesBackground,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Most scheduling tools treat you like a calendar operator. You drag, you drop, you resize — and then life changes and you start over. Tiler takes a different approach: you talk, it schedules.',
			},
			{
				type: 'prose',
				text: 'Natural-language scheduling means you can type or say something like "Dentist at 9 AM Thursday, then coffee with Priya downtown around 11" and Tiler handles everything else — duration, travel time, buffer gaps, and confirmation.',
			},
			{
				type: 'heading',
				title: 'How It Works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Describe the task',
				stepImage: TilesBackground,
				stepBody:
					'Type what you need to do in plain English. No special syntax, no dropdowns. "Gym session tomorrow morning for an hour" is enough.',
				callout: {
					label: 'Why this matters',
					text: 'Tiler understands relative time ("tomorrow"), duration ("an hour"), and location cues ("downtown") without any extra setup.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'Tiler asks follow-up questions',
				stepImage: TilesBackground,
				stepBody:
					'If Tiler needs more context — a preferred time window, a specific location, or a deadline — it asks. One question at a time, never a form.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Review and confirm',
				stepImage: TilesBackground,
				stepBody:
					'Tiler shows you the proposed schedule. You confirm, adjust, or ask for alternatives. Nothing goes on your calendar without your say-so.',
				callout: {
					label: 'Confirmation-first',
					text: 'Tiler proposes — you decide. This keeps you in control even as the AI does the heavy lifting.',
				},
			},
		],
	},
	{
		slug: 'smart-travel-and-location',
		category: 'FEATURES',
		title: 'Smart Travel & Location',
		subtitle:
			'Tiler automatically inserts travel time between your commitments and keeps your schedule honest as the day shifts.',
		excerpt:
			'Tiler automatically inserts travel time between your commitments and keeps your schedule honest as the day shifts.',
		readTime: '5 min read',
		author: 'Tiler Team',
		date: 'May 8, 2026',
		coverImage: MountainBackground,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Back-to-back meetings look fine on paper until you remember one is downtown and the other is at the airport. Tiler sees the gap before you do — and fills it with realistic travel time automatically.',
			},
			{
				type: 'prose',
				text: 'You don\'t need to enter specific addresses. Use labels like "home", "work", or "gym" and Tiler handles the distance calculation behind the scenes, without storing or sharing your exact location.',
			},
			{
				type: 'heading',
				title: 'Travel Time, Done Right',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Use location labels, not addresses',
				stepImage: MountainBackground,
				stepBody:
					'Tag tasks with places you already know — "client office", "home", "co-working space". Tiler maps these to travel durations without requiring precise coordinates.',
				callout: {
					label: 'Privacy-first',
					text: 'Tiler calculates travel time using approximate zones, not GPS coordinates. Your personal address is never required.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'Travel blocks added automatically',
				stepImage: MountainBackground,
				stepBody:
					'When Tiler schedules a task at a new location, it inserts a travel tile before it. You see the full picture — task plus commute — not just the appointment.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Schedule adjusts when things change',
				stepImage: MountainBackground,
				stepBody:
					'If a meeting runs long or you add a new commitment, Tiler recalculates travel windows across your whole day — so you\'re never late because the app didn\'t account for the drive.',
				callout: {
					label: 'Adaptive by design',
					text: 'Location and time are treated as a pair. Move one task and the travel buffers around it update automatically.',
				},
			},
		],
	},
	{
		slug: 'schedule-undo',
		category: 'FEATURES',
		title: 'Schedule Undo — Change Your Mind Before It Counts',
		subtitle:
			'Every schedule change shows you a live preview. Undo it instantly, or accept it with confidence. Your original plan is always one tap away.',
		excerpt:
			'Preview any schedule change before it saves. Undo it instantly or accept it with confidence — your live schedule is never touched without your approval.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'June 22, 2026',
		coverImage: FitnessBackground,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Changing your schedule feels risky. Move one task and you\'re not sure what else shifts. Accept a suggestion and wonder if it was the right call. Schedule Undo gives you a safe zone between intention and commitment.',
			},
			{
				type: 'prose',
				text: 'Every change in Tiler — whether you typed a request, accepted a suggestion, or dragged a tile — first appears as a preview. Your live schedule stays untouched until you say so.',
			},
			{
				type: 'heading',
				title: 'How Schedule Undo Works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Propose or accept a change',
				stepImage: ScheduleUndoStep1,
				stepBody:
					'Move a tile, add a new task, or accept an AI suggestion. Instead of saving immediately, Tiler drops the change into a preview state — shown with a dashed border and a PREVIEW label so you can\'t miss it.',
				callout: {
					label: 'Nothing saves automatically',
					text: 'Your live schedule is frozen while you review. No partial saves, no accidental overwrites.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'Review the proposed tile',
				stepImage: ScheduleUndoStep2,
				stepBody:
					'The preview tile shows your updated name, location, time, and date side by side with what was there before. You can see exactly what changed at a glance — no need to mentally track it.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Tap Undo or Accept',
				stepImage: ScheduleUndoStep3,
				stepBody:
					'Not happy with what you see? Tap Undo and your original schedule snaps back instantly — no undo history to dig through. Happy with the change? Tap Accept and it\'s locked in.',
				callout: {
					label: 'Undo is always instant',
					text: 'It doesn\'t matter how complex the ripple was — Undo restores your exact original state in one tap.',
				},
			},
			{
				type: 'heading',
				title: 'Why This Matters',
			},
			{
				type: 'prose',
				text: 'Most calendar apps apply changes immediately and ask you to undo after the fact — by which point notifications have fired, sync has happened, and the damage is done. Schedule Undo flips this: the default is preview, not save.',
			},
			{
				type: 'callout',
				label: 'Designed for busy schedules',
				text: 'When your day is tightly packed, a wrong move can cascade. Schedule Undo gives you a moment to breathe and verify before any change ripples outward.',
			},
			{
				type: 'prose',
				text: 'Whether you\'re rescheduling a workout, shifting a meeting, or accepting a new task from a colleague — the preview step takes less than a second and can save you from a scheduling mistake you\'d regret.',
			},
		],
	},
	{
		slug: 'tileshare',
		category: 'FEATURES',
		title: 'Tileshare — Schedule Together',
		subtitle:
			'Send adaptive tasks directly into someone else\'s Tiler. They land, they fit, they get done — no back-and-forth required.',
		excerpt:
			'Send adaptive tasks directly into someone else\'s Tiler. They land, they fit, they get done — no back-and-forth required.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 22, 2026',
		coverImage: LocationBackground,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Coordinating tasks across people usually means a thread of messages, a shared spreadsheet, or a calendar invite that lands at the wrong time. Tileshare replaces all of that with one action.',
			},
			{
				type: 'prose',
				text: 'When you share a tile, it arrives in the recipient\'s Tiler as a live adaptive task. It finds a slot that works around their existing schedule — not just the first open gap, but the best one given their constraints.',
			},
			{
				type: 'heading',
				title: 'How Tileshare Works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Share any tile',
				stepImage: LocationBackground,
				stepBody:
					'From any task in your schedule, tap Share and select a Tiler contact. The tile — including its duration, deadline, and location context — is sent as-is.',
				callout: {
					label: 'What gets shared',
					text: 'The task details travel with the tile: name, estimated duration, deadline, and any location tags. The recipient\'s personal schedule stays private.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'It lands in their schedule automatically',
				stepImage: LocationBackground,
				stepBody:
					'The shared tile appears in the recipient\'s Tiler and is scheduled around their existing commitments. No manual placement required on their end.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Both sides stay in sync',
				stepImage: LocationBackground,
				stepBody:
					'If the task is completed or rescheduled, the sender can see the status. No more "did you get to that?" follow-ups — Tileshare keeps everyone on the same page.',
				callout: {
					label: 'Great for teams and households',
					text: 'Whether you\'re delegating work tasks or splitting household errands, Tileshare makes shared responsibility visible and manageable.',
				},
			},
		],
	},
];

export function getArticleBySlug(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}
