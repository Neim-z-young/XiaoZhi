export interface SandboxOptions {
    timeout?: number;
    maxMemory?: number;
    allowNetwork?: boolean;
    allowFileSystem?: boolean;
}
export interface ExecuteResult {
    success: boolean;
    result?: any;
    error?: string;
    logs?: string[];
}
export declare class SandboxService {
    private readonly logger;
    execute(code: string, context?: Record<string, any>, options?: SandboxOptions): Promise<ExecuteResult>;
    executeFunction(fn: Function, args?: any[], context?: Record<string, any>, options?: SandboxOptions): Promise<ExecuteResult>;
}
