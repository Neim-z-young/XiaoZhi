import { Response } from 'express';
import { AgentExecutor } from './agent-executor.service';
export declare class AgentController {
    private readonly agentExecutor;
    private readonly logger;
    constructor(agentExecutor: AgentExecutor);
    streamChat(message: string, model: string, sessionId: string, res: Response): Promise<void>;
}
