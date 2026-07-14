import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../../config/configuration';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private client;
    private isConnected;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    lpush(key: string, value: string): Promise<void>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
}
