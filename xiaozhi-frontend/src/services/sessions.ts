import api from './api';
import type { Session } from '@/types';

export interface CreateSessionDto {
  agentId?: string;
  workspaceId?: string;
  title?: string;
}

export const sessionsApi = {
  create: (data: CreateSessionDto) =>
    api.post<Session>('/sessions', data),

  list: (params?: { page?: number; pageSize?: number; agentId?: string }) =>
    api.get<{ list: Session[]; total: number }>('/sessions', { params }),

  get: (id: string) =>
    api.get<Session>(`/sessions/${id}`),

  delete: (id: string) =>
    api.delete(`/sessions/${id}`),

  update: (id: string, data: Partial<Session>) =>
    api.put(`/sessions/${id}`, data),
};
