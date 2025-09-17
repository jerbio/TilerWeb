import { VibeAction } from "@/core/common/types/chat";
import ADD_BLOCK from '@/assets/add_block.svg';
import ADD_TASK from '@/assets/add_new_tile.svg';
import UPDATE_TILE from '@/assets/update_tile.svg';
import DELETE_TILE from '@/assets/delete_tile.svg';
import EXITED_ACTION from '@/assets/exited_action.svg';
import CLEAR_ALL from '@/assets/clear_all.svg';

class ChatUtil {
  static getActionIcon(action: VibeAction) {
    switch (action.type) {
      // Regular actions
      case 'add_new_appointment':
        return ADD_BLOCK;
      case 'add_new_task':
        return ADD_TASK;
      case 'add_new_project':
        return '📋';
      case 'decide_if_task_or_project':
        return '🤔';
      case 'update_existing_task':
        return UPDATE_TILE;
      case 'remove_existing_task':
        return DELETE_TILE;
      case 'mark_task_as_done':
        return '✓';
      case 'procrastinate_all_tasks':
        return CLEAR_ALL;
      case 'exit_prompting':
        return EXITED_ACTION;

      // What-if scenarios
      case 'whatif_addanewappointment':
        return '📅❓';
      case 'whatif_addednewtask':
        return '✅❓';
      case 'whatif_editupdatetask':
        return '✏️❓';
      case 'whatif_procrastinatetask':
        return '⏱️❓';
      case 'whatif_removedtask':
        return '🗑️❓';
      case 'whatif_markedtaskasdone':
        return '✓❓';
      case 'whatif_procrastinateall':
        return '⏱️❓';

      // Other cases
      case 'conversational_and_not_supported':
        return '💬';
      case 'none':
        return '⚪';
      default:
        return '🔹';
    }
  }
}

export default ChatUtil;
