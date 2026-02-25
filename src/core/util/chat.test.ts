import { describe, it, expect } from 'vitest';
import ChatUtil from './chat';
import { VibeAction } from '@/core/common/types/chat';
import { Actions, Status } from '@/core/constants/enums';

// Helper to create minimal VibeAction for testing
const createAction = (type: string): VibeAction =>
	({
		id: 'test-id',
		descriptions: 'test',
		type: type as VibeAction['type'],
		creationTimeInMs: Date.now(),
		status: Status.Pending,
		prompts: [],
		beforeScheduleId: '',
		afterScheduleId: '',
		vibeRequest: {
			id: 'req-id',
			creationTimeInMs: Date.now(),
			activeAction: null,
			isClosed: false,
			beforeScheduleId: null,
			afterScheduleId: null,
			actions: [],
		},
	}) as VibeAction;

describe('ChatUtil', () => {
	describe('getActionIcon', () => {
		describe('regular actions - image type', () => {
			it('returns add_block image for add_new_appointment', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.Add_New_Appointment));
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:add_block.svg');
			});

			it('returns add_new_tile image for add_new_task', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.Add_New_Task));
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:add_new_tile.svg');
			});

			it('returns update_tile image for update_existing_task', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.Update_Existing_Task));
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:update_tile.svg');
			});

			it('returns delete_tile image for remove_existing_task', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.Remove_Existing_Task));
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:delete_tile.svg');
			});

			it('returns clear_all image for procrastinate_all_tasks', () => {
				const result = ChatUtil.getActionIcon(
					createAction(Actions.Procrastinate_All_Tasks)
				);
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:clear_all.svg');
			});

			it('returns clear_all image for procrastinate_all_by_timeline', () => {
				const result = ChatUtil.getActionIcon(
					createAction(Actions.Procrastinate_All_By_Timeline)
				);
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:clear_all.svg');
			});

			it('returns exited_action image for exit_prompting', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.Exit_Prompting));
				expect(result.type).toBe('image');
				expect(result.value).toBe('mock:exited_action.svg');
			});
		});

		describe('regular actions - emoji type', () => {
			it.each([
				[Actions.Add_New_Project, '📋'],
				[Actions.Decide_If_Task_Or_Project, '🤔'],
				[Actions.Mark_Task_As_Done, '✓'],
			])('returns correct emoji for %s', (actionType, expectedEmoji) => {
				const result = ChatUtil.getActionIcon(createAction(actionType));
				expect(result).toEqual({ type: 'emoji', value: expectedEmoji });
			});
		});

		describe('what-if scenarios', () => {
			it.each([
				[Actions.WhatIf_AddANewAppointment, '📅❓'],
				[Actions.WhatIf_AddedNewTask, '✅❓'],
				[Actions.WhatIf_EditUpdateTask, '✏️❓'],
				[Actions.WhatIf_ProcrastinateTask, '⏱️❓'],
				[Actions.WhatIf_RemovedTask, '🗑️❓'],
				[Actions.WhatIf_MarkedTaskAsDone, '✓❓'],
				[Actions.WhatIf_ProcrastinateAll, '⏱️❓'],
			])('returns correct emoji for %s', (actionType, expectedEmoji) => {
				const result = ChatUtil.getActionIcon(createAction(actionType));
				expect(result).toEqual({ type: 'emoji', value: expectedEmoji });
			});
		});

		describe('other cases', () => {
			it('returns chat emoji for conversational_and_not_supported', () => {
				const result = ChatUtil.getActionIcon(
					createAction(Actions.Conversational_And_Not_Supported)
				);
				expect(result).toEqual({ type: 'emoji', value: '💬' });
			});

			it('returns circle emoji for none action', () => {
				const result = ChatUtil.getActionIcon(createAction(Actions.None));
				expect(result).toEqual({ type: 'emoji', value: '⚪' });
			});

			it('returns default diamond emoji for unknown action types', () => {
				const result = ChatUtil.getActionIcon(createAction('unknown_action_type'));
				expect(result).toEqual({ type: 'emoji', value: '🔹' });
			});
		});

		describe('type safety', () => {
			it('all Actions enum values are handled without throwing', () => {
				Object.values(Actions).forEach((actionType) => {
					expect(() => ChatUtil.getActionIcon(createAction(actionType))).not.toThrow();
				});
			});

			it('all Actions enum values return valid ActionIcon structure', () => {
				Object.values(Actions).forEach((actionType) => {
					const result = ChatUtil.getActionIcon(createAction(actionType));
					expect(result).toHaveProperty('type');
					expect(result).toHaveProperty('value');
					expect(['emoji', 'image']).toContain(result.type);
					expect(typeof result.value).toBe('string');
				});
			});
		});
	});
});
