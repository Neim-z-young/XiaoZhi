import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
export declare class AgentsController {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    create(createAgentDto: CreateAgentDto): Promise<import("../../entities/agent.entity").Agent>;
    findAll(page?: number, pageSize?: number, keyword?: string): Promise<{
        list: import("../../entities/agent.entity").Agent[];
        total: number;
    }>;
    findOne(id: string): Promise<import("../../entities/agent.entity").Agent>;
    update(id: string, updateAgentDto: UpdateAgentDto): Promise<import("../../entities/agent.entity").Agent>;
    remove(id: string): Promise<void>;
}
