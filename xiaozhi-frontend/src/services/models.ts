import api from './api';

export interface AIModelConfig {
  id: string;
  name: string;
  model: string;          // API 模型名
  provider: 'openai' | 'anthropic' | 'custom';
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
  hasApiKey?: boolean;
  isPreset?: boolean;     // 是否为预制模型
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
