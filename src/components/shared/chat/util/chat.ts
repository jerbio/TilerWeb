enum Actions {
	Add_New_Appointment = 'add_new_appointment',
	Add_New_Task = 'add_new_task',
	Add_New_Project = 'add_new_project',
	Decide_If_Task_Or_Project = 'decide_if_task_or_project',
	Update_Existing_Task = 'update_existing_task',
	Remove_Existing_Task = 'remove_existing_task',
	Mark_Task_As_Done = 'mark_task_as_done',
	Procrastinate_All_Tasks = 'procrastinate_all_tasks',
	Exit_Prompting = 'exit_prompting',
	WhatIf_AddANewAppointment = 'whatif_addanewappointment',
	WhatIf_AddedNewTask = 'whatif_addednewtask',
	WhatIf_EditUpdateTask = 'whatif_editupdatetask',
	WhatIf_ProcrastinateTask = 'whatif_procrastinatetask',
	WhatIf_RemovedTask = 'whatif_removedtask',
	WhatIf_MarkedTaskAsDone = 'whatif_markedtaskasdone',
	WhatIf_ProcrastinateAll = 'whatif_procrastinateall',
	Conversational_And_Not_Supported = 'conversational_and_not_supported',
	None = 'none',
}

type ActionType = `${Actions}`;
interface ServerResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: Record<string, unknown>;
	ServerStatus: Record<string, unknown> | null;
}

// Prompt interface
interface Prompt {
	id: string;
	origin: 'user' | 'model' | 'tiler';
	content: string;
	actionId: string;
	requestId: string;
	sessionId: string;
}

// Action interface
interface VibeAction {
	id: string;
	descriptions: string;
	type: ActionType; // ActionType is a string literal type based on Actions enum
	creationTimeInMs: number;
	status: 'parsed' | 'clarification' | 'none' | 'pending' | 'executed' | 'failed' | 'exited';
	prompts: Prompt[];
}

// VibeResponse interface
interface VibeResponse {
	// actions: VibeAction[];
	// pendingActions: VibeAction[];
	prompts: Record<
		string,
		{
			prompt: Prompt;
			actions: Array<
				VibeAction & {
					vibeRequest: {
						id: string;
						creationTimeInMs: number;
						isClosed: boolean | null;
						actions: VibeAction[];
					};
					beforeScheduleId?: string;
					afterScheduleId?: string;
				}
			>;
		}
	>;
}

// Chat-specific response interface
interface ChatVibeResponse extends ServerResponse {
	Content: {
		vibeResponse: VibeResponse;
	};
	ServerStatus: null;
}

interface vibeRequest {
	id: string;
	creationTimeInMs: number;
	activeAction: any; // You can replace `any` with a more specific type if needed
	isClosed: boolean;
	beforeScheduleId: string;
	afterScheduleId: string;
	actions: any[]; // Replace with proper action type if known
}

interface ExecuteActionResponse {
	Error: {
		Code: string;
		Message: string;
	};
	Content: {
		vibeRequest: vibeRequest;
	};
	ServerStatus: any | null;
}

// ChatPromptResponse interface
interface ChatPromptResponse extends ServerResponse {
	Content: {
		chats: Prompt[];
	};
	ServerStatus: null;
}

export type {
	ServerResponse,
	ChatVibeResponse,
	VibeResponse,
	VibeAction,
	Prompt,
	ChatPromptResponse,
	Prompt as Message,
	ExecuteActionResponse,
};
