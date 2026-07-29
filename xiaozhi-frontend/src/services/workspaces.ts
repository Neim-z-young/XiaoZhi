import api from './api';

export interface Workspace {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  path: string;
  enabled?: boolean;
}

export interface UpdateWorkspaceDto {
  name?: string;
  path?: string;
  enabled?: boolean;
}

export const workspacesApi = {
  list: () =>
    api.get<{ list: Workspace[]; total: number }>('/workspaces'),

  get: (id: string) =>
    api.get<Workspace>(`/workspaces/${id}`),

  create: (data: CreateWorkspaceDto) =>
    api.post<Workspace>('/workspaces', data),

  update: (id: string, data: UpdateWorkspaceDto) =>
    api.put<Workspace>(`/workspaces/${id}`, data),

  delete: (id: string) =>
    api.delete(`/workspaces/${id}`),

  enable: (id: string) =>
    api.post(`/workspaces/${id}/enable`),

  disable: (id: string) =>
    api.post(`/workspaces/${id}/disable`),
};
