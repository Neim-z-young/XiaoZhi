import { Repository } from 'typeorm';
import { Agent } from '../../entities/agent.entity';
export declare class AgentsService {
    private readonly agentRepository;
    constructor(agentRepository: Repository<Agent>);
    create(userId: string, createAgentDto: any): Promise<Agent>;
    findAll(userId: string, page?: number, pageSize?: number, keyword?: string): Promise<{
        list: Agent[];
        total: number;
    }>;
    findOne(id: string, userId: string): Promise<Agent>;
    update(id: string, userId: string, updateAgentDto: any): Promise<Agent>;
    remove(id: string, userId: string): Promise<void>;
}
