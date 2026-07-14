import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { chatApi } from '@/services/chat';
import { sessionsApi } from '@/services/sessions';
import { modelsApi, AIModelConfig } from '@/services/models';
import { Send, Square, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';
import type { Message } from '@/types';

export function ChatPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { 
    messages, 
    addMessage, 
    setMessages, 
    clearMessages,
    currentSession,
    setCurrentSession
  } = useChatStore();

  const { isAuthenticated } = useAuthStore();

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

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 创建新会话
  const createSession = async () => {
    try {
      const { data } = await sessionsApi.create({ title: '新对话' });
      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error('Failed to create session:', error);
      // 创建本地会话
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

  // 确保有会话
  useEffect(() => {
    if (!currentSession) {
      createSession();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // 添加用户消息
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      sessionId: currentSession?.id || 'default',
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    addMessage(tempUserMsg);

    try {
      // 调用流式 API
      if (currentSession) {
        const assistantMessageId = `temp-assistant-${Date.now()}`;
        
        // 添加一个空的助手消息用于流式更新
        addMessage({
          id: assistantMessageId,
          sessionId: currentSession.id,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        });

        eventSourceRef.current = chatApi.streamChat(
          currentSession.id,
          userMessage,
          (chunk) => {
            // 更新流式消息内容
            useChatStore.setState((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ),
            }));
          },
          selectedModel,
          () => {
            // 流式完成
            setIsLoading(false);
          },
          () => {
            // 流式失败，调用非流式
            chatApi.sendMessage({
              sessionId: currentSession.id,
              message: userMessage,
              model: selectedModel,
            }).then(({ data }) => {
              useChatStore.setState((state) => ({
                messages: state.messages.map((msg) =>
                  msg.id === assistantMessageId ? data : msg
                ),
              }));
            }).catch(() => {
              useChatStore.setState((state) => ({
                messages: state.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: '抱歉，发生了错误' }
                    : msg
                ),
              }));
            }).finally(() => {
              setIsLoading(false);
            });
          },
          (errorMsg?: string) => {
            // 流式错误，检查是否是429限流
            let errorContent = '抱歉，发生了错误';
            if (errorMsg && (errorMsg.includes('429') || errorMsg.includes('Too Many Requests'))) {
              errorContent = '请求过于频繁，请稍后再试';
            }
            useChatStore.setState((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: errorContent }
                  : msg
              ),
            }));
            setIsLoading(false);
          }
        );
      }
    } catch (error) {
      console.error('Send message error:', error);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    eventSourceRef.current?.close();
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-textMuted mt-20">
            <p className="text-lg mb-2">你好，我是小智</p>
            <p className="text-sm">输入消息开始对话</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0">
              {msg.role === 'user' ? 'U' : 'X'}
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-surface-light text-textPrimary rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {/* 消息反馈按钮 */}
              {msg.role === 'assistant' && (
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-surface-lighter rounded">
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-surface-lighter rounded">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
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
      </div>

      {/* 模型选择器 */}
      <div className="px-4 py-2 border-b border-border bg-surface-light/30">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <span className="text-sm text-textMuted">模型:</span>
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-light border border-border rounded-lg text-sm hover:border-primary transition-colors"
            >
              <span className="text-white">{selectedModel || '选择模型'}</span>
              <ChevronDown className="w-4 h-4 text-textMuted" />
            </button>
            {showModelDropdown && (
              <div className="absolute bottom-full mb-1 left-0 bg-surface-light border border-border rounded-lg shadow-lg overflow-hidden z-10">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-primary hover:text-white transition-colors ${
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
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-border bg-surface-light/30">
        <div className="max-w-4xl mx-auto flex gap-2">
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
            placeholder="输入消息，Enter 发送..."
            className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white placeholder-textMuted"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
