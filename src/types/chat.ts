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
    origin: 'user' | 'model'| 'tiler';
    content: string;
    actionId: string;
    requestId: string;
    sessionId: string;
}

// Enum for VibeAction status
export enum VibeActionStatus {
    None = 'None',
    Parsed = 'parsed',
    Clarification = 'clarification',
    Executed = 'executed',
    Failed = 'failed',
    Exited = 'exited'
}

// Action interface
interface VibeAction {
    id: string;
    descriptions: string;
    type: string;
    creationTimeInMs: number;
    status: VibeActionStatus;
    prompts: Prompt[];
}

// VibeResponse interface
interface VibeResponse {
    actions: VibeAction[];
    pendingActions: VibeAction[];
}

// Chat-specific response interface
interface ChatVibeResponse extends ServerResponse {
    Content: {
        vibeResponse: VibeResponse;
    };
    ServerStatus: null;
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
    Prompt as Message
};