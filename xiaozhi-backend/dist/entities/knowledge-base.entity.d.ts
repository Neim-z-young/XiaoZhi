import { User } from './user.entity';
export declare class KnowledgeBase {
    id: string;
    userId: string;
    name: string;
    description: string;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    user: User;
}
