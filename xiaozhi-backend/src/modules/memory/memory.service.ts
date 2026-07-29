import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '../../config/configuration';
import { RedisService } from './redis.service';
import { LongTermMemory } from '../../entities/memory.entity';
import { AIGatewayService } from '../ai/ai-gateway.service';

type EmbeddingProvider = 'none' | 'api' | 'pgvector';

export interface ShortTermMemoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  // 短时记忆 TTL：7 天
  private readonly SHORT_TERM_TTL = 7 * 24 * 60 * 60;
  // 短时记忆最大条数
  private readonly MAX_SHORT_TERM_ITEMS = 100;

  private embeddingProvider: EmbeddingProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @InjectRepository(LongTermMemory)
    private readonly memoryRepository: Repository<LongTermMemory>,
    private readonly aiGateway: AIGatewayService,
  ) {
    this.initEmbeddingConfig();
    this.logger.log(`MemoryService initialized, embedding provider: ${this.embeddingProvider}`);
  }

  private initEmbeddingConfig() {
    const embeddingConfig = this.configService.get<any>('embedding') || {};
    this.embeddingProvider = embeddingConfig.provider || 'none';

    // pgvector 需要 PostgreSQL
    if (this.embeddingProvider === 'pgvector') {
      const dbType = this.configService.get<string>('database.type');
      if (dbType !== 'postgres') {
        this.logger.warn('pgvector 模式需要 PostgreSQL，当前使用 sqlite，切换到 none 模式');
        this.embeddingProvider = 'none';
      }
    }
  }

  getEmbeddingProvider(): EmbeddingProvider {
    return this.embeddingProvider;
  }

  /**
   * 写入短时记忆
   */
  async writeShortTerm(sessionId: string, content: string, role: 'user' | 'assistant' | 'system'): Promise<void> {
    const key = `session:${sessionId}:short_memory`;
    
    const item: ShortTermMemoryItem = {
      role,
      content,
      timestamp: Date.now(),
    };

    await this.redisService.lpush(key, JSON.stringify(item));
    
    const currentLength = await this.redisService.llen(key);
    if (currentLength > this.MAX_SHORT_TERM_ITEMS) {
      await this.redisService.ltrim(key, 0, this.MAX_SHORT_TERM_ITEMS - 1);
    }

    const existingTtl = await this.redisService.get(`${key}:ttl`);
    if (!existingTtl) {
      await this.redisService.set(`${key}:ttl`, '1', this.SHORT_TERM_TTL);
    }

    this.logger.debug(`Short-term memory written: session=${sessionId}, role=${role}`);
  }

  /**
   * 读取短时记忆
   */
  async readShortTerm(sessionId: string, limit = 50): Promise<ShortTermMemoryItem[]> {
    const key = `session:${sessionId}:short_memory`;
    
    const items = await this.redisService.lrange(key, 0, limit - 1);
    
    return items.map(item => {
      try {
        return JSON.parse(item) as ShortTermMemoryItem;
      } catch {
        return null;
      }
    }).filter((item): item is ShortTermMemoryItem => item !== null);
  }

  /**
   * 清除短时记忆
   */
  async clearShortTerm(sessionId: string): Promise<void> {
    const key = `session:${sessionId}:short_memory`;
    await this.redisService.del(key);
    await this.redisService.del(`${key}:ttl`);
    this.logger.log(`Short-term memory cleared: session=${sessionId}`);
  }

  /**
   * 写入长时记忆
   */
  async writeLongTerm(
    userId: string,
    agentId: string,
    content: string,
    sessionId?: string,
    memoryType = 'conversation',
    metadata?: Record<string, any>,
  ): Promise<LongTermMemory> {
    const memory = new LongTermMemory();
    memory.userId = userId;
    memory.agentId = agentId;
    memory.sessionId = sessionId || '';
    memory.content = content;
    memory.memoryType = memoryType;
    memory.metadata = metadata || null;

    const saved = await this.memoryRepository.save(memory);
    this.logger.log(`Long-term memory written: id=${saved.id}, agent=${agentId}, type=${memoryType}`);
    
    return saved;
  }

  /**
   * 搜索长时记忆（关键词搜索）
   */
  async searchLongTerm(
    userId: string,
    agentId: string,
    query: string,
    topK = 5,
  ): Promise<{ id: string; content: string; createdAt: Date }[]> {
    // 使用 SQLite/PostgreSQL 都支持的 LIKE 搜索
    const memories = await this.memoryRepository
      .createQueryBuilder('memory')
      .where('memory.user_id = :userId', { userId })
      .andWhere('memory.agent_id = :agentId', { agentId })
      .andWhere('memory.content LIKE :query', { query: `%${query}%` })
      .orderBy('memory.created_at', 'DESC')
      .take(topK)
      .getMany();

    return memories.map(memory => ({
      id: memory.id,
      content: memory.content,
      createdAt: memory.createdAt,
    }));
  }

  /**
   * 获取用户的所有长时记忆
   */
  async getLongTermMemories(
    userId: string,
    agentId?: string,
    limit = 50,
    offset = 0,
  ): Promise<LongTermMemory[]> {
    const where: any = { userId };
    if (agentId) {
      where.agentId = agentId;
    }

    return this.memoryRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * 删除长时记忆
   */
  async deleteLongTerm(memoryId: string, userId: string): Promise<boolean> {
    const result = await this.memoryRepository.delete({
      id: memoryId,
      userId,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * 总结短时记忆并写入长时记忆
   */
  async consolidate(sessionId: string, agentId: string, userId: string): Promise<string> {
    this.logger.log(`Starting memory consolidation: session=${sessionId}, agent=${agentId}`);

    const shortTermMemories = await this.readShortTerm(sessionId, this.MAX_SHORT_TERM_ITEMS);
    
    if (shortTermMemories.length === 0) {
      return 'No short-term memories to consolidate';
    }

    const contentToSummarize = shortTermMemories
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    let summary = '';
    try {
      const response = await this.aiGateway.complete({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `请总结以下对话内容，提取关键信息和重要细节。
总结要求：
1. 保留关键事实、决策、偏好和重要事件
2. 用简洁的语言概括，不要超过500字
3. 使用第一人称叙述，仿佛在回忆这段对话`,
          },
          {
            role: 'user',
            content: `请总结以下对话内容：\n${contentToSummarize}`,
          },
        ],
        temperature: 0.5,
        maxTokens: 1000,
      });

      summary = response.content;
    } catch (error: any) {
      this.logger.error(`Failed to summarize memories: ${error.message}`);
      summary = `对话记录：\n${contentToSummarize.substring(0, 500)}`;
    }

    await this.writeLongTerm(userId, agentId, summary, sessionId, 'consolidated', {
      originalMessageCount: shortTermMemories.length,
      summarizedAt: new Date().toISOString(),
    });

    await this.clearShortTerm(sessionId);

    this.logger.log(`Memory consolidation completed: session=${sessionId}`);
    
    return summary;
  }

  /**
   * 获取记忆统计
   */
  async getMemoryStats(userId: string, agentId: string): Promise<{
    longTermCount: number;
    embeddingProvider: EmbeddingProvider;
  }> {
    const longTermCount = await this.memoryRepository.count({
      where: { userId, agentId },
    });

    return {
      longTermCount,
      embeddingProvider: this.embeddingProvider,
    };
  }
}
