export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  apiKeyEnv?: string;
  baseURL: string;
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
