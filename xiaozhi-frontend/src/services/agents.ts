import api from './api';
import type { Agent } from '@/types';

export interface CreateAgentDto {
  name: string;
  description?: string;
  modelId?: string;
  prompt?: string;
  settings?: Record<string, any>;
  enabled?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  modelId?: string;
  prompt?: string;
  settings?: Record<string, any>;
  enabled?: boolean;
}

export const agentsApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string }) =>
    api.get<{ list: Agent[]; total: number }>('/agents', { params }),

  get: (id: string) =>
    api.get<Agent>(`/agents/${id}`),

  create: (data: CreateAgentDto) =>
    api.post<Agent>('/agents', data),

  update: (id: string, data: UpdateAgentDto) =>
    api.put<Agent>(`/agents/${id}`, data),

  delete: (id: string) =>
    api.delete(`/agents/${id}`),

  bindPlugins: (id: string, pluginIds: string[]) =>
    api.post(`/agents/${id}/plugins`, { pluginIds }),
};
