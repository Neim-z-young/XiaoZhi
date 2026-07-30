import api from './api';

export interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getMcpServers(signal?: AbortSignal): Promise<McpServer[]> {
  const response = await api.get('/mcp/servers', { signal });
  return response.data;
}

export async function getMcpServer(id: string, signal?: AbortSignal): Promise<McpServer | null> {
  const response = await api.get(`/mcp/servers/${id}`, { signal });
  return response.data;
}

export async function createMcpServer(data: Partial<McpServer>): Promise<McpServer> {
  const response = await api.post('/mcp/servers', data);
  return response.data;
}

export async function updateMcpServer(id: string, data: Partial<McpServer>): Promise<McpServer | null> {
  const response = await api.put(`/mcp/servers/${id}`, data);
  return response.data;
}

export async function deleteMcpServer(id: string): Promise<boolean> {
  const response = await api.delete(`/mcp/servers/${id}`);
  return response.data;
}

export async function connectMcpServer(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/mcp/servers/${id}/connect`);
  return response.data;
}

export async function disconnectMcpServer(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/mcp/servers/${id}/disconnect`);
  return response.data;
}

export async function getMcpTools(serverId?: string): Promise<any[]> {
  if (serverId) {
    const response = await api.get(`/mcp/servers/${serverId}/tools`);
    return response.data;
  }
  const response = await api.get('/mcp/tools');
  return response.data;
}
