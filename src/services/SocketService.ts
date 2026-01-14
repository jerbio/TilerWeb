// For .NET Framework SignalR, we need to use the jQuery-based SignalR client
// Note: You'll need to include the SignalR JavaScript library and jQuery in your project

import { Env } from "@/config/config_getter";


// Define types for .NET Framework SignalR
interface SignalRConnectionState {
    connecting: number;
    connected: number;
    reconnecting: number;
    disconnected: number;
}

interface SignalRHubProxy {
    client: Record<string, (...args: unknown[]) => void>;
    server: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

interface SignalRConnection {
    url: string;
    logging: boolean;
    state: number;
    start(options?: { transport: string[] }): {
        done(callback: () => void): { fail(callback: (error: Error) => void): void };
    };
    stop(): void;
    stateChanged(callback: (change: { oldState: number; newState: number }) => void): void;
    reconnected(callback: () => void): void;
    disconnected(callback: () => void): void;
}

interface JQuerySignalR {
    connectionState: SignalRConnectionState;
}

interface JQueryConnection {
    hub: SignalRConnection;
    vibeHub?: SignalRHubProxy;
    vibeUpdateHub?: SignalRHubProxy;
}

interface JQueryWithSignalR {
    connection: JQueryConnection;
    signalR: JQuerySignalR;
}

// Declare global SignalR types for .NET Framework version
declare global {
    interface Window {
        $: JQueryWithSignalR;
    }
}

export class SignalRService {
    private signalRConnection: SignalRConnection | null = null;
    // For production, use: 
    private readonly baseUrl = Env.get('BASE_URL');
    private callBackFunc: { [key: string]: (data: unknown) => void } = {};

    constructor(private userId: string) {}


    private onSocketDataReceipt(data: unknown): void {
        // Ensure jQuery and SignalR are loaded
        if (typeof window.$ === 'undefined' || typeof window.$.connection === 'undefined') {
            console.error('jQuery and SignalR are required for .NET Framework SignalR');
            return;
        } else {
            // Call all registered callbacks with the received data
            Object.values(this.callBackFunc).forEach((callback) => {
                callback(data);
            });
        }
    }
    
    public subscribeToSocketDataReceipt(callback: (data: unknown) => void): string | void {
        // Ensure jQuery and SignalR are loaded
        const callbackId = this.generateCallbackId();
        this.callBackFunc[callbackId] = callback;

        return callbackId;
    }

    private generateCallbackId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
    public unsubscribeFromSocketDataReceipt(callbackId: string): void {
        delete this.callBackFunc[callbackId];
    }
    public unsubscribeAll(): void {
        this.callBackFunc = {};
    }
    public dispose(): void {
        this.unsubscribeAll();
        this.stopConnection();
    }

    public createVibeConnection(): void {
        // Ensure jQuery and SignalR are loaded
        if (typeof window.$ === 'undefined') {
            console.error('jQuery is required for .NET Framework SignalR');
            return;
        }

        if (typeof window.$.connection === 'undefined') {
            console.error('SignalR JavaScript library is not loaded');
            return;
        }
        // Configure connection settings
        window.$.connection.hub.url = `${this.baseUrl}signalr`; // Adjust as needed
        window.$.connection.hub.logging = true; // Enable logging for debugging
        
        // Create proxy to your hub (replace 'vibeHub' with your actual hub name)
        // const vibeHubProxy = window.$.connection.vibeHub;

        const chat = window.$.connection.vibeUpdateHub;
        if (chat) {
            chat.client.refreshDataFromSockets = this.onSocketDataReceipt.bind(this);
        } else {
            console.error('vibeUpdateHub proxy is not available');
        }


        // Start the connection
        window.$.connection.hub.start(
            { 
            transport: ['webSockets', 'serverSentEvents', 'longPolling'],
        }
    ).done(() => {
            this.signalRConnection = window.$.connection.hub;
            this.joinUserGroup(this.userId);
        }).fail((error: Error) => {
            console.error('SignalR connection failed:', error);
        });

        // Handle connection state changes
        window.$.connection.hub.stateChanged((change: { oldState: number; newState: number }) => {
            console.log('SignalR state changed from', change.oldState, 'to', change.newState);
        });

        // Handle reconnection
        window.$.connection.hub.reconnected(() => {
            // Rejoin groups or resend any necessary data
            this.joinUserGroup(this.userId);
        });

        // Handle disconnection
        window.$.connection.hub.disconnected(() => {
            // Attempt to restart connection after 5 seconds
            setTimeout(() => {
                if (window.$.connection.hub.state === window.$.signalR.connectionState.disconnected) {
                    window.$.connection.hub.start();
                }
            }, 5000);
        });
    }

    // Method to join a user group (example server method)
    public joinUserGroup(username: string): Promise<unknown> | undefined {
        return this.sendToServer('joinUserGroup', username);
    }

    // Method to send messages to the server
    public sendToServer(methodName: string, ...args: unknown[]): Promise<unknown> | undefined {
        if (this.signalRConnection && this.signalRConnection.state === window.$.signalR.connectionState.connected) {
            const vibeHubProxy = window.$.connection.vibeUpdateHub;
            if (vibeHubProxy && vibeHubProxy.server[methodName]) {
                return vibeHubProxy.server[methodName](...args);
            }
        } else {
            console.warn('SignalR connection not established');
        }
        return undefined;
    }

    // Method to stop the connection
    public stopConnection(): void {
        if (this.signalRConnection) {
            window.$.connection.hub.stop();
            this.signalRConnection = null;
        }
    }

    // Method to check connection state
    public isConnected(): boolean {
        return this.signalRConnection?.state === window.$.signalR.connectionState.connected;
    }
}
