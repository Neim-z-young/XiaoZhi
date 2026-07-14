import api from './api';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
  hasApiKey?: boolean;
}

export const modelsApi = {
  list: () =>
    api.get<{ models: AIModelConfig[] }>('/models'),

  get: (id: string) =>
    api.get<AIModelConfig>(`/models/${id}`),

  create: (data: Partial<AIModelConfig>) =>
    api.post<AIModelConfig>('/models', data),

  update: (id: string, data: Partial<AIModelConfig>) =>
    api.put(`/models/${id}`, data),

  delete: (id: string) =>
    api.delete(`/models/${id}`),

  enable: (id: string) =>
    api.post(`/models/${id}/enable`),

  disable: (id: string) =>
    api.post(`/models/${id}/disable`),
};
