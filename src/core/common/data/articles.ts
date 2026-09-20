import GettingStartedHero from '@/assets/articles/hero.png';
import NLSCard from '@/assets/articles/nls-card.png';
import SmartTravelCard from '@/assets/articles/smart-travel-card.png';
import ScheduleUndoCard from '@/assets/articles/schedule-undo-card.png';
import TileshareCard from '@/assets/articles/tileshare-card.png';
import NLSArticleHero from '@/assets/articles/nls-article-hero.png';
import SmartTravelArticleHero from '@/assets/articles/smart-travel-article-hero.png';
import ScheduleUndoArticleHero from '@/assets/articles/schedule-undo-article-hero.png';
import TileshareArticleHero from '@/assets/articles/tileshare-article-hero.png';
import ScheduleUndoStep1 from '@/assets/articles/schedule-undo-step1.svg';
import ScheduleUndoStep2 from '@/assets/articles/schedule-undo-step2.svg';
import ScheduleUndoStep3 from '@/assets/articles/schedule-undo-step3.svg';
import TravelHero from '@/assets/articles/travel-hero.svg';
import TravelInline1 from '@/assets/articles/travel-inline-1.svg';
import TravelInline2 from '@/assets/articles/travel-inline-2.svg';
import NLSStep1 from '@/assets/articles/nls-step1.svg';
import NLSStep2 from '@/assets/articles/nls-step2.svg';
import NLSStep3 from '@/assets/articles/nls-step3.svg';
import TileshareStep1 from '@/assets/articles/tileshare-step1.svg';
import TileshareStep2 from '@/assets/articles/tileshare-step2.svg';
import TileshareStep3 from '@/assets/articles/tileshare-step3.svg';
import AICalendarHero from '@/assets/articles/aicalendar-hero.svg';
import AICalendarCard from '@/assets/articles/aicalendar-card.svg';
import AICalendarJourney from '@/assets/articles/aicalendar-journey.svg';
import AICalendarStep1 from '@/assets/articles/aicalendar-step1.svg';
import AICalendarStep2 from '@/assets/articles/aicalendar-step2.svg';
import AICalendarStep3 from '@/assets/articles/aicalendar-step3.svg';
import type { TFunction } from 'i18next';

export interface FAQItem {
	question: string;
	answer: string;
}

export interface ArticleSection {
	type: 'prose' | 'heading' | 'step' | 'callout' | 'image' | 'quote' | 'link' | 'faq';
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
	// internal link ("Read next")
	to?: string;
	// FAQ
	items?: FAQItem[];
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
	heroImage?: string;
	sections: ArticleSection[];
}

const tr = (t: TFunction, key: string, fallback: string): string =>
	t(key, { defaultValue: fallback });

