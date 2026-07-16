import { create } from 'zustand';
import type { Session, Message } from '@/types';

interface ChatStore {
  sessions: Session[];
  currentSession: Session | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateStreamingMessage: (content) => set((state) => ({
    streamingContent: state.streamingContent + content,
  })),
  setMessages: (messagesOrUpdater) => set((state) => ({
    messages: typeof messagesOrUpdater === 'function'
      ? messagesOrUpdater(state.messages)
      : messagesOrUpdater
  })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  clearMessages: () => set({ messages: [], streamingContent: '' }),
}));
