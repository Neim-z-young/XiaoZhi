import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
export declare class SessionsService {
    private readonly sessionRepository;
    private readonly messageRepository;
    constructor(sessionRepository: Repository<Session>, messageRepository: Repository<Message>);
    create(userId: string, createSessionDto: any): Promise<Session>;
    findAll(userId: string, page?: number, pageSize?: number, agentId?: string): Promise<{
        list: Session[];
        total: number;
    }>;
    findOne(id: string, userId: string): Promise<Session>;
    update(id: string, userId: string, updateSessionDto: any): Promise<Session>;
    remove(id: string, userId: string): Promise<void>;
    getMessages(sessionId: string, userId: string, before?: string, limit?: number): Promise<Message[]>;
    updateLastMessageTime(sessionId: string): Promise<void>;
}
