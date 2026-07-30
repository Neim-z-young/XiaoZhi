import api from './api';

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mcpsApi = {
  list: (signal?: AbortSignal) =>
    api.get<MCPServer[]>('/mcp/servers', { signal }),

  get: (id: string, signal?: AbortSignal) =>
    api.get<MCPServer>(`/mcp/servers/${id}`, { signal }),

  create: (data: Partial<MCPServer>) =>
    api.post<MCPServer>('/mcp/servers', data),

  update: (id: string, data: Partial<MCPServer>) =>
    api.put<MCPServer>(`/mcp/servers/${id}`, data),

  delete: (id: string) =>
    api.delete(`/mcp/servers/${id}`),

  enable: (id: string) =>
    api.post(`/mcp/servers/${id}/enable`),

  disable: (id: string) =>
    api.post(`/mcp/servers/${id}/disable`),
};
