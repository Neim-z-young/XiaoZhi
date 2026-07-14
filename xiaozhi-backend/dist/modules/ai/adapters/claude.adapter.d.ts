import { AIAdapter, AIRequest, AIResponse, AIStreamResponse } from '../ai-adapter.interface';
import { AIModelConfig } from '../../../config/app-config.interface';
export declare class ClaudeAdapter implements AIAdapter {
    private apiKey;
    private baseURL;
    constructor(config: AIModelConfig);
    complete(request: AIRequest): Promise<AIResponse>;
    stream(request: AIRequest): AsyncGenerator<AIStreamResponse>;
}
