import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    login(username: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
    validateToken(token: string): Promise<any>;
}
