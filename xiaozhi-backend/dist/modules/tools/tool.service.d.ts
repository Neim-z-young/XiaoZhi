import { ToolRegistry } from './tool-registry.service';
export declare class ToolService {
    private readonly toolRegistry;
    private readonly logger;
    constructor(toolRegistry: ToolRegistry);
    private registerBuiltInTools;
}
