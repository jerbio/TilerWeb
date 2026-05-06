import { describe, it, expect } from 'vitest';
import fixture from '../vibePreviewResponse.json';
import type { SimulationScheduleResult } from '@/core/common/types/chat';

// ---------------------------------------------------------------------------
// Contract test — pins the wire-shape keys returned by GET api/Vibe/Preview.
// These keys are produced by VibeController.buildScheduleResponse and the
// inline metadata adds in GetPreview. If the server renames any of them the
// CalendarWrapper overlay path silently breaks (the grid renders nothing in
// review mode), so we lock them down here.
// ---------------------------------------------------------------------------

describe('vibePreviewResponse fixture (contract)', () => {
	const result = fixture as unknown as SimulationScheduleResult;

	it('exposes the simulated schedule under preview.subCalendarEvents', () => {
		expect(Array.isArray(result.preview.subCalendarEvents)).toBe(true);
		expect(result.preview.subCalendarEvents!.length).toBeGreaterThan(0);
	});

	it('does NOT use the legacy `subEvents` key (server emits `subCalendarEvents`)', () => {
		expect((result.preview as Record<string, unknown>).subEvents).toBeUndefined();
	});

	it('carries preview metadata required by the chat surfaces', () => {
		expect(typeof result.preview.previewId).toBe('string');
		expect(typeof result.preview.vibeRequestId).toBe('string');
		expect(Array.isArray(result.preview.previewActions)).toBe(true);
	});

	it('each subCalendarEvent has the timing fields the diff relies on', () => {
		for (const ev of result.preview.subCalendarEvents!) {
			expect(typeof ev.id).toBe('string');
			expect(typeof ev.start).toBe('number');
			expect(typeof ev.end).toBe('number');
			expect(ev.end).toBeGreaterThan(ev.start);
		}
	});
});
