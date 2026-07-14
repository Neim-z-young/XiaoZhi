import api from './api';
import type { Plugin } from '@/types';

export interface CreatePluginDto {
  name: string;
  type: 'mcp' | 'a2a' | 'builtin';
  description?: string;
  config?: Record<string, any>;
  enabled?: boolean;
}

export const pluginsApi = {
  list: (params?: { type?: string; page?: number; pageSize?: number }) =>
    api.get<{ list: Plugin[]; total: number }>('/plugins', { params }),

  get: (id: string) =>
    api.get<Plugin>(`/plugins/${id}`),

  create: (data: CreatePluginDto) =>
    api.post<Plugin>('/plugins', data),

  update: (id: string, data: Partial<Plugin>) =>
    api.put<Plugin>(`/plugins/${id}`, data),

  delete: (id: string) =>
    api.delete(`/plugins/${id}`),

  install: (data: CreatePluginDto) =>
    api.post<Plugin>('/plugins/install', data),

  uninstall: (id: string) =>
    api.post(`/plugins/${id}/uninstall`),

  enable: (id: string) =>
    api.post(`/plugins/${id}/enable`),

  disable: (id: string) =>
    api.post(`/plugins/${id}/disable`),
};
