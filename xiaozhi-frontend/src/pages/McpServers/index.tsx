import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { Server, Plus, Trash2, Power, PowerOff, RefreshCw, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { getMcpServers, createMcpServer, updateMcpServer, deleteMcpServer, connectMcpServer, disconnectMcpServer, McpServer } from '../../services/mcp';

export function McpServersPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    command: 'npx',
    args: '-y @modelcontextprotocol/server-filesystem ./',
    cwd: '',
    enabled: false,
  });

  // StrictMode 在开发模式下会 double-invoke effects，通过 AbortController 取消上一个请求避免重复
  useEffect(() => {
    abortRef.current = new AbortController();
    loadServers();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function loadServers() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const data = await getMcpServers(abortRef.current.signal);
      setServers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to load MCP servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 解析 args 字符串为数组
      const argsArray = formData.args.split(' ').filter(arg => arg.trim());
      
      if (editingServer) {
        await updateMcpServer(editingServer.id, {
          name: formData.name,
          command: formData.command,
          args: argsArray,
          cwd: formData.cwd || undefined,
          enabled: formData.enabled,
        });
      } else {
        await createMcpServer({
          id: formData.id || undefined,
          name: formData.name,
          command: formData.command,
          args: argsArray,
          cwd: formData.cwd || undefined,
          enabled: formData.enabled,
        });
      }
      setShowForm(false);
      setEditingServer(null);
      resetForm();
      loadServers();
    } catch (error) {
      console.error('Failed to save MCP server:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个 MCP 服务器吗？')) return;
    try {
      await deleteMcpServer(id);
      loadServers();
    } catch (error) {
      console.error('Failed to delete MCP server:', error);
    }
  }

  async function handleToggleEnabled(server: McpServer) {
    try {
      await updateMcpServer(server.id, { enabled: !server.enabled });
      loadServers();
    } catch (error) {
      console.error('Failed to toggle enabled:', error);
    }
  }

  async function handleConnect(id: string) {
    setActionLoading(id);
    try {
      const result = await connectMcpServer(id);
      if (!result.success) {
        alert(`连接失败: ${result.message}`);
      }
      loadServers();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(id: string) {
    setActionLoading(id);
    try {
      await disconnectMcpServer(id);
      loadServers();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setActionLoading(null);
    }
  }

  function resetForm() {
    setFormData({
      id: '',
      name: '',
      command: 'npx',
      args: '-y @modelcontextprotocol/server-filesystem ./',
      cwd: '',
      enabled: false,
    });
  }

  function startEdit(server: McpServer) {
    setEditingServer(server);
    setFormData({
      id: server.id,
      name: server.name,
      command: server.command,
      args: server.args.join(' '),
      cwd: server.cwd || '',
      enabled: server.enabled,
    });
    setShowForm(true);
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedServers(newExpanded);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-textPrimary">MCP 服务器</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadServers}
            className="p-2 rounded-lg border border-border text-textSecondary hover:text-textPrimary hover:bg-surface-light transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingServer(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加服务器
          </button>
        </div>
      </div>

      {/* 说明 */}
      <div className="mb-6 p-4 bg-surface-light rounded-lg border border-border">
        <h3 className="font-medium text-textPrimary mb-2">什么是 MCP 服务器？</h3>
        <p className="text-sm text-textSecondary">
          MCP (Model Context Protocol) 服务器可以为 AI 助手提供额外的工具能力。
          添加服务器后，AI 可以使用这些工具来完成任务，例如搜索文件、执行命令等。
        </p>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="mb-6 p-4 bg-surface-light rounded-lg border border-border">
          <h3 className="font-medium text-textPrimary mb-4">
            {editingServer ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">
                  服务器名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                  placeholder="例如：文件系统"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">
                  服务器 ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                  placeholder="留空自动生成"
                  disabled={editingServer !== null}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">
                命令
              </label>
              <input
                type="text"
                value={formData.command}
                onChange={e => setFormData({ ...formData, command: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                placeholder="npx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">
                参数（用空格分隔）
              </label>
              <input
                type="text"
                value={formData.args}
                onChange={e => setFormData({ ...formData, args: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                placeholder="-y @modelcontextprotocol/server-filesystem ./"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">
                工作目录（可选）
              </label>
              <input
                type="text"
                value={formData.cwd}
                onChange={e => setFormData({ ...formData, cwd: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                placeholder="留空使用默认目录"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="enabled" className="text-sm text-textSecondary">
                创建后自动启用
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingServer(null);
                  resetForm();
                }}
                className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {editingServer ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 服务器列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-12 text-textSecondary">
          <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无 MCP 服务器</p>
          <p className="text-sm mt-2">点击上方"添加服务器"开始配置</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map(server => (
            <div
              key={server.id}
              className="bg-surface-light rounded-lg border border-border overflow-hidden"
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-lighter transition-colors"
                onClick={() => toggleExpand(server.id)}
              >
                {expandedServers.has(server.id) ? (
                  <ChevronDown className="w-4 h-4 text-textMuted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-textMuted" />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-textPrimary">{server.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${server.enabled ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                      {server.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted mt-1">
                    {server.command} {server.args.join(' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleEnabled(server)}
                    className={`p-2 rounded-lg transition-colors ${
                      server.enabled
                        ? 'text-green-500 hover:bg-green-500/10'
                        : 'text-gray-500 hover:bg-gray-500/10'
                    }`}
                    title={server.enabled ? '禁用' : '启用'}
                  >
                    {server.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>

                  {server.enabled && (
                    actionLoading === server.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <button
                        onClick={() => handleDisconnect(server.id)}
                        className="p-2 rounded-lg text-orange-500 hover:bg-orange-500/10 transition-colors"
                        title="断开连接"
                      >
                        <PowerOff className="w-4 h-4" />
                      </button>
                    )
                  )}

                  {server.enabled && (
                    <button
                      onClick={() => handleConnect(server.id)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="重新连接"
                      disabled={actionLoading === server.id}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => startEdit(server)}
                    className="p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
                    title="编辑"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(server.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedServers.has(server.id) && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-textMuted">ID:</span>
                      <span className="ml-2 text-textSecondary">{server.id}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">工作目录:</span>
                      <span className="ml-2 text-textSecondary">{server.cwd || '-'}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">创建时间:</span>
                      <span className="ml-2 text-textSecondary">{new Date(server.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">更新时间:</span>
                      <span className="ml-2 text-textSecondary">{new Date(server.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
