export declare class CreateAgentDto {
    name: string;
    description?: string;
    avatar?: string;
    modelId: string;
    prompt?: string;
    pluginIds?: string[];
    enabled?: boolean;
}
