import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { toolsApi, Tool } from '@/services/tools';

export function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // StrictMode 在开发模式下会 double-invoke effects，通过 AbortController 取消上一个请求避免重复
  useEffect(() => {
    abortRef.current = new AbortController();
    loadTools();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadTools = async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    try {
      const { data } = await toolsApi.list(abortRef.current.signal);
      setTools(data.list || []);
    } catch (error: any) {
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (tool: Tool) => {
    try {
      if (tool.enabled) {
        await toolsApi.disable(tool.id);
      } else {
        await toolsApi.enable(tool.id);
      }
      loadTools();
    } catch (error) {
      console.error('Failed to toggle tool:', error);
    }
  };

  const handleInit = async () => {
    try {
      await toolsApi.init();
      loadTools();
      alert('内置工具已初始化');
    } catch (error) {
      console.error('Failed to init tools:', error);
    }
  };

  const getLevelLabel = (level: number) => {
    const labels: Record<number, { text: string; color: string }> = {
      1: { text: 'L1 安全', color: 'bg-success/20 text-success' },
      2: { text: 'L2 低风险', color: 'bg-blue-500/20 text-blue-400' },
      3: { text: 'L3 中风险', color: 'bg-yellow-500/20 text-yellow-400' },
      4: { text: 'L4 高风险', color: 'bg-orange-500/20 text-orange-400' },
      5: { text: 'L5 危险', color: 'bg-red-500/20 text-red-400' },
    };
    return labels[level] || { text: `L${level}`, color: 'bg-gray-500/20 text-gray-400' };
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
          <h1 className="text-2xl font-bold text-textPrimary">工具管理</h1>
          <button
            onClick={handleInit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            初始化内置工具
          </button>
        </div>

        {/* 工具列表 */}
        <div className="space-y-3">
          {tools.map((tool) => {
            const levelInfo = getLevelLabel(tool.level);
            return (
              <div
                key={tool.id}
                className="bg-surface-light rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs ${levelInfo.color}`}>
                      {levelInfo.text}
                    </span>
                    <div>
                      <div className="font-medium text-textPrimary">{tool.name}</div>
                      <div className="text-sm text-textMuted">{tool.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(tool)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        tool.enabled
                          ? 'bg-success/20 text-success hover:bg-success/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {tool.enabled ? '已启用' : '已禁用'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tools.length === 0 && (
          <div className="text-center py-12 text-textMuted">
            暂无工具配置，点击"初始化内置工具"添加
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 p-4 bg-surface-light rounded-xl border border-border">
          <h3 className="font-medium text-textPrimary mb-2">风险等级说明</h3>
          <ul className="text-sm text-textMuted space-y-1">
            <li><span className="text-success">L1 安全</span> - 只读操作，直接执行</li>
            <li><span className="text-blue-400">L2 低风险</span> - 无破坏性写操作，直接执行</li>
            <li><span className="text-yellow-400">L3 中风险</span> - 需要用户确认</li>
            <li><span className="text-orange-400">L4 高风险</span> - 需要明确审批</li>
            <li><span className="text-red-400">L5 危险</span> - 完全禁止执行</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
