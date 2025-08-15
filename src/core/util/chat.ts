import { VibeAction } from "@/core/common/types/chat";
import ADDBLOCK from '@/assets/add_block.svg';
import ADDTASK from '@/assets/add_new_tile.svg';

class ChatUtil {
  static getActionIcon(action: VibeAction) {
    switch (action.type) {
      // Regular actions
      case 'add_new_appointment':
        return ADDBLOCK;
      case 'add_new_task':
        return ADDTASK;
      case 'add_new_project':
        return '📋';
      case 'decide_if_task_or_project':
        return '🤔';
      case 'update_existing_task':
        return '✏️';
      case 'remove_existing_task':
        return '🗑️';
      case 'mark_task_as_done':
        return '✓';
      case 'procrastinate_all_tasks':
        return '⏱️';
      case 'exit_prompting':
        return '🚪';

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
