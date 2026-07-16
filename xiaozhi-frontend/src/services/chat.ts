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
    model?: string,
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

    return eventSource;
  },

  stopGeneration: (sessionId: string) =>
    api.post(`/chat/${sessionId}/stop`),

  feedback: (messageId: string, rating: 'like' | 'dislike', comment?: string) =>
    api.post(`/chat/messages/${messageId}/feedback`, { rating, comment }),
};
