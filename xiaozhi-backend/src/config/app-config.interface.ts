export interface AIModelConfig {
  id: string;           // 唯一标识符
  name: string;         // 显示名称（前端展示）
  model: string;        // API 模型名（实际传给 API）
  provider: 'openai' | 'anthropic' | 'custom' | 'vllm';
  apiKey?: string;
  apiKeyEnv?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
}

export interface AppConfig {
  database: {
    type: 'sqlite' | 'postgres';
    database?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  redis: {
    host: string;
    port: number;
  };
  app: {
    host: string;
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  models: {
    default: string;
    enabled: AIModelConfig[];
  };
  vector: {
    dimension: number;
    provider: string;
  };
}
