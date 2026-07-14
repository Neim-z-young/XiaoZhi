import { WorkspacesService } from './workspaces.service';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    create(createDto: {
        name: string;
        description?: string;
        rootPath: string;
    }): Promise<import("../../entities/workspace.entity").Workspace>;
    findAll(): Promise<import("../../entities/workspace.entity").Workspace[]>;
    findOne(id: string): Promise<import("../../entities/workspace.entity").Workspace>;
    update(id: string, updateDto: any): Promise<import("../../entities/workspace.entity").Workspace>;
    remove(id: string): Promise<void>;
    getFileTree(id: string, path?: string): Promise<any>;
    search(id: string, q: string): Promise<any[]>;
}
