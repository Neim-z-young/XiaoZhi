import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/configuration';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  // 内存备用存储（当 Redis 不可用时使用）
  private memoryStore = new Map<string, { value: string; ttl?: number }>();
  private memoryTtlIntervals = new Map<string, NodeJS.Timeout>();

  constructor(private configService: ConfigService) {
    this.connect();
  }

  private connect() {
    const redisConfig = this.configService.get<{ host: string; port: number }>('redis');
    
    if (!redisConfig || !redisConfig.host) {
      this.logger.warn('Redis 配置缺失或无效，使用内存存储作为短时记忆');
      return;
    }

    try {
      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis 连接重试次数超过3次，放弃连接');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis 客户端错误: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis 已连接');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis 连接已关闭');
        this.isConnected = false;
      });

    } catch (error: any) {
      this.logger.error(`Redis 连接失败: ${error.message}，使用内存存储作为短时记忆`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
    // 清理所有 TTL 定时器
    this.memoryTtlIntervals.forEach((timeout) => clearTimeout(timeout));
  }

  private isRedisAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisAvailable()) {
      try {
        return await this.client!.get(key);
      } catch (error: any) {
        this.logger.error(`Redis GET 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const item = this.memoryStore.get(key);
    if (item) {
      return item.value;
    }
    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        if (ttl) {
          await this.client!.setex(key, ttl, value);
        } else {
          await this.client!.set(key, value);
        }
        return;
      } catch (error: any) {
        this.logger.error(`Redis SET 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    if (ttl) {
      // 清除已有的 TTL 定时器
      const existingTimeout = this.memoryTtlIntervals.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      // 设置 TTL
      const timeout = setTimeout(() => {
        this.memoryStore.delete(key);
        this.memoryTtlIntervals.delete(key);
      }, ttl * 1000);
      this.memoryTtlIntervals.set(key, timeout);
    }
    this.memoryStore.set(key, { value, ttl });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        await this.client!.del(key);
        return;
      } catch (error: any) {
        this.logger.error(`Redis DEL 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const existingTimeout = this.memoryTtlIntervals.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.memoryTtlIntervals.delete(key);
    }
    this.memoryStore.delete(key);
  }

  async lpush(key: string, value: string): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        await this.client!.lpush(key, value);
        return;
      } catch (error: any) {
        this.logger.error(`Redis LPUSH 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const list = this.getListFromMemory(key);
    list.unshift(value);
    this.setListToMemory(key, list);
  }

  async rpush(key: string, value: string): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        await this.client!.rpush(key, value);
        return;
      } catch (error: any) {
        this.logger.error(`Redis RPUSH 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const list = this.getListFromMemory(key);
    list.push(value);
    this.setListToMemory(key, list);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.isRedisAvailable()) {
      try {
        return await this.client!.lrange(key, start, stop);
      } catch (error: any) {
        this.logger.error(`Redis LRANGE 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const list = this.getListFromMemory(key);
    if (stop === -1) {
      return list.slice(start);
    }
    return list.slice(start, stop + 1);
  }

  async llen(key: string): Promise<number> {
    if (this.isRedisAvailable()) {
      try {
        return await this.client!.llen(key);
      } catch (error: any) {
        this.logger.error(`Redis LLEN 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    return this.getListFromMemory(key).length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        await this.client!.ltrim(key, start, stop);
        return;
      } catch (error: any) {
        this.logger.error(`Redis LTRIM 错误: ${error.message}`);
      }
    }
    // 备用内存存储
    const list = this.getListFromMemory(key);
    const trimmed = stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
    this.setListToMemory(key, trimmed);
  }

  private getListFromMemory(key: string): string[] {
    const item = this.memoryStore.get(key);
    if (item) {
      try {
        return JSON.parse(item.value);
      } catch {
        return [];
      }
    }
    return [];
  }

  private setListToMemory(key: string, list: string[]): void {
    this.memoryStore.set(key, { value: JSON.stringify(list) });
  }
}
