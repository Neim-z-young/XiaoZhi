import api from './api';

export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export const toolsApi = {
  list: () =>
    api.get<{ list: Tool[]; total: number }>('/tools'),

  enable: (id: string) =>
    api.post(`/tools/${id}/enable`),

  disable: (id: string) =>
    api.post(`/tools/${id}/disable`),

  init: () =>
    api.post('/tools/init'),
};
