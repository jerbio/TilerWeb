import GettingStartedHero from '@/assets/articles/hero.png';
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
import TravelInline2 from '@/assets/articles/travel-inline-2.svg';
import NLSHero from '@/assets/articles/nls-hero.svg';
import NLSStep1 from '@/assets/articles/nls-step1.svg';
import NLSStep2 from '@/assets/articles/nls-step2.svg';
import NLSStep3 from '@/assets/articles/nls-step3.svg';
import TileshareHero from '@/assets/articles/tileshare-hero.svg';
import TileshareStep1 from '@/assets/articles/tileshare-step1.svg';
import TileshareStep2 from '@/assets/articles/tileshare-step2.svg';
import TileshareStep3 from '@/assets/articles/tileshare-step3.svg';

export interface ArticleSection {
	type: 'prose' | 'heading' | 'step' | 'callout' | 'image' | 'quote';
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
	// quote
	quote?: string;
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
		slug: 'getting-started-with-tiler',
		category: 'GETTING STARTED',
		title: 'Your First Five Minutes with Tiler',
		subtitle:
			'Tiler builds your perfect timeline from three things: your goals, your appointments, and your location.',
		excerpt:
			"Most scheduling tools start from an empty grid. Tiler learns the shape of your day first, then builds a constraint-aware, location-anchored timeline that actually fits your life.",
		readTime: '6 min read',
		author: 'Tiler Team',
		date: 'May 1, 2026',
		coverImage: GettingStartedHero,
		sections: [],
	},
	{
		slug: 'natural-language-scheduling',
		category: 'FEATURES',
		title: 'Natural-Language Scheduling',
		subtitle: 'Just tell Tiler what you need to do, in plain English, and watch a smart schedule appear.',
		excerpt:
			'Stop wrestling with drag-and-drop. Just tell Tiler what you need to do in plain English and watch a smart schedule appear.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 1, 2026',
		coverImage: NLSHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Most scheduling tools treat you like a calendar operator. You drag, you drop, you resize, and then life changes and you start over. Tiler takes a different approach: you talk, it schedules.',
			},
			{
				type: 'prose',
				text: 'Type something like "Dentist at 9 AM Thursday, then coffee with Priya downtown around 11" and Tiler handles the rest. Duration, travel time, buffer gaps, confirmation. All of it.',
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
					'Type what you need to do in plain English. No special syntax, no dropdowns. "Gym session tomorrow morning for an hour" is enough to get started.',
				callout: {
					label: 'What Tiler understands',
					text: 'Relative time ("tomorrow"), duration ("an hour"), and location cues ("downtown"). No extra setup needed.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'The AI fills in the gaps',
				stepImage: NLSStep2,
				stepBody:
					'Tiler reasons about your request before responding. It infers duration from context, checks your existing commitments, and accounts for travel. If one detail is genuinely unclear, it asks one targeted question, never a form.',
				callout: {
					label: 'Reasoning, not guessing',
					text: 'Tiler cross-references your location, your existing tiles, and your preferred time windows before it proposes anything.',
				},
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Review, then confirm',
				stepImage: NLSStep3,
				stepBody:
					'Tiler shows you the proposed schedule with full details: time, location, and travel. You confirm, adjust, or ask for alternatives. Nothing lands on your calendar without your say-so.',
				callout: {
					label: 'Confirmation-first',
					text: 'Tiler proposes. You decide. You stay in control even as the AI does the heavy lifting.',
				},
			},
			{
				type: 'quote',
				quote: 'You live it. Tiler plans it.',
			},
		],
	},
	{
		slug: 'smart-travel-and-location',
		category: 'FEATURES',
		title: 'Smart Travel and Location',
		subtitle: "A schedule that ignores location isn't a schedule. It's a guess.",
		excerpt:
			'Tiler calculates travel time between every commitment and builds it into your day so your schedule reflects real life, not wishful thinking.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 8, 2026',
		coverImage: TravelHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: "Most calendars assume that once one task ends, you're ready for the next. But real life has a commute. Tiler builds that commute into your schedule, so every block in your timeline actually reflects where you need to be.",
			},
			{
				type: 'prose',
				text: "Add a meeting, an errand, a coffee catch-up, or a school pickup. Tiler automatically calculates how you'll get there and how long it takes, then slots travel time directly into your day.",
			},
			{
				type: 'heading',
				title: 'How it works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Set your locations once',
				stepImage: TravelInline1,
				stepBody:
					"You don't need to enter exact addresses every time. Set your home, work, and any regular spots once. From then on, Tiler knows where you're starting from and where you're headed.",
				callout: {
					label: 'Location labels Tiler understands',
					text: 'Home · Work · Downtown · The gym · Near the office',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'Travel time slots into your timeline',
				stepImage: TravelInline2,
				stepBody:
					'Every time you add a task with a location, Tiler inserts a travel block between it and whatever comes before or after. It appears as its own segment in your timeline, so you always know when you need to leave.',
				callout: {
					label: 'Real routes, not estimates',
					text: 'Tiler uses live routing data covering driving, transit, and walking so travel time reflects how you actually get around.',
				},
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Nearby tasks get grouped automatically',
				stepImage: TravelHero,
				stepBody:
					"When multiple tasks share the same area of town, Tiler groups them together so you're not zigzagging across the city. Errands near your gym land before or after your workout. A client visit near downtown gets paired with your lunch nearby.",
				callout: {
					label: 'Less travel, more done',
					text: 'Smart grouping means fewer trips, less wasted time in transit, and a day that flows the way it should.',
				},
			},
			{
				type: 'quote',
				quote: "Getting something done isn't just about finding the time. It's about being in the right place.",
			},
		],
	},
	{
		slug: 'schedule-undo',
		category: 'FEATURES',
		title: 'Schedule Undo',
		subtitle:
			'Every schedule change shows you a live preview first. Undo it instantly or accept it with confidence. Your original plan is always one tap away.',
		excerpt:
			'Preview any schedule change before it saves. Undo it instantly or accept it with confidence. Your live schedule is never touched without your approval.',
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'June 22, 2026',
		coverImage: ScheduleUndoHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: "Changing your schedule feels risky. Move one task and you're not sure what else shifts. Accept a suggestion and wonder if it was the right call. Schedule Undo gives you a safe zone between intention and commitment.",
			},
			{
				type: 'prose',
				text: 'Every change in Tiler, whether you typed a request, accepted a suggestion, or moved a tile, first appears as a preview. Your live schedule stays untouched until you say so.',
			},
			{
				type: 'heading',
				title: 'How Schedule Undo works',
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: 'Make a change',
				stepImage: ScheduleUndoStep1,
				stepBody:
					'Move a tile, add a new task, or accept an AI suggestion. Instead of saving immediately, Tiler drops the change into preview. It shows with a dashed border and a PREVIEW label so you know it has not landed yet.',
				callout: {
					label: 'Nothing saves automatically',
					text: 'Your live schedule is frozen while you review. No partial saves, no accidental overwrites.',
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'See exactly what changed',
				stepImage: ScheduleUndoStep2,
				stepBody:
					'The preview tile shows the updated name, location, time, and date alongside what was there before. You see the full picture at a glance without having to mentally track what moved.',
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Tap Undo or Accept',
				stepImage: ScheduleUndoStep3,
				stepBody:
					'Not happy with the result? Tap Undo and your original schedule snaps back instantly. Happy with it? Tap Accept and it locks in. Either way, you made the call.',
				callout: {
					label: 'Undo is always instant',
					text: 'No undo history to scroll through. One tap and your exact original state is back, no matter how much shifted in the preview.',
				},
			},
			{
				type: 'heading',
				title: 'Why this matters',
			},
			{
				type: 'prose',
				text: 'Most calendar apps apply changes immediately and ask you to undo after the fact, by which point notifications have fired, sync has happened, and the damage is done. Schedule Undo flips this. The default is preview, not save.',
			},
			{
				type: 'callout',
				label: 'Built for tightly packed days',
				text: 'When your day has no slack, a wrong move can ripple across everything. Schedule Undo gives you a moment to breathe and verify before any change goes live.',
			},
			{
				type: 'prose',
				text: "Whether you're rescheduling a workout, shifting a meeting, or taking on a task a colleague sent you, the preview step takes less than a second and can save you from a call you'd regret.",
			},
			{
				type: 'quote',
				quote: 'Change your mind before it counts.',
			},
		],
	},
	{
		slug: 'tileshare',
		category: 'FEATURES',
		title: 'Tileshare',
		subtitle:
			"Send a task directly into someone else's schedule. It fits around their day automatically. No back-and-forth required.",
		excerpt:
			"Send adaptive tasks directly into someone else's Tiler. They land, they fit, they get done. No coordination overhead.",
		readTime: '4 min read',
		author: 'Tiler Team',
		date: 'May 22, 2026',
		coverImage: TileshareHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: 'Most task handoffs end up in a thread. You send it, they read it, they forget to schedule it, you follow up. Tileshare cuts out the middle. Share a tile and it lands in their Tiler, already scheduled.',
			},
			{
				type: 'prose',
				text: "When you share a tile, it arrives as a live adaptive task in the recipient's schedule. It finds the best open slot around their existing commitments. No placement required on either end.",
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
					'From any task in your schedule, tap Share and select a Tiler contact. The tile is sent with everything the recipient needs to get it done.',
				callout: {
					label: 'What travels with the tile',
					text: "Task name, estimated duration, deadline, and location tags. The recipient's personal schedule stays completely private.",
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: 'It lands in their schedule',
				stepImage: TileshareStep2,
				stepBody:
					"The shared tile appears in the recipient's Tiler and finds the best open slot around their existing commitments. It adapts to their day, not the other way around.",
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: 'Track it without chasing',
				stepImage: TileshareStep3,
				stepBody:
					"Once the task is sent, you can see when it was scheduled, when it gets done, and if it gets moved. No follow-up messages. No status checks. You'll know.",
				callout: {
					label: 'Shared accountability, zero friction',
					text: 'Both sides see the same tile. One completes it. The other sees it done. Delegation that actually closes the loop.',
				},
			},
			{
				type: 'quote',
				quote: 'Send it once. Know it gets done.',
			},
		],
	},
];

export function getArticleBySlug(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}
