import api from './api';
import type { Message } from '@/types';

export interface SendMessageDto {
  sessionId: string;
  message: string;
  stream?: boolean;
  model?: string;
}

export const chatApi = {
  sendMessage: (data: SendMessageDto) =>
    api.post<Message>('/chat', data),

  // 流式消息 - 使用 SSE
  streamChat: (
    sessionId: string,
    message: string,
    onMessage: (content: string) => void,
    model?: string,
    onComplete?: () => void,
    onError?: (error: Event) => void,
  ) => {
    const token = localStorage.getItem('auth-storage');
    let tokenValue = '';
    try {
      const parsed = token ? JSON.parse(token) : {};
      tokenValue = parsed.state?.token || '';
    } catch {}

    const params = new URLSearchParams({
      message: message,
      token: tokenValue,
    });
    if (model) {
      params.append('model', model);
    }

    const eventSource = new EventSource(
      `/api/chat/${sessionId}/stream?${params.toString()}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.content !== undefined) {
          // 检查是否是错误消息
          if (data.content.startsWith('错误:')) {
            eventSource.close();
            onError?.(data.content);
            return;
          }
          onMessage(data.content);
        }
        if (data.done) {
          eventSource.close();
          onComplete?.();
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      onError?.(error);
    };

    return eventSource;
  },

  stopGeneration: (sessionId: string) =>
    api.post(`/chat/${sessionId}/stop`),

  feedback: (messageId: string, rating: 'like' | 'dislike', comment?: string) =>
    api.post(`/chat/messages/${messageId}/feedback`, { rating, comment }),
};
