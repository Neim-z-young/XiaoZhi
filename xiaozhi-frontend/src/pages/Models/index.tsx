import { useState, useEffect } from 'react';
import { modelsApi, AIModelConfig } from '@/services/models';

interface ModelWithSource extends AIModelConfig {
  isPreset: boolean;
}

export function ModelsPage() {
  const [models, setModels] = useState<ModelWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelWithSource | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    model: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'custom',
    baseURL: 'https://api.openai.com/v1',
    apiKeyEnv: '',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const { data } = await modelsApi.list();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (model: AIModelConfig) => {
    try {
      if (model.enabled) {
        await modelsApi.disable(model.id);
      } else {
        await modelsApi.enable(model.id);
      }
      loadModels();
    } catch (error) {
      console.error('Failed to toggle model:', error);
    }
  };

  const handleAdd = () => {
    setEditingModel(null);
    setFormData({
      id: '',
      name: '',
      model: '',
      provider: 'openai',
      baseURL: 'https://api.openai.com/v1',
      apiKeyEnv: '',
      apiKey: '',
      maxTokens: 4096,
      temperature: 0.7,
      enabled: true,
    });
    setShowModal(true);
  };

  const handleEdit = (model: AIModelConfig) => {
    setEditingModel(model);
    setFormData({
      id: model.id,
      name: model.name,
      model: (model as any).model || model.id,
      provider: model.provider,
      baseURL: (model as any).baseURL || 'https://api.openai.com/v1',
      apiKeyEnv: '',
      apiKey: '',
      maxTokens: model.maxTokens || 4096,
      temperature: model.temperature || 0.7,
      enabled: model.enabled,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模型吗？')) return;
    try {
      await modelsApi.delete(id);
      loadModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const handleSubmit = async () => {
        try {
          const submitData: any = { ...formData };
          
          // 如果 model 未指定，使用 id
          if (!submitData.model) {
            submitData.model = submitData.id;
          }
          
          // 如果填写了 apiKeyEnv，清空 apiKey（让后端使用环境变量）
          // 如果只填写了 apiKey，发送到后端加密存储
          // 如果两个都没填，后端会返回错误
          if (submitData.apiKeyEnv && !submitData.apiKey) {
            delete submitData.apiKey;
          } else if (!submitData.apiKeyEnv && !submitData.apiKey) {
            // 两者都没有，检查是否编辑模式
            if (!editingModel) {
              alert('请提供 API 密钥或环境变量名');
              return;
            }
            // 编辑模式下保留原密钥
            delete submitData.apiKey;
          }

          if (editingModel) {
            await modelsApi.update(editingModel.id, submitData);
          } else {
            await modelsApi.create(submitData);
          }
          setShowModal(false);
          loadModels();
        } catch (error) {
          console.error('Failed to save model:', error);
        }
      };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      openai: { text: 'OpenAI', color: 'bg-green-500/20 text-green-400' },
      anthropic: { text: 'Anthropic', color: 'bg-orange-500/20 text-orange-400' },
      custom: { text: 'Custom', color: 'bg-blue-500/20 text-blue-400' },
    };
    return labels[provider] || { text: provider, color: 'bg-gray-500/20 text-gray-400' };
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-textPrimary">模型管理</h1>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            添加模型
          </button>
        </div>

        {/* 模型列表 */}
        <div className="space-y-3">
          {models.map((model) => {
            const providerInfo = getProviderLabel(model.provider);
            return (
              <div
                key={model.id}
                className="bg-surface-light rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs ${providerInfo.color}`}>
                      {providerInfo.text}
                    </span>
                    {model.isPreset && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                        预制
                      </span>
                    )}
                    <div>
                      <div className="font-medium text-textPrimary">{model.name}</div>
                      <div className="text-sm text-textMuted">
                        ID: {model.id} | API: {model.model || model.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      model.hasApiKey ? 'bg-success/20 text-success' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {model.hasApiKey ? '已配置密钥' : '未配置密钥'}
                    </span>
                    <button
                      onClick={() => handleToggle(model)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        model.enabled
                          ? 'bg-success/20 text-success hover:bg-success/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {model.enabled ? '已启用' : '已禁用'}
                    </button>
                    {model.isPreset ? (
                      <span className="text-xs text-textMuted px-4 py-2">
                        预制模型不可编辑
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(model)}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(model.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {models.length === 0 && (
          <div className="text-center py-12 text-textMuted">
            暂无模型配置，点击"添加模型"创建一个
          </div>
        )}

        {/* 添加/编辑弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold text-textPrimary mb-4">
                {editingModel ? '编辑模型' : '添加模型'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-textMuted mb-1">模型 ID（唯一标识）</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingModel}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary disabled:opacity-50"
                    placeholder="如: gpt-4o-mini"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-textMuted mb-1">显示名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    placeholder="如: GPT-4o Mini"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-textMuted mb-1">API 模型名</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    placeholder="如: gpt-4o-mini（与 ID 相同时可留空）"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-textMuted mb-1">Provider</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-textMuted mb-1">API 密钥环境变量名</label>
                    <input
                      type="text"
                      value={formData.apiKeyEnv}
                      onChange={(e) => setFormData({ ...formData, apiKeyEnv: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                      placeholder="如: OPENAI_API_KEY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-textMuted mb-1">API 密钥（直接输入，加密存储）</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    placeholder="直接输入 API 密钥（将加密存储）"
                  />
                  <p className="text-xs text-textMuted mt-1">API 密钥和密钥环境变量二选一，密钥将使用 AES-256 加密存储</p>
                </div>
                
                <div>
                  <label className="block text-sm text-textMuted mb-1">Base URL</label>
                  <input
                    type="text"
                    value={formData.baseURL}
                    onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    placeholder="如: https://api.openai.com/v1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-textMuted mb-1">最大 Token 数</label>
                    <input
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-textMuted mb-1">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-textPrimary"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="enabled" className="text-textPrimary">启用</label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-light border border-border rounded-lg text-textPrimary hover:bg-surface-lighter"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 p-4 bg-surface-light rounded-xl border border-border">
          <h3 className="font-medium text-textPrimary mb-2">配置说明</h3>
          <ul className="text-sm text-textMuted space-y-1">
            <li><strong>模型 ID</strong> - 唯一标识符，用于前端选择模型</li>
            <li><strong>API 模型名</strong> - 实际传给 API 的模型名，不同时可单独填写</li>
            <li><strong>API 密钥</strong> - 建议使用环境变量方式配置</li>
            <li><strong>Provider</strong> - 支持 OpenAI、Anthropic 和自定义 API</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
