import { ModelConfigService } from '../../config/model-config.service';
import { AIModelConfig } from '../../config/app-config.interface';
export declare class ModelsController {
    private readonly modelConfigService;
    constructor(modelConfigService: ModelConfigService);
    getAllModels(): {
        models: {
            id: string;
            name: string;
            provider: "openai" | "anthropic" | "custom";
            maxTokens: number | undefined;
            temperature: number | undefined;
            enabled: boolean;
            hasApiKey: boolean;
        }[];
    };
    getEnabledModels(): {
        models: {
            id: string;
            name: string;
            provider: "openai" | "anthropic" | "custom";
            maxTokens: number | undefined;
            temperature: number | undefined;
        }[];
    };
    getModel(id: string): {
        error: string;
        id?: undefined;
        name?: undefined;
        provider?: undefined;
        baseURL?: undefined;
        maxTokens?: undefined;
        temperature?: undefined;
        enabled?: undefined;
        hasApiKey?: undefined;
    } | {
        id: string;
        name: string;
        provider: "openai" | "anthropic" | "custom";
        baseURL: string;
        maxTokens: number | undefined;
        temperature: number | undefined;
        enabled: boolean;
        hasApiKey: boolean;
        error?: undefined;
    };
    addModel(body: AIModelConfig): {
        error: string;
        success?: undefined;
        model?: undefined;
    } | {
        success: boolean;
        model: AIModelConfig;
        error?: undefined;
    };
    updateModel(id: string, updates: Partial<AIModelConfig>): {
        success: boolean;
    };
    deleteModel(id: string): {
        success: boolean;
    };
    enableModel(id: string): {
        success: boolean;
    };
    disableModel(id: string): {
        success: boolean;
    };
}
