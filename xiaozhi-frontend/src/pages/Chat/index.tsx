import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { chatApi } from '@/services/chat';
import { sessionsApi } from '@/services/sessions';
import { modelsApi, AIModelConfig } from '@/services/models';
import { toolsApi } from '@/services/tools';
import { Send, Square, ChevronDown, Loader, Sparkles, Check } from 'lucide-react';
import type { Message } from '@/types';

interface AgentStreamEvent {
  type: 'thought' | 'action' | 'observation' | 'confirm_request' | 'done' | 'error';
  content?: string;
  tool?: string;
  requiresConfirm?: boolean;
  confirmId?: string;
  details?: any;
}

interface ThoughtStep {
  id: string;
  type: 'thinking' | 'action' | 'observation';
  label: string;
  content: string;
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(true);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const thoughtStepsRef = useRef<ThoughtStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isThinkingComplete, setIsThinkingComplete] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [pendingConfirmations, setPendingConfirmations] = useState<Array<{ confirmId: string; toolName: string; args: any }>>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [collapsedThinking, setCollapsedThinking] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const thinkingContentRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    addMessage, 
    setMessages, 
    clearMessages,
    currentSession,
    setCurrentSession
  } = useChatStore();

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { data } = await modelsApi.list();
        const availableModels = data.models.filter(m => m.enabled && m.hasApiKey);
        setModels(availableModels);
        if (availableModels.length > 0 && !selectedModel) {
          setSelectedModel(availableModels[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  // 获取待确认列表
  const fetchPendingConfirmations = async () => {
    try {
      const { data } = await toolsApi.getPendingConfirmations();
      setPendingConfirmations(data.map((c: any) => ({
        confirmId: c.id,
        toolName: c.toolName,
        args: c.arguments,
      })));
    } catch (error) {
      console.error('Failed to fetch pending confirmations:', error);
    }
  };

  useEffect(() => {
    if (isAgentMode) {
      fetchPendingConfirmations();
      const interval = setInterval(fetchPendingConfirmations, 5000);
      return () => clearInterval(interval);
    }
  }, [isAgentMode]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thoughtSteps, streamingContent]);

  // 创建新会话
  const createSession = async () => {
    try {
      const { data } = await sessionsApi.create({ title: '新对话' });
      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error('Failed to create session:', error);
      const localSession = {
        id: `local-${Date.now()}`,
        title: '新对话',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setCurrentSession(localSession);
      return localSession;
    }
  };

  useEffect(() => {
    if (!currentSession) {
      createSession();
    }
  }, []);

  // Agent 模式发送
  const handleAgentSend = async () => {
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // 重置思考状态
    setThoughtSteps([]);
    thoughtStepsRef.current = [];
    setCurrentStep(0);
    setTotalSteps(0);
    setIsThinkingComplete(false);
    setStreamingContent('');
    setShowThinking(true);
    // 不再清空折叠状态，保持旧消息的折叠状态

    // 添加用户消息到列表
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      sessionId: currentSession?.id || 'default',
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    addMessage(tempUserMsg);

    const params = new URLSearchParams({
      message: userMessage,
      model: selectedModel,
      sessionId: currentSession?.id || `agent-${Date.now()}`,
    });

    const eventSource = new EventSource(
      `/api/agent/stream?${params.toString()}`
    );
    eventSourceRef.current = eventSource;

    let stepIndex = 0;
    const stepLabels: Record<string, string> = {
      thinking: '分析请求',
      action: '执行工具',
      observation: '观察结果',
    };

    eventSource.onmessage = (event) => {
      try {
        const data: AgentStreamEvent = JSON.parse(event.data);

        // 使用唯一 ID 生成器
        const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        if (data.type === 'thought') {
          // 累积思考内容到当前步骤，而不是创建新步骤
          setThoughtSteps(prev => {
            // 如果最后一个是思考步骤，追加内容
            if (prev.length > 0 && prev[prev.length - 1].type === 'thinking') {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + (data.content || ''),
              };
              thoughtStepsRef.current = updated;
              return updated;
            }
            // 否则创建新的思考步骤
            stepIndex++;
            setTotalSteps(prev => prev + 1);
            setCurrentStep(stepIndex);
            setStreamingContent(data.content || '');
            const newStep = {
              id: generateId(),
              type: 'thinking' as const,
              label: stepLabels.thinking,
              content: data.content || '',
            };
            thoughtStepsRef.current = [...prev, newStep];
            return [...prev, newStep];
          });
        } else if (data.type === 'action') {
          stepIndex++;
          setTotalSteps(prev => prev + 1);
          setCurrentStep(stepIndex);
          setStreamingContent(`正在调用工具: ${data.tool}\n`);
          const newStep = {
            id: generateId(),
            type: 'action' as const,
            label: stepLabels.action,
            content: data.content || `正在调用工具: ${data.tool}`,
          };
          setThoughtSteps(prev => {
            thoughtStepsRef.current = [...prev, newStep];
            return [...prev, newStep];
          });
        } else if (data.type === 'confirm_request') {
          // 添加待确认项
          if (data.confirmId && data.tool) {
            setPendingConfirmations(prev => {
              if (prev.some(c => c.confirmId === data.confirmId)) {
                return prev;
              }
              return [...prev, {
                confirmId: data.confirmId,
                toolName: data.tool,
                args: data.details || {},
              }];
            });
          }
        } else if (data.type === 'observation') {
          stepIndex++;
          setTotalSteps(prev => prev + 1);
          setCurrentStep(stepIndex);
          setStreamingContent(data.content || '');
          const newStep = {
            id: generateId(),
            type: 'observation' as const,
            label: stepLabels.observation,
            content: data.content || '',
          };
          setThoughtSteps(prev => {
            thoughtStepsRef.current = [...prev, newStep];
            return [...prev, newStep];
          });
        } else if (data.type === 'done') {
          setIsThinkingComplete(true);
          setStreamingContent('');
          // 使用 ref 获取最新的思考过程
          const currentSteps = thoughtStepsRef.current;
          const msgId = `agent-${Date.now()}`;
          addMessage({
            id: msgId,
            sessionId: currentSession?.id || 'default',
            role: 'assistant',
            content: data.content || '',
            createdAt: new Date().toISOString(),
            thinkingSteps: currentSteps,
          });
          // 思考完成，自动折叠思考过程
          setCollapsedThinking(prev => new Set(prev).add(msgId));
          setIsLoading(false);
          // 清空思考过程
          setThoughtSteps([]);
          thoughtStepsRef.current = [];
          eventSource.close();
        } else if (data.type === 'error') {
          setIsThinkingComplete(true);
          setStreamingContent('');
          const currentSteps = thoughtStepsRef.current;
          const msgId = `error-${Date.now()}`;
          addMessage({
            id: msgId,
            sessionId: currentSession?.id || 'default',
            role: 'assistant',
            content: data.content || '发生错误',
            createdAt: new Date().toISOString(),
            thinkingSteps: currentSteps,
          });
          setCollapsedThinking(prev => new Set(prev).add(msgId));
          setIsLoading(false);
          setThoughtSteps([]);
          thoughtStepsRef.current = [];
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsLoading(false);
      setIsThinkingComplete(true);
      eventSource.close();
    };
  };

  // 普通模式发送
  const handleNormalSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      sessionId: currentSession?.id || 'default',
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    addMessage(tempUserMsg);

    // 创建空的 assistant 消息用于流式更新
    let accumulatedContent = '';
    const assistantMsgId = `assistant-${Date.now()}`;
    const tempAssistantMsg: Message = {
      id: assistantMsgId,
      sessionId: currentSession?.id || 'default',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    addMessage(tempAssistantMsg);

    let hasErrored = false;

    try {
      if (currentSession) {
        eventSourceRef.current = chatApi.streamChat(
          currentSession.id,
          userMessage,
          selectedModel
        );

        eventSourceRef.current.onerror = () => {
          if (hasErrored) return;
          hasErrored = true;
          eventSourceRef.current?.close();
          // 移除空的 assistant 消息
          setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
          // 回退到非流式
          chatApi.sendMessage({
            sessionId: currentSession.id,
            message: userMessage,
            model: selectedModel,
          }).then(({ data }) => {
            addMessage(data);
          }).catch(() => {
            addMessage({
              id: `error-${Date.now()}`,
              sessionId: currentSession.id,
              role: 'assistant',
              content: '抱歉，发生了错误',
              createdAt: new Date().toISOString(),
            });
          }).finally(() => {
            setIsLoading(false);
          });
        };

        eventSourceRef.current.onmessage = (event) => {
          if (hasErrored) return;
          try {
            const data = JSON.parse(event.data);
            if (data.content?.startsWith('错误:')) {
              hasErrored = true;
              eventSourceRef.current?.close();
              // 移除空的 assistant 消息
              setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
              if (data.content.includes('429') || data.content.includes('Too Many Requests')) {
                addMessage({
                  id: `error-${Date.now()}`,
                  sessionId: currentSession.id,
                  role: 'assistant',
                  content: '请求过于频繁，请稍后再试',
                  createdAt: new Date().toISOString(),
                });
              } else {
                addMessage({
                  id: `error-${Date.now()}`,
                  sessionId: currentSession.id,
                  role: 'assistant',
                  content: data.content,
                  createdAt: new Date().toISOString(),
                });
              }
              setIsLoading(false);
            } else if (data.content !== undefined) {
              // 累积流式内容
              accumulatedContent += data.content;
              // 更新 assistant 消息
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.findIndex(m => m.id === assistantMsgId);
                if (lastIdx !== -1) {
                  updated[lastIdx] = { ...updated[lastIdx], content: accumulatedContent };
                }
                return updated;
              });
            }
            if (data.done) {
              eventSourceRef.current?.close();
              setIsLoading(false);
            }
          } catch {}
        };
      }
    } catch (error) {
      console.error('Send message error:', error);
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (isAgentMode) {
      handleAgentSend();
    } else {
      handleNormalSend();
    }
  };

  const handleStop = () => {
    eventSourceRef.current?.close();
    setIsLoading(false);
  };

  const handleApprove = async (confirmId: string) => {
    try {
      await toolsApi.approve(confirmId);
      // 立即移除已批准的项
      setPendingConfirmations(prev => prev.filter(c => c.confirmId !== confirmId));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (confirmId: string) => {
    try {
      await toolsApi.reject(confirmId);
      // 移除已拒绝的项
      setPendingConfirmations(prev => prev.filter(c => c.confirmId !== confirmId));
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-textMuted mt-20">
            <p className="text-lg mb-2">你好，我是小智</p>
            <p className="text-sm">输入消息开始对话</p>
          </div>
        )}

        {(messages || []).map((msg) => {
          // 根据消息内容判断类型
          const isEmpty = !msg.content || msg.content.trim() === '';
          const isWarning = isEmpty || msg.content.includes('抱歉') || msg.content.includes('警告') || msg.content.includes('错误');
          const isSystem = msg.role === 'system';
          // 空内容显示为警告提示
          const displayContent = isEmpty ? '抱歉，我没有获取到有效的内容。请稍后重试，或者尝试更具体地描述您的需求。' : msg.content;

          return (
            <div key={msg.id}>
              <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : isWarning ? 'bg-amber-500' : isSystem ? 'bg-gray-500' : 'bg-primary'
                }`}>
                  {msg.role === 'user' ? 'U' : isWarning ? '!' : 'X'}
                </div>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : isWarning
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-tl-none'
                    : isSystem
                    ? 'bg-gray-100 text-gray-600 rounded-tl-none'
                    : 'bg-surface-light text-textPrimary rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{displayContent}</p>
                </div>
              </div>
              {/* 消息附带的思考过程 */}
              {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                <div className="mt-2 ml-11 rounded-xl overflow-hidden border border-border bg-surface">
                  <div
                    className="px-3 py-2 border-b border-border bg-surface-light flex items-center justify-between cursor-pointer hover:bg-border/50"
                    onClick={() => {
                      setCollapsedThinking(prev => {
                        const next = new Set(prev);
                        if (next.has(msg.id)) {
                          next.delete(msg.id);
                        } else {
                          next.add(msg.id);
                        }
                        return next;
                      });
                    }}
                  >
                    <span className="text-xs font-medium text-textSecondary">思考过程</span>
                    <span className="text-xs text-textMuted">
                      {collapsedThinking.has(msg.id) ? '▶' : '▼'}
                    </span>
                  </div>
                  {!collapsedThinking.has(msg.id) && (
                    <div>
                      <div className="px-3 py-2">
                        {msg.thinkingSteps.map((step, idx) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${
                                step.type === 'thinking' ? 'text-primary'
                                  : step.type === 'action' ? 'text-warning'
                                  : 'text-success'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                            <pre className="text-xs text-textSecondary whitespace-pre-wrap font-mono leading-relaxed bg-surface-light rounded-lg p-2">
                              {typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
                            </pre>
                          </div>
                        ))}
                      </div>
                      {/* 底部折叠按钮 */}
                      <div
                        className="px-3 py-2 border-t border-border bg-surface-light flex items-center justify-center cursor-pointer hover:bg-border/50 text-xs text-textMuted"
                        onClick={() => {
                          setCollapsedThinking(prev => {
                            const next = new Set(prev);
                            next.add(msg.id);
                            return next;
                          });
                        }}
                      >
                        <span>收起 ▲</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && !isAgentMode && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              X
            </div>
            <div className="bg-surface-light rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Agent 思考过程 - 仅在加载过程中显示 */}
        {isAgentMode && isLoading && !isThinkingComplete && (thoughtSteps.length > 0 || streamingContent) && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-surface">
            {/* 思考头部 */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-light transition-colors"
              onClick={() => setShowThinking(!showThinking)}
            >
              {/* 图标 */}
              <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                isThinkingComplete
                  ? 'bg-success/20 text-success'
                  : 'bg-primary/20 text-primary'
              }`}>
                {isThinkingComplete ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </div>

              {/* 标签 */}
              <span className="text-sm font-medium text-textPrimary">Agent 思考过程</span>

              {/* 进度 */}
              {isThinkingComplete ? (
                <span className="text-xs text-success">完成</span>
              ) : (
                <span className="text-xs text-textMuted">{currentStep}/{totalSteps} 步</span>
              )}

              {/* 加载动画 */}
              {!isThinkingComplete && (
                <div className="flex gap-1 ml-2">
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}

              {/* 展开/收起按钮 */}
              <button
                className="ml-auto text-xs text-textMuted hover:text-textPrimary px-2 py-1 rounded bg-surface-light hover:bg-border transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThinking(!showThinking);
                }}
              >
                {showThinking ? '收起' : '展开'}
              </button>
            </div>

            {/* 思考内容 */}
            {showThinking && (
              <div className="px-4 py-3 border-t border-border">
                {/* 历史步骤 */}
                {thoughtSteps.map((step) => (
                  <div key={step.id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${
                        step.type === 'thinking' ? 'text-primary'
                          : step.type === 'action' ? 'text-warning'
                          : 'text-success'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    <pre className="text-xs text-textSecondary whitespace-pre-wrap font-mono leading-relaxed bg-surface-light rounded-lg p-3">
                      {typeof step.content === 'string' ? step.content : JSON.stringify(step.content)}
                    </pre>
                  </div>
                ))}

                {/* 流式内容 */}
                {streamingContent && !isThinkingComplete && (
                  <div className="mt-2">
                    <pre className="text-xs text-textSecondary whitespace-pre-wrap font-mono leading-relaxed">
                      {typeof streamingContent === 'string' ? streamingContent : JSON.stringify(streamingContent)}
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 待确认操作 */}
      {isAgentMode && pendingConfirmations.length > 0 && (
        <div className="px-4 py-2 bg-warning/10 border-t border-warning">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-warning">待确认操作 ({pendingConfirmations.length})</span>
          </div>
          <div className="flex gap-2">
            {pendingConfirmations.map(c => (
              <div key={c.confirmId} className="flex-1 bg-surface rounded-lg p-2 text-sm">
                <span className="text-textPrimary">{c.toolName}</span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleApprove(c.confirmId)}
                    className="flex-1 px-2 py-1 bg-success text-white rounded text-xs"
                  >
                    批准
                  </button>
                  <button
                    onClick={() => handleReject(c.confirmId)}
                    className="flex-1 px-2 py-1 bg-error text-white rounded text-xs"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 模式切换和输入框 */}
      <div className="p-4 border-t border-border bg-surface-light/30">
        <div className="max-w-4xl mx-auto">
          {/* 模式切换 */}
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setIsAgentMode(!isAgentMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isAgentMode 
                  ? 'bg-primary text-white' 
                  : 'bg-surface text-textMuted hover:text-textPrimary'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isAgentMode ? 'Agent 模式' : '普通模式'}
            </button>

            {/* 模型选择 */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm hover:border-primary transition-colors"
              >
                <span className="text-white">{selectedModel || '选择模型'}</span>
                <ChevronDown className="w-4 h-4 text-textMuted" />
              </button>
              {showModelDropdown && (
                <div className="absolute bottom-full mb-1 right-0 bg-surface-light border border-border rounded-lg shadow-lg overflow-hidden z-10">
                  {models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-primary hover:text-white ${
                        selectedModel === model.id ? 'bg-primary text-white' : 'text-textPrimary'
                      }`}
                    >
                      {model.name} ({model.provider})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 输入框 */}
          <div className="flex gap-2">
            {isLoading && (
              <button
                onClick={handleStop}
                className="p-3 bg-warning hover:bg-warning/80 rounded-xl text-white transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            )}
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isAgentMode ? '输入任务指令...' : '输入消息...'}
              className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white placeholder-textMuted"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedModel}
              className="px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
