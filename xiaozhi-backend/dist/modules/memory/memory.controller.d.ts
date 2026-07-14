import { MemoryService } from './memory.service';
export declare class MemoryController {
    private readonly memoryService;
    constructor(memoryService: MemoryService);
    writeShortTerm(body: {
        sessionId: string;
        content: string;
        role: 'user' | 'assistant' | 'system';
    }): Promise<void>;
    readShortTerm(sessionId: string): Promise<any[]>;
    writeLongTerm(body: {
        agentId: string;
        content: string;
        embedding: number[];
    }): Promise<void>;
    searchLongTerm(body: {
        agentId: string;
        query: string;
        embedding: number[];
        topK?: number;
    }): Promise<any[]>;
    consolidate(body: {
        sessionId: string;
        agentId: string;
    }): Promise<void>;
}
