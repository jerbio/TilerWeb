import {
	ChatActionsResponse,
	ChatSendMessageResponse,
	ChatExecuteActionResponse,
	ChatVibeRequestResponse,
	ChatMessageBody,
	ChatMessagesResponse,
	ChatMessagesParams,
	VibeSessionsResponse,
	VibeSessionParams,
	VariantPreviewsResponse,
} from '@/core/common/types/chat';
import { AppApi } from './appApi';

export class ChatApi extends AppApi {
	// Messages
	public getMessages(sessionId: string, pagination?: ChatMessagesParams) {
		const params = [`SessionId=${encodeURIComponent(sessionId)}`];

		if (pagination?.anonymousUserId) {
			params.push(`AnonymousUserId=${encodeURIComponent(pagination.anonymousUserId)}`);
		}
		if (pagination?.batchSize !== undefined) {
			params.push(`BatchSize=${pagination.batchSize}`);
		}
		if (pagination?.index !== undefined) {
			params.push(`Index=${pagination.index}`);
		}
		if (pagination?.order) {
			params.push(`Order=${pagination.order}`);
		}

		return this.apiRequest<ChatMessagesResponse>(`api/Vibe/Chat?${params.join('&')}`);
	}

	// Sessions
	public getVibeSessions(
		userId?: string,
		anonymousUserId?: string,
		pagination?: VibeSessionParams
	) {
		let url = 'api/Vibe/Session';
		const params = ['mobileApp=true'];

		if (userId) {
			params.push(`UserId=${encodeURIComponent(userId)}`);
		}
		if (anonymousUserId) {
			params.push(`AnonymousUserId=${encodeURIComponent(anonymousUserId)}`);
		}
		if (pagination?.batchSize !== undefined) {
			params.push(`BatchSize=${pagination.batchSize}`);
		}
		if (pagination?.index !== undefined) {
			params.push(`Index=${pagination.index}`);
		}
		if (pagination?.order) {
			params.push(`Order=${pagination.order}`);
		}

		url += `?${params.join('&')}`;

		return this.apiRequest<VibeSessionsResponse>(url);
	}

	public sendMessage(messageBody: ChatMessageBody) {
		return this.apiRequest<ChatSendMessageResponse>('api/Vibe/Chat', {
			method: 'POST',
			body: JSON.stringify(messageBody),
		});
	}

	// Actions
	public getActions(actionIds: string[] | string) {
		const ids = Array.isArray(actionIds) ? actionIds : [actionIds];
		const key = ids.length > 1 ? 'ActionIds' : 'ActionId';
		const queryParam = ids.map((id) => `${key}=${encodeURIComponent(id)}`).join('&');

		return this.apiRequest<ChatActionsResponse>('api/Vibe/Action?' + queryParam);
	}

	public executeActions(
		requestId: string,
		anonymousUserId?: string,
		userLongitude?: string,
		userLatitude?: string,
		userLocationVerified?: string
	) {
		return this.apiRequest<ChatExecuteActionResponse>('api/Vibe/Request/Execute', {
			method: 'POST',
			body: JSON.stringify({
				requestId,
				anonymousUserId,
				userLongitude,
				userLatitude,
				userLocationVerified,
			}),
		});
	}

	public getVibeRequest(requestId: string) {
		return this.apiRequest<ChatVibeRequestResponse>(
			`api/Vibe/VibeRequest?RequestId=${encodeURIComponent(requestId)}`
		);
	}

	public getVariantPreviews(vibeRequestId: string) {
		return this.apiRequest<VariantPreviewsResponse>(
			`api/Vibe/Request/${encodeURIComponent(vibeRequestId)}/Preview`
		);
	}

	public selectVariant(vibeRequestId: string, selectedStepId: string) {
		return this.apiRequest<ChatExecuteActionResponse>(
			`api/Vibe/Request/${encodeURIComponent(vibeRequestId)}/SelectVariant`,
			{
				method: 'POST',
				body: JSON.stringify({ SelectedStepId: selectedStepId }),
			}
		);
	}

	public supplyClarification(vibeRequestId: string, stepId: string, parameters: Record<string, string>) {
		return this.apiRequest<ChatExecuteActionResponse>(
			`api/Vibe/Request/${encodeURIComponent(vibeRequestId)}/SupplyClarification`,
			{
				method: 'POST',
				body: JSON.stringify({ StepId: stepId, Parameters: parameters }),
			}
		);
	}

	public getPlanHistory(actionId: string) {
		return this.apiRequest<{ Content: { planHistory: unknown } }>(
			`api/Vibe/Action/${encodeURIComponent(actionId)}/PlanHistory`
		);
	}

	public transcribeAudio(audioFile: Blob) {
		const formData = new FormData();
		formData.append('AudioFile', audioFile, 'recording.webm');

		return this.apiRequestFormData<{ Content: { transcription: string } }>(
			'api/Vibe/Transcribe',
			{
				method: 'POST',
				body: formData,
			}
		);
	}
}
