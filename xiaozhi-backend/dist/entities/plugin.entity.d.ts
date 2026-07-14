import { Agent } from './agent.entity';
export declare class Plugin {
    id: string;
    name: string;
    type: 'mcp' | 'a2a' | 'builtin';
    description: string;
    config: Record<string, any>;
    enabled: boolean;
    installedAt: Date;
    updatedAt: Date;
    agents: Agent[];
}
