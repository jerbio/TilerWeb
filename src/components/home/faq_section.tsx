import React from 'react'
import Section from '../layout/section';
import Collapse from '../shared/collapse';

const FAQItems = [
  {
    title: "What is Tiler, and how does it work?",
    content: "Tiler is not a calendar, it is an AI-powered scheduling app that not only manages your tasks but also optimizes your time. It creates smart, flexible schedules using AutoTiles that adjust as your day shifts, while also letting you lock in non-negotiable tasks using Blocks."
  },
  {
    title: "Why do I need to integrate my calendar?",
    content: "Integrating your calendar with Tiler lets you see all your tasks, events, and schedules in one place. No more juggling multiple apps or risking double bookings—Tiler automatically syncs everything and optimizes your day for maximum productivity."
  },
  {
    title: "Can I integrate multiple calendars to my Tiler account?",
    content: "Yes! You can integrate multiple calendars into your Tiler account. This way, all your events and tasks are in one place."
  },
  {
    title: "What’s the difference between a Tile and a Block?",
    content: "Tiles are flexible tasks that Tiler automatically schedules and adjusts based on your availability. Blocks are fixed tasks that stay exactly where you set them—perfect for meetings or tasks that can’t be moved."
  },
  {
    title: "How does TileShare work?",
    content: "TileShare lets you share tasks with others—friends, family, teammates—so everyone knows what needs to be done and who’s handling it. Assign tasks, track progress, and sync schedules effortlessly."
  },
  {
    title: "What if I miss a task or need to reschedule?",
    content: "No worries! Tiler’s Defer feature automatically finds the next best time to complete a missed task. You can also manually reschedule with a simple drag-and-drop."
  },
  {
    title: "Can Tiler help with habit tracking?",
    content: "Yes! You can use Tiler to schedule and track daily habits. Tiler auto-fits them into your schedule, so you stay consistent."
  },
  {
    title: "How can I use the Transit feature?",
    content: "The transit feature goes beyond just calculating travel time — it acts as your navigation assistant. It helps you plan routes, suggests the best modes of transportation, and provides real-time directions for seamless transitions between tasks and locations. Just tap the travel icon to get instant navigation, ensuring you're always on time and on track."
  },
];

const FAQ = () => {
  return (
    <Section>
      <Collapse items={FAQItems} />
    </Section>
  )
}

export default FAQ