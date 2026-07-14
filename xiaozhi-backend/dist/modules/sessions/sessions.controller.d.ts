import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(createSessionDto: CreateSessionDto): Promise<import("../../entities/session.entity").Session>;
    findAll(page?: number, pageSize?: number, agentId?: string): Promise<{
        list: import("../../entities/session.entity").Session[];
        total: number;
    }>;
    findOne(id: string): Promise<import("../../entities/session.entity").Session>;
    update(id: string, updateSessionDto: any): Promise<import("../../entities/session.entity").Session>;
    remove(id: string): Promise<void>;
    getMessages(id: string, before?: string, limit?: number): Promise<import("../../entities/message.entity").Message[]>;
}
