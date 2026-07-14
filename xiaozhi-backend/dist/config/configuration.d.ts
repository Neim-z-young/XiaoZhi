export declare class ConfigService {
    private readonly config;
    constructor();
    get<T = any>(key: string): T;
    getAll(): Record<string, any>;
}
