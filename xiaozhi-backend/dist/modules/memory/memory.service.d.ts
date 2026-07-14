import { ConfigService } from '../../config/configuration';
export declare class MemoryService {
    private readonly configService;
    constructor(configService: ConfigService);
    writeShortTerm(sessionId: string, content: string, role: 'user' | 'assistant' | 'system'): Promise<void>;
    readShortTerm(sessionId: string): Promise<any[]>;
    writeLongTerm(userId: string, agentId: string, content: string, embedding: number[]): Promise<void>;
    searchLongTerm(userId: string, agentId: string, query: string, embedding: number[], topK?: number): Promise<any[]>;
    consolidate(sessionId: string, agentId: string): Promise<void>;
}
