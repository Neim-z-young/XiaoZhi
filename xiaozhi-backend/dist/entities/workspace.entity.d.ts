import { User } from './user.entity';
export declare class Workspace {
    id: string;
    userId: string;
    name: string;
    description: string;
    rootPath: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    user: User;
}
