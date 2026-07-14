import { User } from './user.entity';
import { Agent } from './agent.entity';
import { Message } from './message.entity';
export declare class Session {
    id: string;
    userId: string;
    agentId: string;
    workspaceId: string;
    title: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    user: User;
    agent: Agent;
    messages: Message[];
}
