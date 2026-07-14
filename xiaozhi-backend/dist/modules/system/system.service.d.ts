import { ConfigService } from '../../config/configuration';
export declare class SystemService {
    private readonly configService;
    constructor(configService: ConfigService);
    getHealth(): {
        status: string;
        version: string;
        timestamp: string;
    };
    getModels(): {
        default: any;
        list: any;
    };
    getStats(): {
        sessions: number;
        agents: number;
        messages: number;
        plugins: number;
    };
}
