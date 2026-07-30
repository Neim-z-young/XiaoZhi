import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { workspacesApi, Workspace, CreateWorkspaceDto } from '@/services/workspaces';

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [formData, setFormData] = useState<CreateWorkspaceDto>({
    name: '',
    path: '',
    enabled: true,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // StrictMode 在开发模式下会 double-invoke effects，通过 AbortController 取消上一个请求避免重复
  useEffect(() => {
    abortRef.current = new AbortController();
    loadWorkspaces();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadWorkspaces = async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    try {
      const { data } = await workspacesApi.list(abortRef.current.signal);
      setWorkspaces(data.list || []);
    } catch (error: any) {
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorkspace) {
        await workspacesApi.update(editingWorkspace.id, formData);
      } else {
        await workspacesApi.create(formData);
      }
      setShowModal(false);
      setEditingWorkspace(null);
      setFormData({ name: '', path: '', enabled: true });
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      path: workspace.path,
      enabled: workspace.enabled,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工作区吗？')) return;
    try {
      await workspacesApi.delete(id);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const handleToggle = async (workspace: Workspace) => {
    try {
      if (workspace.enabled) {
        await workspacesApi.disable(workspace.id);
      } else {
        await workspacesApi.enable(workspace.id);
      }
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to toggle workspace:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-textMuted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-textPrimary">工作区管理</h1>
          <button
            onClick={() => {
              setEditingWorkspace(null);
              setFormData({ name: '', path: '', enabled: true });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            添加工作区
          </button>
        </div>

        {/* 工作区列表 */}
        <div className="space-y-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-surface-light rounded-xl border border-border overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-lighter"
                onClick={() => setExpandedId(expandedId === workspace.id ? null : workspace.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${workspace.enabled ? 'bg-success' : 'bg-gray-500'}`} />
                  <span className="font-medium text-textPrimary">{workspace.name}</span>
                  <span className="text-sm text-textMuted">{workspace.path}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(workspace);
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      workspace.enabled
                        ? 'bg-success/20 text-success'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {workspace.enabled ? '已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(workspace);
                    }}
                    className="px-3 py-1 text-sm bg-primary/20 text-primary rounded hover:bg-primary/30"
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(workspace.id);
                    }}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    删除
                  </button>
                  <span className="text-textMuted">{expandedId === workspace.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedId === workspace.id && (
                <div className="px-4 py-3 bg-surface border-t border-border text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-textMuted">ID:</span>
                      <span className="ml-2 text-textSecondary font-mono">{workspace.id}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">路径:</span>
                      <span className="ml-2 text-textSecondary font-mono">{workspace.path}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">创建时间:</span>
                      <span className="ml-2 text-textSecondary">{new Date(workspace.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-textMuted">更新时间:</span>
                      <span className="ml-2 text-textSecondary">{new Date(workspace.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {workspaces.length === 0 && (
          <div className="text-center py-12 text-textMuted">
            暂无工作区，点击"添加工作区"创建一个
          </div>
        )}

        {/* 创建/编辑表单弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface-light rounded-xl p-6 w-full max-w-md border border-border">
              <h2 className="text-xl font-bold text-textPrimary mb-4">
                {editingWorkspace ? '编辑工作区' : '创建工作区'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-textMuted mb-1">名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                    placeholder="例如: 项目目录"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-textMuted mb-1">路径</label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary"
                    placeholder="例如: D:\project\MyProject"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="enabled" className="text-sm text-textMuted">启用</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingWorkspace(null);
                      setFormData({ name: '', path: '', enabled: true });
                    }}
                    className="px-4 py-2 text-textMuted hover:text-textPrimary"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
