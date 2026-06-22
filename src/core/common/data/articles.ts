import TilesBackground from '@/assets/highlights/tiles.jpg';
import MountainBackground from '@/assets/highlights/mountain.jpg';
import FitnessBackground from '@/assets/highlights/fitness.jpg';
import LocationBackground from '@/assets/highlights/location.jpg';
import ScheduleUndoStep1 from '@/assets/articles/schedule-undo-step1.svg';
import ScheduleUndoStep2 from '@/assets/articles/schedule-undo-step2.svg';
import ScheduleUndoStep3 from '@/assets/articles/schedule-undo-step3.svg';
import ScheduleUndoHero from '@/assets/articles/schedule-undo-hero.svg';
import TravelHero from '@/assets/articles/travel-hero.svg';
import TravelInline1 from '@/assets/articles/travel-inline-1.svg';
import NLSHero from '@/assets/articles/nls-hero.svg';
import NLSStep1 from '@/assets/articles/nls-step1.svg';
import NLSStep2 from '@/assets/articles/nls-step2.svg';
import NLSStep3 from '@/assets/articles/nls-step3.svg';
import TileshareHero from '@/assets/articles/tileshare-hero.svg';
import TileshareStep1 from '@/assets/articles/tileshare-step1.svg';
import TileshareStep2 from '@/assets/articles/tileshare-step2.svg';
import TileshareStep3 from '@/assets/articles/tileshare-step3.svg';

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
		subtitle: 'Just tell Tiler what you need to do — in plain English — and watch a smart schedule appear.',
		excerpt:
			'Stop wrestling with drag-and-drop. Just tell Tiler what you need to do — in plain English — and watch a smart schedule appear.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 1, 2026',
		coverImage: NLSHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Most scheduling tools treat you like a calendar operator. You drag, you drop, you resize — and then life changes and you start over. Tiler takes a different approach: you talk, it schedules.',
			},
			{
				type: 'prose',
				text: 'Type something like "Dentist at 9 AM Thursday, then coffee with Priya downtown around 11" and Tiler handles everything else — duration, travel time, buffer gaps, and confirmation.',
			},
			{
				type: 'heading',
				title: 'How it works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Describe the task',
				stepImage: NLSStep1,
				stepBody:
					'Type what you need to do in plain English. No special syntax, no dropdowns. "Gym session tomorrow morning for an hour" is enough.',
				callout: {
					label: 'What Tiler understands',
					text: 'Relative time ("tomorrow"), duration ("an hour"), and location cues ("downtown") — no extra setup needed.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'Tiler asks one follow-up',
				stepImage: NLSStep2,
				stepBody:
					'If Tiler needs more context — a preferred time window, a specific location, or a deadline — it asks. One question at a time, never a form.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Review and confirm',
				stepImage: NLSStep3,
				stepBody:
					'Tiler shows you the proposed schedule with full details — time, location, and travel. You confirm, adjust, or ask for alternatives. Nothing goes on your calendar without your say-so.',
				callout: {
					label: 'Confirmation-first',
					text: 'Tiler proposes — you decide. You stay in control even as the AI does the heavy lifting.',
				},
			},
		],
	},
	{
		slug: 'smart-travel-and-location',
		category: 'FEATURES',
		title: 'Smart Travel & Location',
		subtitle: "A schedule that ignores location isn't a schedule. It's a guess.",
		excerpt:
			'Tiler calculates travel time between every commitment and builds it into your day — so your schedule reflects real life, not wishful thinking.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 8, 2026',
		coverImage: TravelHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: "Most calendars assume that once one task ends, you're magically ready for the next one.",
			},
			{
				type: 'prose',
				text: "Real life doesn't work that way. You have to drive there. Walk there. Catch a train. Leave early enough to actually arrive on time.",
			},
			{
				type: 'prose',
				text: "That's why every location in Tiler becomes part of the schedule. Add a meeting, an errand, a coffee catch-up, or a school pickup — Tiler automatically calculates how you'll get there and how long it will take.",
			},
			{
				type: 'image',
				src: TravelInline1,
				caption:
					'Travel time appears as its own block in your timeline — between every commitment that involves a location change.',
			},
			{
				type: 'prose',
				text: 'Travel appears directly in your timeline as part of the day. Not assumed. Planned.',
			},
			{
				type: 'heading',
				title: 'No addresses required',
			},
			{
				type: 'prose',
				text: "Tiler is location-aware, but you don't need to enter exact addresses. Simply use labels:",
			},
			{
				type: 'callout',
				label: 'Location labels Tiler understands',
				text: 'Home · Work · Downtown · Near the office · The gym',
			},
			{
				type: 'prose',
				text: "Tiler understands where you're going, builds realistic routes, groups nearby tasks together, and lets you know when you need to leave.",
			},
			{
				type: 'prose',
				text: "Because getting something done isn't just about finding the time. It's about being in the right place too.",
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
		coverImage: ScheduleUndoHero,
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
		coverImage: TileshareHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Coordinating tasks across people usually means a thread of messages, a shared spreadsheet, or a calendar invite that lands at the wrong time. Tileshare replaces all of that with one tap.',
			},
			{
				type: 'prose',
				text: 'When you share a tile, it arrives in the recipient\'s Tiler as a live adaptive task — already scheduled around their day, no manual placement required.',
			},
			{
				type: 'heading',
				title: 'How Tileshare works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Share any tile',
				stepImage: TileshareStep1,
				stepBody:
					'From any task in your schedule, tap Share and select a Tiler contact. The tile — including its duration, deadline, and location — is sent as-is.',
				callout: {
					label: 'What travels with the tile',
					text: 'Task name, estimated duration, deadline, and location tags. The recipient\'s personal schedule stays completely private.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'It lands in their schedule automatically',
				stepImage: TileshareStep2,
				stepBody:
					'The shared tile appears in the recipient\'s Tiler and finds the best open slot around their existing commitments. No back-and-forth, no manual placement.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Both sides stay in sync',
				stepImage: TileshareStep3,
				stepBody:
					'If the task is completed or rescheduled, the sender sees the status update. No more "did you get to that?" — Tileshare keeps everyone on the same page.',
				callout: {
					label: 'Works for teams and households',
					text: 'Delegating work tasks or splitting errands — Tileshare makes shared responsibility visible without any extra tools.',
				},
			},
		],
	},
];

export function getArticleBySlug(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}
