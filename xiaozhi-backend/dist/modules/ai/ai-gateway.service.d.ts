import { AIRequest, AIResponse, AIStreamResponse } from './ai-adapter.interface';
import { ModelConfigService } from '../../config/model-config.service';
export declare class AIGatewayService {
    private modelConfigService;
    private readonly logger;
    private adapters;
    constructor(modelConfigService: ModelConfigService);
    private initializeAdapters;
    complete(request: AIRequest): Promise<AIResponse>;
    stream(request: AIRequest): AsyncGenerator<AIStreamResponse>;
    getSupportedModels(): string[];
    getModelConfigs(): {
        id: string;
        name: string;
        provider: "openai" | "anthropic" | "custom";
        maxTokens: number | undefined;
        temperature: number | undefined;
        enabled: boolean;
    }[];
    isModelAvailable(modelId: string): boolean;
}
