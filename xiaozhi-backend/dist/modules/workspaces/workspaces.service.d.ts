import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity';
export declare class WorkspacesService {
    private readonly workspaceRepository;
    constructor(workspaceRepository: Repository<Workspace>);
    create(userId: string, createDto: any): Promise<Workspace>;
    findAll(userId: string): Promise<Workspace[]>;
    findOne(id: string, userId: string): Promise<Workspace>;
    update(id: string, userId: string, updateDto: any): Promise<Workspace>;
    remove(id: string, userId: string): Promise<void>;
    getFileTree(id: string, userId: string, relativePath?: string): Promise<any>;
    search(id: string, userId: string, query: string): Promise<any[]>;
}
