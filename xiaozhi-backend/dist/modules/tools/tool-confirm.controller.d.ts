import { ToolRegistry, ToolCall } from '../tools/tool-registry.service';
export declare class ToolConfirmController {
    private readonly toolRegistry;
    constructor(toolRegistry: ToolRegistry);
    getPendingConfirmations(): ToolCall[];
    getPendingConfirmation(id: string): ToolCall | undefined;
    approveConfirmation(id: string): Promise<{
        success: boolean;
        content: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        content?: undefined;
    }>;
    rejectConfirmation(id: string): {
        success: boolean;
    };
}