export const getArticles = (t: TFunction): Article[] => [
	{
		slug: 'getting-started-with-tiler',
		category: tr(t, 'articles.posts.gettingStarted.category', 'GETTING STARTED'),
		title: tr(t, 'articles.posts.gettingStarted.title', 'Your First Five Minutes with Tiler'),
		subtitle: tr(
			t,
			'articles.posts.gettingStarted.subtitle',
			'Tiler builds your perfect timeline from three things: your goals, your appointments, and your location.'
		),
		excerpt: tr(
			t,
			'articles.posts.gettingStarted.excerpt',
			'Most scheduling tools start from an empty grid. Tiler learns the shape of your day first, then builds a constraint-aware, location-anchored timeline that actually fits your life.'
		),
		readTime: tr(t, 'articles.posts.gettingStarted.readTime', '6 min read'),
		author: tr(t, 'articles.posts.gettingStarted.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.gettingStarted.date', 'May 1, 2026'),
		coverImage: GettingStartedHero,
		sections: [],
	},
	{
		slug: 'natural-language-scheduling',
		category: tr(t, 'articles.posts.naturalLanguageScheduling.category', 'FEATURES'),
		title: tr(
			t,
			'articles.posts.naturalLanguageScheduling.title',
			'Natural-Language Scheduling'
		),
		subtitle: tr(
			t,
			'articles.posts.naturalLanguageScheduling.subtitle',
			'Just tell Tiler what you need to do, in plain English, and watch a smart schedule appear.'
		),
		excerpt: tr(
			t,
			'articles.posts.naturalLanguageScheduling.excerpt',
			'Stop wrestling with drag-and-drop. Just tell Tiler what you need to do in plain English and watch a smart schedule appear.'
		),
		readTime: tr(t, 'articles.posts.naturalLanguageScheduling.readTime', '4 min read'),
		author: tr(t, 'articles.posts.naturalLanguageScheduling.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.naturalLanguageScheduling.date', 'May 1, 2026'),
		coverImage: NLSCard,
		heroImage: NLSArticleHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.0.text',
					'Most scheduling tools treat you like a calendar operator. You drag, you drop, you resize, and then life changes and you start over. Tiler takes a different approach: you talk, it schedules.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.1.text',
					'Type something like "Dentist at 9 AM Thursday, then coffee with Priya downtown around 11" and Tiler handles the rest. Duration, travel time, buffer gaps, confirmation. All of it.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.2.title',
					'How it works'
				),
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.3.stepTitle',
					'Describe the task'
				),
				stepImage: NLSStep1,
				stepBody: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.3.stepBody',
					'Type what you need to do in plain English. No special syntax, no dropdowns. "Gym session tomorrow morning for an hour" is enough to get started.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.3.callout.label',
						'What Tiler understands'
					),
					text: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.3.callout.text',
						'Relative time ("tomorrow"), duration ("an hour"), and location cues ("downtown"). No extra setup needed.'
					),
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.4.stepTitle',
					'The AI fills in the gaps'
				),
				stepImage: NLSStep2,
				stepBody: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.4.stepBody',
					'Tiler reasons about your request before responding. It infers duration from context, checks your existing commitments, and accounts for travel. If one detail is genuinely unclear, it asks one targeted question, never a form.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.4.callout.label',
						'Reasoning, not guessing'
					),
					text: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.4.callout.text',
						'Tiler cross-references your location, your existing tiles, and your preferred time windows before it proposes anything.'
					),
				},
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.5.stepTitle',
					'Review, then confirm'
				),
				stepImage: NLSStep3,
				stepBody: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.5.stepBody',
					'Tiler shows you the proposed schedule with full details: time, location, and travel. You confirm, adjust, or ask for alternatives. Nothing lands on your calendar without your say-so.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.5.callout.label',
						'Confirmation-first'
					),
					text: tr(
						t,
						'articles.posts.naturalLanguageScheduling.sections.5.callout.text',
						'Tiler proposes. You decide. You stay in control even as the AI does the heavy lifting.'
					),
				},
			},
			{
				type: 'quote',
				quote: tr(
					t,
					'articles.posts.naturalLanguageScheduling.sections.6.quote',
					'You live it. Tiler plans it.'
				),
			},
		],
	},
	{
		slug: 'smart-travel-and-location',
		category: tr(t, 'articles.posts.smartTravelAndLocation.category', 'FEATURES'),
		title: tr(t, 'articles.posts.smartTravelAndLocation.title', 'Smart Travel and Location'),
		subtitle: tr(
			t,
			'articles.posts.smartTravelAndLocation.subtitle',
			"A schedule that ignores location isn't a schedule. It's a guess."
		),
		excerpt: tr(
			t,
			'articles.posts.smartTravelAndLocation.excerpt',
			'Tiler calculates travel time between every commitment and builds it into your day so your schedule reflects real life, not wishful thinking.'
		),
		readTime: tr(t, 'articles.posts.smartTravelAndLocation.readTime', '4 min read'),
		author: tr(t, 'articles.posts.smartTravelAndLocation.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.smartTravelAndLocation.date', 'May 8, 2026'),
		coverImage: SmartTravelCard,
		heroImage: SmartTravelArticleHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.0.text',
					"Most calendars assume that once one task ends, you're ready for the next. But real life has a commute. Tiler builds that commute into your schedule, so every block in your timeline actually reflects where you need to be."
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.1.text',
					"Add a meeting, an errand, a coffee catch-up, or a school pickup. Tiler automatically calculates how you'll get there and how long it takes, then slots travel time directly into your day."
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.2.title',
					'How it works'
				),
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.3.stepTitle',
					'Set your locations once'
				),
				stepImage: TravelInline1,
				stepBody: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.3.stepBody',
					"You don't need to enter exact addresses every time. Set your home, work, and any regular spots once. From then on, Tiler knows where you're starting from and where you're headed."
				),
				callout: {
					label: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.3.callout.label',
						'Location labels Tiler understands'
					),
					text: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.3.callout.text',
						'Home · Work · Downtown · The gym · Near the office'
					),
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.4.stepTitle',
					'Travel time slots into your timeline'
				),
				stepImage: TravelInline2,
				stepBody: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.4.stepBody',
					'Every time you add a task with a location, Tiler inserts a travel block between it and whatever comes before or after. It appears as its own segment in your timeline, so you always know when you need to leave.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.4.callout.label',
						'Real routes, not estimates'
					),
					text: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.4.callout.text',
						'Tiler uses live routing data covering driving, transit, and walking so travel time reflects how you actually get around.'
					),
				},
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.5.stepTitle',
					'Nearby tasks get grouped automatically'
				),
				stepImage: TravelHero,
				stepBody: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.5.stepBody',
					"When multiple tasks share the same area of town, Tiler groups them together so you're not zigzagging across the city. Errands near your gym land before or after your workout. A client visit near downtown gets paired with your lunch nearby."
				),
				callout: {
					label: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.5.callout.label',
						'Less travel, more done'
					),
					text: tr(
						t,
						'articles.posts.smartTravelAndLocation.sections.5.callout.text',
						'Smart grouping means fewer trips, less wasted time in transit, and a day that flows the way it should.'
					),
				},
			},
			{
				type: 'quote',
				quote: tr(
					t,
					'articles.posts.smartTravelAndLocation.sections.6.quote',
					"Getting something done isn't just about finding the time. It's about being in the right place."
				),
			},
		],
	},
	{
		slug: 'schedule-undo',
		category: tr(t, 'articles.posts.scheduleUndo.category', 'FEATURES'),
		title: tr(t, 'articles.posts.scheduleUndo.title', 'Schedule Undo'),
		subtitle: tr(
			t,
			'articles.posts.scheduleUndo.subtitle',
			'Every schedule change shows you a live preview first. Undo it instantly or accept it with confidence. Your original plan is always one tap away.'
		),
		excerpt: tr(
			t,
			'articles.posts.scheduleUndo.excerpt',
			'Preview any schedule change before it saves. Undo it instantly or accept it with confidence. Your live schedule is never touched without your approval.'
		),
		readTime: tr(t, 'articles.posts.scheduleUndo.readTime', '4 min read'),
		author: tr(t, 'articles.posts.scheduleUndo.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.scheduleUndo.date', 'June 22, 2026'),
		coverImage: ScheduleUndoCard,
		heroImage: ScheduleUndoArticleHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: tr(
					t,
					'articles.posts.scheduleUndo.sections.0.text',
					"Changing your schedule feels risky. Move one task and you're not sure what else shifts. Accept a suggestion and wonder if it was the right call. Schedule Undo gives you a safe zone between intention and commitment."
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.scheduleUndo.sections.1.text',
					'Every change in Tiler, whether you typed a request, accepted a suggestion, or moved a tile, first appears as a preview. Your live schedule stays untouched until you say so.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.scheduleUndo.sections.2.title',
					'How Schedule Undo works'
				),
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: tr(
					t,
					'articles.posts.scheduleUndo.sections.3.stepTitle',
					'Make a change'
				),
				stepImage: ScheduleUndoStep1,
				stepBody: tr(
					t,
					'articles.posts.scheduleUndo.sections.3.stepBody',
					'Move a tile, add a new task, or accept an AI suggestion. Instead of saving immediately, Tiler drops the change into preview. It shows with a dashed border and a PREVIEW label so you know it has not landed yet.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.scheduleUndo.sections.3.callout.label',
						'Nothing saves automatically'
					),
					text: tr(
						t,
						'articles.posts.scheduleUndo.sections.3.callout.text',
						'Your live schedule is frozen while you review. No partial saves, no accidental overwrites.'
					),
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: tr(
					t,
					'articles.posts.scheduleUndo.sections.4.stepTitle',
					'See exactly what changed'
				),
				stepImage: ScheduleUndoStep2,
				stepBody: tr(
					t,
					'articles.posts.scheduleUndo.sections.4.stepBody',
					'The preview tile shows the updated name, location, time, and date alongside what was there before. You see the full picture at a glance without having to mentally track what moved.'
				),
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: tr(
					t,
					'articles.posts.scheduleUndo.sections.5.stepTitle',
					'Tap Undo or Accept'
				),
				stepImage: ScheduleUndoStep3,
				stepBody: tr(
					t,
					'articles.posts.scheduleUndo.sections.5.stepBody',
					'Not happy with the result? Tap Undo and your original schedule snaps back instantly. Happy with it? Tap Accept and it locks in. Either way, you made the call.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.scheduleUndo.sections.5.callout.label',
						'Undo is always instant'
					),
					text: tr(
						t,
						'articles.posts.scheduleUndo.sections.5.callout.text',
						'No undo history to scroll through. One tap and your exact original state is back, no matter how much shifted in the preview.'
					),
				},
			},
			{
				type: 'heading',
				title: tr(t, 'articles.posts.scheduleUndo.sections.6.title', 'Why this matters'),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.scheduleUndo.sections.7.text',
					'Most calendar apps apply changes immediately and ask you to undo after the fact, by which point notifications have fired, sync has happened, and the damage is done. Schedule Undo flips this. The default is preview, not save.'
				),
			},
			{
				type: 'callout',
				label: tr(
					t,
					'articles.posts.scheduleUndo.sections.8.label',
					'Built for tightly packed days'
				),
				text: tr(
					t,
					'articles.posts.scheduleUndo.sections.8.text',
					'When your day has no slack, a wrong move can ripple across everything. Schedule Undo gives you a moment to breathe and verify before any change goes live.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.scheduleUndo.sections.9.text',
					"Whether you're rescheduling a workout, shifting a meeting, or taking on a task a colleague sent you, the preview step takes less than a second and can save you from a call you'd regret."
				),
			},
			{
				type: 'quote',
				quote: tr(
					t,
					'articles.posts.scheduleUndo.sections.10.quote',
					'Change your mind before it counts.'
				),
			},
		],
	},
	{
		slug: 'tileshare',
		category: tr(t, 'articles.posts.tileshare.category', 'FEATURES'),
		title: tr(t, 'articles.posts.tileshare.title', 'Tileshare'),
		subtitle: tr(
			t,
			'articles.posts.tileshare.subtitle',
			"Send a task directly into someone else's schedule. It fits around their day automatically. No back-and-forth required."
		),
		excerpt: tr(
			t,
			'articles.posts.tileshare.excerpt',
			"Send adaptive tasks directly into someone else's Tiler. They land, they fit, they get done. No coordination overhead."
		),
		readTime: tr(t, 'articles.posts.tileshare.readTime', '4 min read'),
		author: tr(t, 'articles.posts.tileshare.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.tileshare.date', 'May 22, 2026'),
		coverImage: TileshareCard,
		heroImage: TileshareArticleHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: tr(
					t,
					'articles.posts.tileshare.sections.0.text',
					'Most task handoffs end up in a thread. You send it, they read it, they forget to schedule it, you follow up. Tileshare cuts out the middle. Share a tile and it lands in their Tiler, already scheduled.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.tileshare.sections.1.text',
					"When you share a tile, it arrives as a live adaptive task in the recipient's schedule. It finds the best open slot around their existing commitments. No placement required on either end."
				),
			},
			{
				type: 'heading',
				title: tr(t, 'articles.posts.tileshare.sections.2.title', 'How Tileshare works'),
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: tr(t, 'articles.posts.tileshare.sections.3.stepTitle', 'Share any tile'),
				stepImage: TileshareStep1,
				stepBody: tr(
					t,
					'articles.posts.tileshare.sections.3.stepBody',
					'From any task in your schedule, tap Share and select a Tiler contact. The tile is sent with everything the recipient needs to get it done.'
				),
				callout: {
					label: tr(
						t,
						'articles.posts.tileshare.sections.3.callout.label',
						'What travels with the tile'
					),
					text: tr(
						t,
						'articles.posts.tileshare.sections.3.callout.text',
						"Task name, estimated duration, deadline, and location tags. The recipient's personal schedule stays completely private."
					),
				},
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: tr(
					t,
					'articles.posts.tileshare.sections.4.stepTitle',
					'It lands in their schedule'
				),
				stepImage: TileshareStep2,
				stepBody: tr(
					t,
					'articles.posts.tileshare.sections.4.stepBody',
					"The shared tile appears in the recipient's Tiler and finds the best open slot around their existing commitments. It adapts to their day, not the other way around."
				),
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: tr(
					t,
					'articles.posts.tileshare.sections.5.stepTitle',
					'Track it without chasing'
				),
				stepImage: TileshareStep3,
				stepBody: tr(
					t,
					'articles.posts.tileshare.sections.5.stepBody',
					"Once the task is sent, you can see when it was scheduled, when it gets done, and if it gets moved. No follow-up messages. No status checks. You'll know."
				),
				callout: {
					label: tr(
						t,
						'articles.posts.tileshare.sections.5.callout.label',
						'Shared accountability, zero friction'
					),
					text: tr(
						t,
						'articles.posts.tileshare.sections.5.callout.text',
						'Both sides see the same tile. One completes it. The other sees it done. Delegation that actually closes the loop.'
					),
				},
			},
			{
				type: 'quote',
				quote: tr(
					t,
					'articles.posts.tileshare.sections.6.quote',
					'Send it once. Know it gets done.'
				),
			},
		],
	},
	{
		slug: 'what-is-an-ai-calendar',
		category: tr(t, 'articles.posts.aiCalendar.category', 'AI SCHEDULING'),
		title: tr(
			t,
			'articles.posts.aiCalendar.title',
			'What Is an AI Calendar, and What Should It Actually Do?'
		),
		subtitle: tr(
			t,
			'articles.posts.aiCalendar.subtitle',
			'Most people do not need more calendar apps. They need the calendar to stop being a place where decisions quietly break. Here is what an AI calendar should actually handle, and what it should never do.'
		),
		excerpt: tr(
			t,
			'articles.posts.aiCalendar.excerpt',
			'Smart calendars, AI schedulers, and time management tools keep appearing. Most of them answer the same weak question: where should I put this? But the real job of an AI calendar is to protect what already matters.'
		),
		readTime: tr(t, 'articles.posts.aiCalendar.readTime', '5 min read'),
		author: tr(t, 'articles.posts.aiCalendar.author', 'Tiler Team'),
		date: tr(t, 'articles.posts.aiCalendar.date', 'May 1, 2026'),
		coverImage: AICalendarCard,
		heroImage: AICalendarHero,
		sections: [
			{
				type: 'prose',
				lead: true,
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.0.text',
					'Every few months, a new app promises to be smarter about your time. But most calendars still work the same way: they store events. They do not really think about what your day is doing. An AI calendar is different in one important way: it treats your schedule as a system of constraints, not just a list of blocks. That is the difference between a tool that stores events and a tool that reasons about outcomes.'
				),
			},
			{
				type: 'image',
				src: AICalendarJourney,
				caption: tr(
					t,
					'articles.posts.aiCalendar.sections.1.caption',
					'The three generations of calendars: the dumb list, the smart calendar, and the AI calendar that reasons about outcomes.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.aiCalendar.sections.2.title',
					'From dumb lists to decisions'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.3.text',
					'The first generation of digital calendars was a replacement for the paper planner. You typed an event, picked a time, and the calendar remembered it. That was useful. But it assumed you already made the right decision. The calendar was just storage.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.4.text',
					'The second generation added intelligence, but only at the edges. A calendar might remind you of a conflict, suggest a free slot, or block a bit of travel time. These were helpful. But they still treated each event in isolation. The calendar could tell you something was wrong. It could not tell you what was better.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.5.text',
					'The third generation is different. It understands that events are not isolated boxes on a grid. They have weight, location, dependencies, and consequences. A client call, a workout, and a drive are not just times. They are pieces of a day that affect each other. That is where the word "AI" finally earns its place.'
				),
			},
			{
				type: 'callout',
				label: tr(t, 'articles.posts.aiCalendar.sections.6.label', 'Key shift'),
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.6.text',
					'Calendars moved from asking "where is this event?" to "what happens to the whole day when it moves?" That shift from storage to reasoning is what makes a calendar AI rather than just smart.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.aiCalendar.sections.7.title',
					'What an AI calendar actually answers'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.8.text',
					'A real AI calendar answers questions that older calendars never tried to answer: Can I fit this in without breaking what already matters? What happens if I move this thing? Where is the least painful place for this to go? These are not small questions. They are the questions that make a day work, or quietly ruin it.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.9.text',
					'This is where "AI calendar" stops being a marketing phrase. It is not about a chatbot sitting next to your events. It is about a system that can predict the consequences of scheduling decisions before you commit to them.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.aiCalendar.sections.10.title',
					'Why this is not just a chatbot'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.11.text',
					'Many tools now bolt a chat interface onto a normal calendar. That is convenient, but it is not what makes a calendar AI. A chatbot can answer questions, but it does not change how the schedule behaves. A true AI calendar changes the behavior itself. It does not just tell you something. It tests a change, simulates the impact, and shows you what happens before you accept it.'
				),
			},
			{
				type: 'prose',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.12.text',
					'That is a fundamentally different thing. It turns the calendar from a record of decisions into a tool that helps you make better ones. You can accept, adjust, or undo the change, because the calendar shows you the tradeoff first. That is the part most products still get wrong. They make the calendar talk. They do not make it think.'
				),
			},
			{
				type: 'heading',
				title: tr(
					t,
					'articles.posts.aiCalendar.sections.13.title',
					'How it looks in Tiler'
				),
			},
			{
				type: 'step',
				stepNumber: 1,
				stepTitle: tr(
					t,
					'articles.posts.aiCalendar.sections.14.stepTitle',
					'Ask a real calendar question'
				),
				stepImage: AICalendarStep1,
				stepBody: tr(
					t,
					'articles.posts.aiCalendar.sections.14.stepBody',
					'You do not drag a block into place and pray. You ask Tiler to fit the gym in after work. Tiler looks at what is already there and proposes a schedule that actually works with it.'
				),
			},
			{
				type: 'step',
				stepNumber: 2,
				stepTitle: tr(
					t,
					'articles.posts.aiCalendar.sections.15.stepTitle',
					'See the impact before it happens'
				),
				stepImage: AICalendarStep2,
				stepBody: tr(
					t,
					'articles.posts.aiCalendar.sections.15.stepBody',
					'Tiler does not just move a tile and hope for the best. It shows you what changes. If the standup slides 30 minutes later, you see that before you commit. No surprise conflicts, no broken travel time.'
				),
			},
			{
				type: 'step',
				stepNumber: 3,
				stepTitle: tr(
					t,
					'articles.posts.aiCalendar.sections.16.stepTitle',
					'Accept it or change your mind'
				),
				stepImage: AICalendarStep3,
				stepBody: tr(
					t,
					'articles.posts.aiCalendar.sections.16.stepBody',
					'You keep the final say. You can accept the plan, tweak a single tile, or undo the whole thing. The calendar thinks. You decide.'
				),
			},
			{
				type: 'quote',
				quote: tr(
					t,
					'articles.posts.aiCalendar.sections.17.quote',
					'An AI calendar is not a chatbot. It is a decision layer.'
				),
			},
			{
				type: 'callout',
				label: tr(t, 'articles.posts.aiCalendar.sections.18.label', 'Tip'),
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.18.text',
					'Ask the calendar real questions. "Where does this fit without breaking my day?" beats "Schedule it at 3." The first makes the calendar work. The second just makes it obey.'
				),
			},
			{
				type: 'link',
				to: '/articles/natural-language-scheduling',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.19.text',
					'Read next: Natural-Language Scheduling — Ask Your Calendar What You Mean'
				),
			},
			{
				type: 'link',
				to: '/articles/schedule-undo',
				text: tr(
					t,
					'articles.posts.aiCalendar.sections.20.text',
					'Read next: Schedule Undo — The Right Way to Undo a Messy Schedule'
				),
			},
			{
				type: 'faq',
				items: [
					{
						question: tr(
							t,
							'articles.posts.aiCalendar.faq.0.question',
							'Is an AI calendar just a chatbot on top of my calendar?'
						),
						answer: tr(
							t,
							'articles.posts.aiCalendar.faq.0.answer',
							'No. A chatbot answers questions about your events. An AI calendar changes how the schedule itself behaves: it tests a change, simulates the impact, and shows you the tradeoff before anything is committed.'
						),
					},
					{
						question: tr(
							t,
							'articles.posts.aiCalendar.faq.1.question',
							'Will it move my events without asking?'
						),
						answer: tr(
							t,
							'articles.posts.aiCalendar.faq.1.answer',
							'No. The calendar proposes; you decide. You can accept, adjust, or undo the whole plan, so nothing changes until you approve it.'
						),
					},
					{
						question: tr(
							t,
							'articles.posts.aiCalendar.faq.2.question',
							'Do I still need my existing calendar app?'
						),
						answer: tr(
							t,
							'articles.posts.aiCalendar.faq.2.answer',
							'Tiler works on top of the calendars you already use. It does not replace where your events live — it makes the decisions around them easier.'
						),
					},
					{
						question: tr(
							t,
							'articles.posts.aiCalendar.faq.3.question',
							'Is it replacing me or making me lazy?'
						),
						answer: tr(
							t,
							'articles.posts.aiCalendar.faq.3.answer',
							'An AI calendar should make you more human, not less. It handles the mechanical tradeoffs so you can spend your attention on the parts that actually need a human.'
						),
					},
				],
			},
		],
	},
];

export function getArticleBySlug(slug: string, t: TFunction): Article | undefined {
	return getArticles(t).find((a) => a.slug === slug);
}
