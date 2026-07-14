import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';
import { AIGatewayService } from '../ai/ai-gateway.service';
export declare class ChatService {
    private readonly sessionRepository;
    private readonly messageRepository;
    private readonly agentRepository;
    private readonly aiGateway;
    private readonly logger;
    constructor(sessionRepository: Repository<Session>, messageRepository: Repository<Message>, agentRepository: Repository<Agent>, aiGateway: AIGatewayService);
    sendMessage(sessionId: string, userId: string, content: string): Promise<Message>;
    getMessages(sessionId: string, userId: string, before?: string, limit?: number): Promise<Message[]>;
    feedback(messageId: string, userId: string, rating: 'like' | 'dislike', comment?: string): Promise<Message>;
}
