import { useState, useEffect } from 'react';
import { agentsApi, CreateAgentDto } from '@/services/agents';
import { modelsApi } from '@/services/models';
import { Plus, Pencil, Trash2, Bot } from 'lucide-react';
import type { Agent } from '@/types';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<CreateAgentDto>({
    name: '',
    description: '',
    modelId: '',
    prompt: '',
    enabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentsRes, modelsRes] = await Promise.all([
        agentsApi.list(),
        modelsApi.list(),
      ]);
      setAgents(agentsRes.data.list || []);
      setModels(modelsRes.data.models || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await agentsApi.update(editingAgent.id, formData);
      } else {
        await agentsApi.create(formData);
      }
      setShowModal(false);
      setEditingAgent(null);
      setFormData({ name: '', description: '', modelId: '', prompt: '', enabled: true });
      loadData();
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      modelId: agent.modelId,
      prompt: agent.prompt || '',
      enabled: agent.enabled,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个智能体吗？')) return;
    try {
      await agentsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-textPrimary">智能体管理</h1>
        <button
          onClick={() => {
            setEditingAgent(null);
            setFormData({ name: '', description: '', modelId: '', prompt: '', enabled: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建智能体
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-textMuted">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="text-center text-textMuted mt-20">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>还没有智能体</p>
            <p className="text-sm mt-1">点击上方按钮创建第一个智能体</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-surface-light rounded-xl p-4 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-textPrimary">{agent.name}</h3>
                      <p className="text-sm text-textMuted">{agent.modelId}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      agent.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {agent.enabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                
                {agent.description && (
                  <p className="text-sm text-textSecondary mb-3 line-clamp-2">{agent.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(agent)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-textSecondary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-textPrimary mb-4">
              {editingAgent ? '编辑智能体' : '创建智能体'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-textSecondary mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">模型</label>
                <select
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">选择模型</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary h-20 resize-none"
                  placeholder="可选"
                />
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">系统提示词</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary h-24 resize-none"
                  placeholder="可选"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                />
                <label htmlFor="enabled" className="text-sm text-textSecondary">启用智能体</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
