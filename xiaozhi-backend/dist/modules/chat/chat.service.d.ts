import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';
export declare class ChatService {
    private readonly sessionRepository;
    private readonly messageRepository;
    private readonly agentRepository;
    constructor(sessionRepository: Repository<Session>, messageRepository: Repository<Message>, agentRepository: Repository<Agent>);
    sendMessage(sessionId: string, userId: string, content: string): Promise<Message>;
    getMessages(sessionId: string, userId: string, before?: string, limit?: number): Promise<Message[]>;
    feedback(messageId: string, userId: string, rating: 'like' | 'dislike', comment?: string): Promise<Message>;
}
