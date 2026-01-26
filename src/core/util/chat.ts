import { VibeAction } from "@/core/common/types/chat";
import ADD_BLOCK from '@/assets/add_block.svg';
import ADD_TASK from '@/assets/add_new_tile.svg';
import UPDATE_TILE from '@/assets/update_tile.svg';
import DELETE_TILE from '@/assets/delete_tile.svg';
import EXITED_ACTION from '@/assets/exited_action.svg';
import CLEAR_ALL from '@/assets/clear_all.svg';

export interface ActionIcon {
  type: 'emoji' | 'image';
  value: string;
}

class ChatUtil {
  static getActionIcon(action: VibeAction): ActionIcon {
    switch (action.type) {
      // Regular actions
      case 'add_new_appointment':
        return { type: 'image', value: ADD_BLOCK };
      case 'add_new_task':
        return { type: 'image', value: ADD_TASK };
      case 'add_new_project':
        return { type: 'emoji', value: '📋' };
      case 'decide_if_task_or_project':
        return { type: 'emoji', value: '🤔' };
      case 'update_existing_task':
        return { type: 'image', value: UPDATE_TILE };
      case 'remove_existing_task':
        return { type: 'image', value: DELETE_TILE };
      case 'mark_task_as_done':
        return { type: 'emoji', value: '✓' };
      case 'procrastinate_all_tasks':
      case 'procrastinate_all_by_timeline':
        return { type: 'image', value: CLEAR_ALL };
      case 'exit_prompting':
        return { type: 'image', value: EXITED_ACTION };

      // What-if scenarios
      case 'whatif_addanewappointment':
        return { type: 'emoji', value: '📅❓' };
      case 'whatif_addednewtask':
        return { type: 'emoji', value: '✅❓' };
      case 'whatif_editupdatetask':
        return { type: 'emoji', value: '✏️❓' };
      case 'whatif_procrastinatetask':
        return { type: 'emoji', value: '⏱️❓' };
      case 'whatif_removedtask':
        return { type: 'emoji', value: '🗑️❓' };
      case 'whatif_markedtaskasdone':
        return { type: 'emoji', value: '✓❓' };
      case 'whatif_procrastinateall':
        return { type: 'emoji', value: '⏱️❓' };

      // Other cases
      case 'conversational_and_not_supported':
        return { type: 'emoji', value: '💬' };
      case 'none':
        return { type: 'emoji', value: '⚪' };
      default:
        return { type: 'emoji', value: '🔹' };
    }
  }
}

export default ChatUtil;
