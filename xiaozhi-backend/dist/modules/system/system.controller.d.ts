import { SystemService } from './system.service';
export declare class SystemController {
    private readonly systemService;
    constructor(systemService: SystemService);
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
