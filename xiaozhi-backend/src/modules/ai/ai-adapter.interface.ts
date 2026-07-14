export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  model: string;
  messages: AIMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}

export interface AIAdapter {
  complete(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncGenerator<AIStreamResponse>;
}
