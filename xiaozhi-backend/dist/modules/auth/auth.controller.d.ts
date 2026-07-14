import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        token: string;
        user: any;
    }>;
    refresh(body: {
        refreshToken: string;
    }): {
        message: string;
    };
    logout(): {
        success: boolean;
    };
}
