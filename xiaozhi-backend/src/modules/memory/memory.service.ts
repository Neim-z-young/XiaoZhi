import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/configuration';

@Injectable()
export class MemoryService {
  constructor(private readonly configService: ConfigService) {}

  async writeShortTerm(sessionId: string, content: string, role: 'user' | 'assistant' | 'system'): Promise<void> {
    // TODO: 存储到 Redis
    // Key: session:{sessionId}:short_memory
    console.log(`Short-term memory: session=${sessionId}, role=${role}, content=${content}`);
  }

  async readShortTerm(sessionId: string): Promise<any[]> {
    // TODO: 从 Redis 读取
    // Key: session:{sessionId}:short_memory
    return [];
  }

  async writeLongTerm(userId: string, agentId: string, content: string, embedding: number[]): Promise<void> {
    // TODO: 存储到 PostgreSQL + pgvector
    // INSERT INTO long_term_memory (user_id, agent_id, content, embedding)
    console.log(`Long-term memory: user=${userId}, agent=${agentId}, content=${content}`);
  }

  async searchLongTerm(userId: string, agentId: string, query: string, embedding: number[], topK = 5): Promise<any[]> {
    // TODO: 从 pgvector 检索
    // SELECT * FROM long_term_memory 
    // WHERE agent_id = $1 
    // ORDER BY embedding <=> $2 
    // LIMIT $3
    return [
      { id: 'mem-1', content: '模拟记忆检索结果：' + query, similarity: 0.92 },
    ];
  }

  async consolidate(sessionId: string, agentId: string): Promise<void> {
    // TODO: 读取短时记忆，总结后写入长时记忆
    // 1. 读取 session:{sessionId}:short_memory
    // 2. 调用 LLM 总结
    // 3. 向量化
    // 4. 写入 long_term_memory
    console.log(`Consolidating memory: session=${sessionId}, agent=${agentId}`);
  }
}
