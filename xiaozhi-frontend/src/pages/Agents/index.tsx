import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { agentsApi, CreateAgentDto } from '@/services/agents';
import { modelsApi } from '@/services/models';
import { toolsApi } from '@/services/tools';
import { mcpsApi } from '@/services/mcps';
import { Plus, Pencil, Trash2, Bot, Download, Upload, Lock, Unlock, Wrench, Server } from 'lucide-react';
import type { Agent } from '@/types';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [mcps, setMcps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState<string[]>([]);
  const [importModelId, setImportModelId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAgent, setGeneratedAgent] = useState<any>(null);
  const [formData, setFormData] = useState<CreateAgentDto>({
    name: '',
    slug: '',
    description: '',
    modelId: '',
    prompt: '',
    enabled: true,
    toolNames: [],
    mcpServers: [],
    locked: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 长度限制
  const LIMITS = { name: 30, slug: 50, description: 5000, prompt: 10000 };

  // StrictMode 在开发模式下会 double-invoke effects，通过 AbortController 取消上一个请求避免重复
  useEffect(() => {
    abortRef.current = new AbortController();
    loadData();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadData = async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const [agentsRes, modelsRes, toolsRes, mcpsRes] = await Promise.all([
        agentsApi.list({}, abortRef.current.signal),
        modelsApi.list(abortRef.current.signal),
        toolsApi.list(abortRef.current.signal).catch(() => ({ data: [] })),
        mcpsApi.list(abortRef.current.signal).catch(() => ({ data: [] })),
      ]);
      setAgents(agentsRes.data.list || []);
      setModels(modelsRes.data.models || []);
      setTools(toolsRes.data?.list || toolsRes.data || []);
      setMcps(mcpsRes.data || []);
    } catch (error: any) {
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (agent: Agent) => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agent.name}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export agent:', error);
    }
  };

  const handleImport = async () => {
    if (!importContent.trim()) {
      setImportError(['请输入要导入的内容']);
      return;
    }

    // 检查是否是模板格式
    const isTemplate = /^#\s*.+\n|^###\s*名称/im.test(importContent);

    if (isTemplate) {
      // 模板格式，直接导入
      setImportError([]);
      try {
        const response = await agentsApi.import(importContent);
        if (response.data.success) {
          setShowImportModal(false);
          setImportContent('');
          setGeneratedAgent(null);
          loadData();
        } else {
          setImportError(response.data.errors || ['导入失败']);
        }
      } catch (error: any) {
        setImportError([error.response?.data?.errors?.[0] || '导入失败']);
      }
    } else {
      // 非模板格式，使用 AI 生成
      if (!importModelId) {
        setImportError(['请选择用于生成配置的模型']);
        return;
      }

      setIsGenerating(true);
      setImportError([]);
      try {
        const response = await agentsApi.generate(importContent, importModelId);
        setGeneratedAgent(response.data);
      } catch (error: any) {
        setImportError([error.response?.data?.message || '生成失败，请检查模型配置']);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleConfirmGenerate = async () => {
    if (!generatedAgent) return;

    setImportError([]);
    try {
      const response = await agentsApi.create({
        ...generatedAgent,
        modelId: importModelId || 'default',
        settings: {},
        enabled: true,
      });
      setShowImportModal(false);
      setImportContent('');
      setGeneratedAgent(null);
      setImportModelId('');
      loadData();
    } catch (error: any) {
      setImportError([error.response?.data?.message || '创建失败']);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportContent(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前端验证
    if (formData.name.length > LIMITS.name) {
      alert(`名称不能超过${LIMITS.name}字`);
      return;
    }
    if (formData.slug && formData.slug.length > LIMITS.slug) {
      alert(`英文标识名不能超过${LIMITS.slug}字`);
      return;
    }
    if (formData.description && formData.description.length > LIMITS.description) {
      alert(`描述不能超过${LIMITS.description}字`);
      return;
    }
    if (formData.prompt && formData.prompt.length > LIMITS.prompt) {
      alert(`提示词不能超过${LIMITS.prompt}字`);
      return;
    }
    
    try {
      if (editingAgent) {
        await agentsApi.update(editingAgent.id, formData);
      } else {
        await agentsApi.create(formData);
      }
      setShowModal(false);
      setEditingAgent(null);
      setFormData({ name: '', slug: '', description: '', modelId: '', prompt: '', enabled: true, toolNames: [], mcpServers: [], locked: false });
      loadData();
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        console.error('Failed to save agent:', error);
      }
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      slug: agent.slug || '',
      description: agent.description || '',
      modelId: agent.modelId,
      prompt: agent.prompt || '',
      enabled: agent.enabled,
      toolNames: agent.toolNames || [],
      mcpServers: agent.mcpServers || [],
      locked: (agent as any).locked || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个智能体吗？')) return;
    try {
      await agentsApi.delete(id);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        console.error('Failed to delete agent:', error);
      }
    }
  };

  const handleToggleLock = async (agent: Agent) => {
    try {
      if ((agent as any).locked) {
        await agentsApi.unlock(agent.id);
      } else {
        await agentsApi.lock(agent.id);
      }
      loadData();
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        console.error('Failed to toggle lock:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-textPrimary">智能体管理</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-surface rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <button
            onClick={() => {
              setEditingAgent(null);
              setFormData({ name: '', slug: '', description: '', modelId: '', prompt: '', enabled: true, toolNames: [], mcpServers: [], locked: false });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建智能体
          </button>
        </div>
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
                className={`bg-surface-light rounded-xl p-4 border transition-colors ${
                  (agent as any).locked ? 'border-yellow-500/50' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-textPrimary flex items-center gap-2">
                        {agent.name}
                        {(agent as any).locked && <Lock className="w-3.5 h-3.5 text-yellow-500" />}
                      </h3>
                      <p className="text-sm text-textMuted">{(agent as any).slug || agent.modelId}</p>
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
                    onClick={() => handleExport(agent)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-textSecondary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                    title="导出"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出
                  </button>
                  <button
                    onClick={() => handleToggleLock(agent)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      (agent as any).locked 
                        ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
                    }`}
                    title={(agent as any).locked ? '解锁' : '锁定'}
                  >
                    {(agent as any).locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {(agent as any).locked ? '解锁' : '锁定'}
                  </button>
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
          <div className="bg-surface-light rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-textPrimary mb-4">
              {editingAgent ? (editingAgent as any).locked ? '查看智能体' : '编辑智能体' : '创建智能体'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-textSecondary mb-1">
                  名称 <span className="text-textMuted text-xs">({formData.name.length}/{LIMITS.name})</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                  disabled={editingAgent?.locked}
                />
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">
                  英文标识名 <span className="text-textMuted text-xs">(可选)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="自动生成"
                  disabled={editingAgent?.locked}
                />
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">模型</label>
                <select
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                  disabled={editingAgent?.locked}
                >
                  <option value="">选择模型</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">
                  描述 <span className="text-textMuted text-xs">(可选, {formData.description?.length || 0}/{LIMITS.description})</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary h-20 resize-none"
                  placeholder="可选"
                  disabled={editingAgent?.locked}
                />
              </div>

              <div>
                <label className="block text-sm text-textSecondary mb-1">
                  系统提示词 <span className="text-textMuted text-xs">(可选, {formData.prompt?.length || 0}/{LIMITS.prompt})</span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary h-32 resize-none"
                  placeholder="可选"
                  disabled={editingAgent?.locked}
                />
              </div>

              {/* 工具选择 */}
              {tools.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm text-textSecondary mb-2">
                    <Wrench className="w-4 h-4" />
                    可用工具
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-surface rounded-lg border border-border">
                    {tools.map((tool) => (
                      <label key={tool.id} className="flex items-center gap-2 px-2 py-1 bg-surface-light rounded text-sm cursor-pointer hover:bg-primary/10">
                        <input
                          type="checkbox"
                          checked={formData.toolNames?.includes(tool.name) || false}
                          onChange={(e) => {
                            const newNames = e.target.checked
                              ? [...(formData.toolNames || []), tool.name]
                              : (formData.toolNames || []).filter(name => name !== tool.name);
                            setFormData({ ...formData, toolNames: newNames });
                          }}
                          disabled={editingAgent?.locked}
                          className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                        />
                        <span className="text-textSecondary">{tool.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* MCP 服务器选择 */}
              {mcps.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm text-textSecondary mb-2">
                    <Server className="w-4 h-4" />
                    MCP 服务器
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-surface rounded-lg border border-border">
                    {mcps.map((mcp) => (
                      <label key={mcp.id} className="flex items-center gap-2 px-2 py-1 bg-surface-light rounded text-sm cursor-pointer hover:bg-primary/10">
                        <input
                          type="checkbox"
                          checked={formData.mcpServers?.includes(mcp.id) || false}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(formData.mcpServers || []), mcp.id]
                              : (formData.mcpServers || []).filter(id => id !== mcp.id);
                            setFormData({ ...formData, mcpServers: newIds });
                          }}
                          disabled={editingAgent?.locked}
                          className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                        />
                        <span className="text-textSecondary">{mcp.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                  disabled={editingAgent?.locked}
                />
                <label htmlFor="enabled" className="text-sm text-textSecondary">启用智能体</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
                >
                  关闭
                </button>
                {!editingAgent?.locked && (
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors"
                  >
                    保存
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-textPrimary mb-4">导入智能体</h2>

            {/* 生成预览 */}
            {generatedAgent && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h3 className="font-medium text-green-400 mb-3">生成的智能体配置</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-textMuted">名称：</span>
                    <span className="text-textPrimary">{generatedAgent.name}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">英文标识：</span>
                    <span className="text-textPrimary">{generatedAgent.slug}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">描述：</span>
                    <span className="text-textPrimary line-clamp-2">{generatedAgent.description}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">提示词：</span>
                    <span className="text-textPrimary line-clamp-3">{generatedAgent.prompt?.substring(0, 200)}...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 模板说明 */}
            {!generatedAgent && (
              <div className="mb-4 p-3 bg-surface rounded-lg text-sm text-textSecondary">
                <p className="font-medium mb-2">模板格式（Markdown）：</p>
                <pre className="text-xs bg-surface-light p-2 rounded overflow-x-auto">{`# 智能体名称

## 英文标识名
my-agent

## 描述
智能体描述...

## 提示词
智能体提示词...`}</pre>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-textSecondary mb-1">
                上传文件 <span className="text-textMuted text-xs">(支持 .md, .txt 文件)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-border rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
              >
                选择文件
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-textSecondary mb-1">
                {generatedAgent ? '已生成配置' : '粘贴内容'}
              </label>
              <textarea
                value={importContent}
                onChange={(e) => {
                  setImportContent(e.target.value);
                  setGeneratedAgent(null); // 内容变化时清除生成结果
                }}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary h-48 resize-none font-mono text-sm"
                placeholder="粘贴导出的内容或使用上述模板格式..."
                disabled={!!generatedAgent}
              />
            </div>

            {/* 模型选择 */}
            {!generatedAgent && (
              <div className="mb-4">
                <label className="block text-sm text-textSecondary mb-1">
                  生成模型 <span className="text-textMuted text-xs">(非模板格式时使用 AI 生成)</span>
                </label>
                <select
                  value={importModelId}
                  onChange={(e) => setImportModelId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="">选择模型...</option>
                  {models.filter(m => m.enabled).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.model})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {importError.length > 0 && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {importError.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportContent('');
                  setImportError([]);
                  setGeneratedAgent(null);
                  setImportModelId('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
              >
                取消
              </button>
              {generatedAgent ? (
                <>
                  <button
                    type="button"
                    onClick={() => setGeneratedAgent(null)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors"
                  >
                    重新生成
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGenerate}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                  >
                    确认创建
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isGenerating || !importContent.trim()}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {isGenerating ? '生成中...' : '导入'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
