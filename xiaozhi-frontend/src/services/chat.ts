import api from './api';
import type { Session, Message } from '@/types';

export const chatApi = {
  // 会话
  createSession: (data: { agentId?: string; workspaceId?: string; title?: string }) =>
    api.post<Session>('/sessions', data),

  listSessions: (params?: { page?: number; pageSize?: number; agentId?: string }) =>
    api.get<{ list: Session[]; total: number }>('/sessions', { params }),

  getSession: (id: string) =>
    api.get<Session>(`/sessions/${id}`),

  deleteSession: (id: string) =>
    api.delete(`/sessions/${id}`),

  // 消息
  sendMessage: (sessionId: string, message: string, stream = true) =>
    api.post<Message>('/chat', { sessionId, message, stream }),

  stopGeneration: (sessionId: string) =>
    api.post(`/chat/${sessionId}/stop`),

  feedback: (messageId: string, rating: 'like' | 'dislike', comment?: string) =>
    api.post(`/chat/messages/${messageId}/feedback`, { rating, comment }),

  // SSE 流式
  streamChat: (sessionId: string, message: string) => {
    const token = localStorage.getItem('auth-token');
    return new EventSource(`/api/chat/${sessionId}/stream?message=${encodeURIComponent(message)}&token=${token}`);
  },
};
