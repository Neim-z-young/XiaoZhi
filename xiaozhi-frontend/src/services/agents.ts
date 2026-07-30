import api from './api';
import type { Agent } from '@/types';

export interface CreateAgentDto {
  name: string;
  slug?: string;
  description?: string;
  modelId?: string;
  prompt?: string;
  settings?: Record<string, any>;
  enabled?: boolean;
  toolNames?: string[];
  mcpServers?: string[];
  locked?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  slug?: string;
  description?: string;
  modelId?: string;
  prompt?: string;
  settings?: Record<string, any>;
  enabled?: boolean;
  toolNames?: string[];
  mcpServers?: string[];
}

export interface GeneratedAgent {
  name: string;
  slug: string;
  description: string;
  prompt: string;
}

export const agentsApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string }, signal?: AbortSignal) =>
    api.get<{ list: Agent[]; total: number }>('/agents', { params, signal }),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Agent>(`/agents/${id}`, { signal }),

  create: (data: CreateAgentDto) =>
    api.post<Agent>('/agents', data),

  update: (id: string, data: UpdateAgentDto) =>
    api.put<Agent>(`/agents/${id}`, data),

  delete: (id: string) =>
    api.delete(`/agents/${id}`),

  lock: (id: string) =>
    api.post<Agent>(`/agents/${id}/lock`),

  unlock: (id: string) =>
    api.post<Agent>(`/agents/${id}/unlock`),

  import: (content: string) =>
    api.post<{ success: boolean; agent?: Agent; errors?: string[] }>('/agents/import', { content }),

  generate: (content: string, modelId: string) =>
    api.post<GeneratedAgent>('/agents/generate', { content, modelId }),

  bindPlugins: (id: string, pluginIds: string[]) =>
    api.post(`/agents/${id}/plugins`, { pluginIds }),
};
