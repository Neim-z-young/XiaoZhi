export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  modelId: string;
  prompt?: string;
  settings: Record<string, any>;
  enabled: boolean;
  plugins?: Plugin[];
  createdAt: string;
  updatedAt: string;
}

export interface Plugin {
  id: string;
  name: string;
  type: 'mcp' | 'a2a' | 'builtin';
  description?: string;
  config: Record<string, any>;
  enabled: boolean;
  installedAt: string;
}

export interface Session {
  id: string;
  title?: string;
  agentId?: string;
  workspaceId?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, any>;
  feedback?: 'like' | 'dislike';
  feedbackComment?: string;
  createdAt: string;
  thinkingSteps?: Array<{
    type: 'thinking' | 'action' | 'observation';
    label: string;
    content: string;
  }>;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  createdAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: string;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content?: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  createdAt: string;
}
