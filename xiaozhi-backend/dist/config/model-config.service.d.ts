import { ConfigService } from './configuration';
import { AIModelConfig } from './app-config.interface';
export declare class ModelConfigService {
    private configService;
    private readonly logger;
    private modelConfigs;
    private defaultModelId;
    constructor(configService: ConfigService);
    private loadModelConfigs;
    getModel(id: string): AIModelConfig | undefined;
    getDefaultModel(): AIModelConfig | undefined;
    getAllModels(): AIModelConfig[];
    getEnabledModels(): AIModelConfig[];
    addModel(config: AIModelConfig): void;
    updateModel(id: string, updates: Partial<AIModelConfig>): void;
    removeModel(id: string): void;
    isModelEnabled(id: string): boolean;
}
