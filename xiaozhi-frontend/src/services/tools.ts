import api from './api';

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  level: number;
  timestamp: Date;
}

export const toolsApi = {
  getPendingConfirmations: () =>
    api.get<ToolCall[]>('/tools/pending'),

  getPendingConfirmation: (id: string) =>
    api.get<ToolCall>(`/tools/pending/${id}`),

  approve: (id: string) =>
    api.post(`/tools/approve/${id}`),

  reject: (id: string) =>
    api.post(`/tools/reject/${id}`),
};
