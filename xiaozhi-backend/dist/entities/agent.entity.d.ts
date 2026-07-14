import { User } from './user.entity';
import { Plugin } from './plugin.entity';
export declare class Agent {
    id: string;
    userId: string;
    user: User;
    name: string;
    description: string;
    avatar: string;
    modelId: string;
    prompt: string;
    settings: Record<string, any>;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    plugins: Plugin[];
}
