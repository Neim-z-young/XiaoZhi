import { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { Send } from 'lucide-react';

export function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, addMessage, isStreaming } = useChatStore();

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    
    addMessage({
      id: Date.now().toString(),
      sessionId: '1',
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    });
    
    setInput('');
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              {msg.role === 'user' ? 'U' : 'X'}
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-surface-light text-textPrimary rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-border bg-surface-light/30">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="输入消息，Enter 发送..."
            className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
