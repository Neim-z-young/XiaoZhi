import { Agent } from './agent.entity';
import { Session } from './session.entity';
import { Workspace } from './workspace.entity';
import { KnowledgeBase } from './knowledge-base.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    avatar: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    agents: Agent[];
    sessions: Session[];
    workspaces: Workspace[];
    knowledgeBases: KnowledgeBase[];
}
